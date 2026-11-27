export const parseMinutes = (value) => {
  const matches = String(value || '').match(/\d+(?:\.\d+)?/g);
  if (!matches?.length) return 0;
  return Math.round(Number(matches[matches.length - 1]) || 0);
};

export function phaseDuration(steps) {
  const minutes = steps.reduce((sum, step) => sum + parseMinutes(step.time || step.duration), 0);
  return `${minutes} 分钟`;
}

const phaseNames = { engage: ['eng', '引入'], empower: ['emp', '赋能'], execute: ['exc', '实践'], elevate: ['elv', '升华'] };

function storedPhases(value) {
  if (typeof value === 'string') {
    try { return storedPhases(JSON.parse(value)); } catch { return null; }
  }
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    return Object.fromEntries(value.filter(Boolean).map(phase => [
      String(phase.key || phase.id || phase.phase || '').toLowerCase(), phase,
    ]));
  }
  const saved = storedPhases(value.courseData) || storedPhases(value.parsedCourseData);
  if (saved) return saved;
  if (Object.entries(phaseNames).some(([long, [short]]) => value[long] || value[short])) return value;
  return storedPhases(value.text);
}

export function lessonText(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') return Object.values(value).map(lessonText).filter(Boolean).join('\n');
  return '';
}

export function normalizeLessonStep(step) {
  const flow = step.activitySteps || step.flow;
  // Older workflows also return an array of steps. Keep explicit guidance alongside each row.
  const rows = Array.isArray(flow) ? flowRows(flow) : null;
  return {
    id: step.id, title: lessonText(step.title), duration: lessonText(step.time || step.duration),
    goal: lessonText(step.objective || step.goal), activity: lessonText(step.activity),
    flow: rows ? composeFlowFromSteps(rows) : lessonText(flow),
    resources: lessonText(step.resources), scenario: lessonText(step.scenario),
    teacherScript: lessonText(step.script || step.teacherScript) || (rows ? composeScriptFromSteps(rows) : ''),
  };
}

export function resolveLessonPhases(course) {
  const phases = storedPhases(course?.courseData || course?.course_data || course);
  if (!phases) return null;
  return Object.entries(phaseNames).map(([key, [shortKey, name]]) => {
    const phase = phases[key] || phases[shortKey];
    const steps = Array.isArray(phase?.steps) ? phase.steps.filter(Boolean).map(normalizeLessonStep) : [];
    const phaseName = key.charAt(0).toUpperCase() + key.slice(1);
    return {
      ...phase, key: shortKey, phase: phaseName, name, title: phase?.title || phaseName,
      duration: phaseDuration(steps), steps,
    };
  });
}

function flowRows(flow) {
  if (Array.isArray(flow)) return flow.flatMap(item => typeof item === 'string'
    ? flowRows(item)
    : item && typeof item === 'object' ? [{ title: item.title || '', desc: item.desc || item.description || '', teacher: item.teacher || '', cue: item.cue || '' }] : []);
  if (typeof flow !== 'string') return [];
  return flow.split(/\r?\n|[①②③④⑤⑥⑦⑧⑨⑩]|(?:^|\s)\d+[、)]\s*|(?:^|\s)\d+\.\s+/)
    .map(line => line.trim()).filter(Boolean)
    .map(line => {
      const label = line.match(/^([^：:。！？.!?]{1,32})[：:](?!\/\/)(.*)$/u);
      return label ? { title: label[1].trim(), desc: label[2].trim() } : { title: '', desc: line };
    });
}

export function buildStepFlowItems(step, isEn = false) {
  return flowRows(step?.flow).map((row, index) => ({
    ...row, title: row.title || (isEn ? `Step ${index + 1}` : `步骤 ${index + 1}`),
  }));
}

function splitScriptLine(line) {
  const separator = '【动作/引导】';
  const index = line.indexOf(separator);
  return index < 0 ? { teacher: line, cue: '' }
    : { teacher: line.slice(0, index).trim(), cue: line.slice(index + separator.length).trim() };
}

export function lessonExecution(step, isEn = false) {
  const items = buildStepFlowItems(step, isEn);
  const script = typeof step?.teacherScript === 'string' ? step.teacherScript : '';
  const lines = script.trim() ? script.split(/\r?\n/) : [];
  if (!lines.length || lines.length !== items.length) return { items, script };
  return { items: items.map((item, index) => ({ ...item, ...splitScriptLine(lines[index]) })), script: '' };
}

export function createFlowStepsForForm(step) {
  const rows = flowRows(step?.flow);
  const script = typeof step?.teacherScript === 'string' ? step.teacherScript : '';
  if (!script.trim()) return rows;
  const lines = script.split(/\r?\n/);
  if (lines.length === rows.length) return rows.map((row, i) => ({ ...row, ...splitScriptLine(lines[i]) }));
  if (!rows.length) return [{ title: '', desc: '', teacher: script, cue: '' }];
  return rows.map((row, i) => i === 0 ? { ...row, teacher: script } : row);
}

export function composeFlowFromSteps(flowSteps = []) {
  return flowSteps.map(item => {
    const title = (item?.title || '').trim();
    const desc = (item?.desc || '').trim();
    return title ? `${title}：${desc}` : desc;
  }).filter(Boolean).join('\n');
}

export function composeScriptFromSteps(flowSteps = []) {
  const lines = flowSteps.map(item => [item?.teacher, item?.cue && `【动作/引导】${item.cue}`].filter(Boolean).join(' '));
  return lines.some(line => line.trim()) ? lines.join('\n') : '';
}
