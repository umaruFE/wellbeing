import { phaseTemplates } from '../workflowData';

export const PHASES = [
  { key: 'engage', title: 'E-ENGAGE 引入', tone: 'engage', color: '#9b63dc' },
  { key: 'empower', title: 'E-EMPOWER 赋能', tone: 'empower', color: '#3f83e8' },
  { key: 'execute', title: 'E-EXECUTE 实践', tone: 'execute', color: '#4caf72' },
  { key: 'elevate', title: 'E-ELEVATE 升华', tone: 'elevate', color: '#ff705d' },
];

const shortPhaseKeyMap = {
  eng: 'engage',
  emp: 'empower',
  exc: 'execute',
  elv: 'elevate',
};

export function createTextLayer(overrides = {}) {
  return {
    id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'text',
    title: '标题文字',
    x: 72,
    y: 70,
    width: 360,
    height: 88,
    rotation: 0,
    content: '双击编辑文本',
    fontSize: 34,
    fontWeight: 'bold',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#253142',
    strokeColor: '#ffffff',
    strokeWidth: 0,
    textAlign: 'center',
    ...overrides,
  };
}

export function createMediaLayer(type, overrides = {}) {
  const config = {
    image: { title: '主题意境图', width: 300, height: 190, x: 88, y: 150, icon: 'image' },
    video: { title: '视频素材', width: 350, height: 210, x: 256, y: 130, icon: 'video' },
    audio: { title: '音频素材', width: 280, height: 52, x: 140, y: 300, icon: 'audio' },
  }[type];

  return {
    id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    rotation: 0,
    prompt: '',
    duration: '',
    videoMeta: type === 'video'
      ? { videoType: '', scene: '', chars: '', vocab: 0, sents: 0, autoplay: true, loop: false, muted: false }
      : null,
    ...config,
    ...overrides,
  };
}

function createSlide(index, title, layers = []) {
  return {
    id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `${title} ${index + 1}`,
    background: '#ffffff',
    layers,
  };
}

function normalizeStep(rawStep, phaseKey, index) {
  const title = rawStep.title || rawStep.name || `课件页面 ${index + 1}`;
  const layers = rawStep.layers || rawStep.canvasAssets || rawStep.assets || rawStep.elements || [];
  return {
    id: rawStep.id || `${phaseKey}-step-${index}`,
    title,
    slides: rawStep.slides?.length
      ? rawStep.slides.map((slide, slideIndex) => ({
          id: slide.id || `${phaseKey}-${index}-slide-${slideIndex}`,
          title: slide.title || `${title} ${slideIndex + 1}`,
          background: slide.background || '#ffffff',
          layers: slide.layers || slide.canvasAssets || slide.assets || [],
        }))
      : [
          {
            id: `${phaseKey}-${index}-slide-0`,
            title,
            background: '#ffffff',
            layers,
          },
        ],
  };
}

function normalizePhasesArray(rawPhases = []) {
  const phaseObject = {};
  rawPhases.forEach((phase) => {
    const phaseKey = shortPhaseKeyMap[phase.key] || phase.key?.toLowerCase?.();
    if (!phaseKey) return;
    phaseObject[phaseKey] = {
      title: phase.title || phase.phase,
      steps: phase.steps || [],
    };
  });
  return normalizeFromObject(phaseObject);
}

function normalizeFromObject(courseData) {
  return PHASES.map((phase) => {
    const rawPhase = courseData?.[phase.key] || courseData?.[Object.keys(shortPhaseKeyMap).find((key) => shortPhaseKeyMap[key] === phase.key)];
    const rawSteps = rawPhase?.steps || rawPhase?.slides;
    return {
      ...phase,
      steps: rawSteps?.length
        ? rawSteps.map((step, index) => normalizeStep(step, phase.key, index))
        : [],
    };
  });
}

export function buildInitialPptCourse(initialCourseData) {
  if (typeof initialCourseData === 'string') {
    try {
      return normalizeFromObject(JSON.parse(initialCourseData));
    } catch {
      return normalizeFromObject(null);
    }
  }

  if (Array.isArray(initialCourseData)) {
    return normalizePhasesArray(initialCourseData);
  }

  if (initialCourseData && typeof initialCourseData === 'object') {
    return normalizeFromObject(initialCourseData);
  }

  return normalizePhasesArray(phaseTemplates);
}
