type RecordData = Record<string, unknown>;

const object = (value: unknown): RecordData =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as RecordData : {};
const list = (value: unknown) => Array.isArray(value) ? value.map(object) : [];
const text = (value: unknown) => typeof value === 'string' ? value : '';

// The source is a stored activity selected by ownership. Only its confirmed version is shared.
export function publishedCase(moduleId: string, id: string, value: unknown) {
  const work = object(value);
  if (moduleId === 'move-match') {
    const release = list(work.releases).find(item => item.id === work.activeReleaseId);
    const lesson = object(release?.lesson);
    if (!list(lesson.items).length) return null;
    return {
      id, title: lesson.title, nameZh: lesson.title, subtitle: lesson.subtitle,
      items: lesson.items, categories: lesson.categories, lesson, settings: release?.settings,
    };
  }
  if (moduleId === 'spin-speak') {
    const version = object(work.published);
    const preview = object(version.content);
    if (!version.game || !Object.keys(preview).length) return null;
    const input = text(version.input) || (work.finalized === true ? text(work.input) : '');
    const pack = version.pack || (work.finalized === true ? work.pack : null);
    const practice = [
      text(preview.line), ...(Array.isArray(preview.lines) ? preview.lines.map(text) : []),
      text(preview.question), ...list(preview.qa).flatMap(pair => [text(pair.q), text(pair.a)]),
      ...list(preview.answers).map(answer => text(answer.text)),
      Array.isArray(preview.words) ? preview.words.map(text).join(' ') : '',
    ].filter(Boolean).join('\n');
    return { id, title: version.title, game: version.game, preview, input: input || practice, pack };
  }
  if (moduleId === 'yoga') {
    const state = object(work.state);
    const published = object(state.published);
    const course = object(published.course);
    if (!list(course.pages).length) return null;
    const settings = object(course.settings);
    return {
      id,
      meta: { id, title: course.title, description: settings.goal, theme: settings.theme },
      state: {
        schema: state.schema, settings, draft: course, published, versions: [published],
        candidate: null, job: null, lastJob: null, nextJobId: 1,
      },
    };
  }
  const draft = object(object(work._publication).draft);
  if (moduleId === 'doodle') return Array.isArray(draft.words) && draft.words.length ? { ...draft, id } : null;
  if (!list(draft.lines).length) return null;
  if (moduleId === 'song') return { id, title: draft.title, description: object(draft.settings).theme, draft };
  return {
    id, draft,
    meta: {
      id, name: draft.activityName || draft.title,
      theme: draft.song === 'sunny' ? 'sunny' : 'space',
      goal: object(draft.creationConditions).goal || '',
      targets: object(draft.creationConditions).vocabulary || '',
    },
  };
}
