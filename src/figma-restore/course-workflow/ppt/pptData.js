import { phaseTemplates } from '../workflowData';

export const PHASES = [
  { key: 'engage', title: 'E-ENGAGE 引入', tone: 'engage', color: '#9b63dc' },
  { key: 'empower', title: 'E-EMPOWER 赋能', tone: 'empower', color: '#3f83e8' },
  { key: 'execute', title: 'E-EXECUTE 实践', tone: 'execute', color: '#4caf72' },
  { key: 'elevate', title: 'E-ELEVATE 升华', tone: 'elevate', color: '#ff705d' },
];

const demoSteps = {
  engage: [
    { title: '星际信号接收站', slideCount: 2 },
    { title: '动物能量球在哪里？', slideCount: 1 },
  ],
  empower: [
    { title: '救援地图解码器', slideCount: 2 },
    { title: 'Home Rescue 快问答', slideCount: 2 },
  ],
  execute: [
    { title: '建造动物家园发射台', slideCount: 1 },
  ],
  elevate: [
    { title: '星光祝福图 & 强力闪卡', slideCount: 1 },
    { title: '急急报告：时间折叠舱', slideCount: 1 },
  ],
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
    video: { title: '银河交通图叙事视频', width: 350, height: 210, x: 256, y: 130, icon: 'video' },
    audio: { title: '星际背景音效', width: 280, height: 82, x: 140, y: 300, icon: 'audio' },
  }[type];

  return {
    id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    rotation: 0,
    prompt: '深蓝色太空背景，明亮星点，儿童英语课堂探险感。',
    duration: type === 'video' ? '02:16' : type === 'audio' ? '02:16' : '',
    videoMeta: type === 'video'
      ? { videoType: '体能闯关', scene: '森林 / 闯关型', chars: 'Poppy, Edi', vocab: 12, sents: 5, autoplay: true, loop: false, muted: false }
      : null,
    ...config,
    ...overrides,
  };
}

function createSlide(index, title) {
  const isCover = index === 0;
  const isSelectedTextDemo = index === 1;
  return {
    id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `${title} ${index + 1}`,
    background: '#ffffff',
    layers: isCover
      ? [
          createTextLayer({
            title: '太空探险指引文字',
            content: title,
            x: 70,
            y: 54,
            width: 420,
            height: 76,
            color: '#ff705d',
            strokeColor: '#fff3ec',
            strokeWidth: 1,
          }),
          createMediaLayer('video', { x: 260, y: 148, width: 360, height: 220 }),
          createMediaLayer('audio', { x: 72, y: 340, width: 250, height: 74 }),
        ]
      : isSelectedTextDemo
        ? [
            createTextLayer({
              id: 'demo-selected-text-layer',
              title: '标题文字1',
              content: '星际信号接收站',
              x: 320,
              y: 202,
              width: 300,
              height: 46,
              rotation: 0,
              fontFamily: '思源黑体 (Bold)',
              fontSize: 32,
              fontWeight: 'bold',
              fontStyle: 'normal',
              textDecoration: 'none',
              color: '#F4785E',
              strokeColor: '#F4785E',
              strokeWidth: 2,
              textAlign: 'center',
            }),
          ]
        : [],
  };
}

function normalizeStep(rawStep, phaseKey, index) {
  const title = rawStep.title || rawStep.name || `课件页面 ${index + 1}`;
  const layers = rawStep.canvasAssets || rawStep.assets || rawStep.elements || [];
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

function normalizeFromObject(courseData) {
  return PHASES.map((phase) => {
    const rawPhase = courseData?.[phase.key];
    const rawSteps = rawPhase?.steps || rawPhase?.slides;
    return {
      ...phase,
      steps: rawSteps?.length
        ? rawSteps.map((step, index) => normalizeStep(step, phase.key, index))
        : (demoSteps[phase.key] || []).map((step, index) => ({
            id: `${phase.key}-demo-${index}`,
            title: step.title,
            slides: Array.from({ length: step.slideCount }, (_, slideIndex) => createSlide(slideIndex, step.title)),
          })),
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
    return PHASES.map((phase) => {
      const rawPhase = initialCourseData.find((item) => item.key === phase.key || item.id === phase.key);
      return {
        ...phase,
        steps: rawPhase?.steps?.length
          ? rawPhase.steps.map((step, index) => normalizeStep(step, phase.key, index))
          : (demoSteps[phase.key] || []).map((step, index) => ({
              id: `${phase.key}-demo-${index}`,
              title: step.title,
              slides: Array.from({ length: step.slideCount }, (_, slideIndex) => createSlide(slideIndex, step.title)),
            })),
      };
    });
  }

  if (initialCourseData && typeof initialCourseData === 'object') {
    return normalizeFromObject(initialCourseData);
  }

  return PHASES.map((phase) => {
    const template = phaseTemplates.find((item) => item.key === phase.key);
    return {
      ...phase,
      steps: (template?.steps?.length ? template.steps : demoSteps[phase.key]).map((step, index) => ({
        id: `${phase.key}-step-${index}`,
        title: step.title,
        slides: Array.from({ length: step.slideCount || 1 }, (_, slideIndex) => createSlide(slideIndex, step.title)),
      })),
    };
  });
}
