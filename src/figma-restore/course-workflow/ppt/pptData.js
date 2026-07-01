import i18next from 'i18next';
import { phaseTemplates } from '../workflowData';

export const PHASES = [
  { key: 'engage', title: 'ENGAGE 引入', tone: 'engage', color: '#9b63dc' },
  { key: 'empower', title: 'EMPOWER 赋能', tone: 'empower', color: '#3f83e8' },
  { key: 'execute', title: 'EXECUTE 实践', tone: 'execute', color: '#4caf72' },
  { key: 'elevate', title: 'ELEVATE 升华', tone: 'elevate', color: '#ff705d' },
];

export const PPT_SLIDE_WIDTH = 940;
export const PPT_SLIDE_HEIGHT = 529;

export function fitLayerToSlide(layer, { center = false } = {}) {
  const next = { ...layer };
  const isMedia = next.type === 'image' || next.type === 'video';
  const maxWidth = PPT_SLIDE_WIDTH * 0.9;
  const maxHeight = PPT_SLIDE_HEIGHT * 0.9;
  let width = Math.max(28, Number(next.width) || (next.type === 'audio' ? 280 : 300));
  let height = Math.max(28, Number(next.height) || (next.type === 'audio' ? 52 : 190));

  if (isMedia && (width > maxWidth || height > maxHeight)) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width *= ratio;
    height *= ratio;
  } else {
    width = Math.min(width, PPT_SLIDE_WIDTH);
    height = Math.min(height, PPT_SLIDE_HEIGHT);
  }

  next.width = Math.round(width);
  next.height = Math.round(height);
  next.x = center
    ? Math.round((PPT_SLIDE_WIDTH - next.width) / 2)
    : Math.round(Math.min(Math.max(Number(next.x) || 0, 0), PPT_SLIDE_WIDTH - next.width));
  next.y = center
    ? Math.round((PPT_SLIDE_HEIGHT - next.height) / 2)
    : Math.round(Math.min(Math.max(Number(next.y) || 0, 0), PPT_SLIDE_HEIGHT - next.height));
  return next;
}

export const PPT_TEMPLATES = [
  {
    id: 'blue-business',
    name: '蓝色商务风',
    nameEn: 'Blue Business Style',
    description: '来自“蓝色商务风年度工作报告PPT模板”，适合清晰、专业的课程说明。',
    descriptionEn: 'Based on a blue business annual report template, suitable for clear and professional course presentations.',
    pptxUrl: '/ppt/蓝色商务风年度工作报告PPT模板.pptx',
    coverImage: '/ppt/backgrounds/blue-business.jpeg',
    backgroundImage: '',
    background: '#f5f8ff',
    panel: 'rgba(255,255,255,0.86)',
    accent: '#2768c7',
    accentSoft: '#dce9ff',
    titleColor: '#153869',
    bodyColor: '#2f4668',
  },
  {
    id: 'red-business',
    name: '红色商务风',
    nameEn: 'Red Business Style',
    description: '来自“红色商务风个人部门工作总结汇报”，适合重点突出、节奏鲜明的课件。',
    descriptionEn: 'Based on a red business summary template, suitable for focused courseware with a strong rhythm.',
    pptxUrl: '/ppt/红色商务风个人部门工作总结汇报.pptx',
    coverImage: '/ppt/backgrounds/red-business.png',
    backgroundImage: '',
    background: '#fff5f2',
    panel: 'rgba(255,255,255,0.88)',
    accent: '#c83d2e',
    accentSoft: '#ffe1da',
    titleColor: '#5b1f19',
    bodyColor: '#523832',
  },
  {
    id: 'nature-business',
    name: '自然叠底商务风',
    nameEn: 'Natural Overlay Business Style',
    description: '来自“透明叠底大气自然商务风总结汇报”，适合更有空间感的展示。',
    descriptionEn: 'Based on a natural overlay business template, suitable for spacious and atmospheric presentations.',
    pptxUrl: '/ppt/透明叠底大气自然商务风总结汇报.pptx',
    coverImage: '/ppt/backgrounds/nature-business.jpeg',
    backgroundImage: '',
    background: '#f2f5ef',
    panel: 'rgba(255,255,255,0.82)',
    accent: '#547b54',
    accentSoft: '#e3eddc',
    titleColor: '#1f3f32',
    bodyColor: '#364a3d',
  },
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
    title: i18next.t('assetPanel.titleText', 'Title Text'),
    x: 72,
    y: 70,
    width: 360,
    height: 88,
    rotation: 0,
    content: i18next.t('assetPanel.doubleClickEdit', 'Double-click to edit text'),
    fontSize: 34,
    fontWeight: 'bold',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#253142',
    strokeColor: '#ffffff',
    strokeWidth: 0,
    textAlign: 'center',
    verticalAlign: 'middle',
    lineHeight: 1.16,
    letterSpacing: 0,
    ...overrides,
  };
}

export function createMediaLayer(type, overrides = {}) {
  const config = {
    image: { title: i18next.t('assetPanel.imageAsset', 'Image Asset'), width: 300, height: 190, x: 88, y: 150, icon: 'image' },
    video: { title: i18next.t('assetPanel.videoAsset', 'Video Asset'), width: 350, height: 210, x: 256, y: 130, icon: 'video' },
    audio: { title: i18next.t('assetPanel.audioAsset', 'Audio Asset'), width: 280, height: 52, x: 140, y: 300, icon: 'audio' },
  }[type];

  return fitLayerToSlide({
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
  });
}

function getTemplate(templateId) {
  return PPT_TEMPLATES.find((template) => template.id === templateId) || PPT_TEMPLATES[0];
}

function compactText(value, fallback = '', maxLength = 120) {
  if (Array.isArray(value)) {
    return value
      .map((item) => compactText(item, '', maxLength))
      .filter(Boolean)
      .join('；')
      .slice(0, maxLength);
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .map((item) => compactText(item, '', maxLength))
      .filter(Boolean)
      .join('；')
      .slice(0, maxLength);
  }

  const text = String(value || fallback || '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function splitPoints(value, fallback) {
  const text = compactText(value, fallback, 220);
  return text
    .split(/[\n；;。]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function englishOnlyText(value, fallback = '', maxLength = 120) {
  const fallbackText = compactText(fallback, '', maxLength);
  const text = compactText(value, fallbackText, maxLength)
    .replace(/[\u4e00-\u9fff]+/g, '')
    .replace(/[，、；。：“”‘’（）]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || fallbackText;
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
  const layers = (rawStep.layers || rawStep.canvasAssets || rawStep.assets || rawStep.elements || [])
    .map((layer) => fitLayerToSlide(layer));
  return {
    id: rawStep.id || `${phaseKey}-step-${index}`,
    title,
    duration: rawStep.duration || rawStep.time || rawStep.minutes || '',
    objective: rawStep.objective || rawStep.goal || rawStep.learningGoal || rawStep.learningObjective || '',
    activity: rawStep.activity || rawStep.task || rawStep.classActivity || rawStep.studentActivity || '',
    flow: rawStep.flow || rawStep.process || rawStep.activitySteps || rawStep.stepsText || rawStep.teacherScript || '',
    resources: rawStep.resources || rawStep.materials || rawStep.assetsText || '',
    slides: rawStep.slides?.length
      ? rawStep.slides.map((slide, slideIndex) => ({
          id: slide.id || `${phaseKey}-${index}-slide-${slideIndex}`,
          title: slide.title || `${title} ${slideIndex + 1}`,
          background: slide.background || '#ffffff',
          backgroundImage: slide.backgroundImage || slide.background_image || '',
          templateId: slide.templateId || slide.template_id || '',
          layers: (slide.layers || slide.canvasAssets || slide.assets || [])
            .map((layer) => fitLayerToSlide(layer)),
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

function normalizeCoverPhase(rawPhase) {
  if (!rawPhase) return null;
  const rawSlide = rawPhase.steps?.[0]?.slides?.[0] || rawPhase.slides?.[0] || rawPhase.slide || rawPhase;
  if (!rawSlide?.layers?.length) return null;

  return {
    key: 'cover',
    title: rawPhase.title || '封面',
    tone: 'cover',
    color: rawPhase.color || '#253142',
    steps: [
      {
        id: rawPhase.steps?.[0]?.id || 'cover-step',
        title: rawPhase.steps?.[0]?.title || '课程封面',
        slides: [
          {
            id: rawSlide.id || 'cover-slide',
            title: rawSlide.title || '课程封面',
            background: rawSlide.background || '#ffffff',
            backgroundImage: rawSlide.backgroundImage || rawSlide.background_image || '',
            templateId: rawSlide.templateId || rawSlide.template_id || '',
            layers: (rawSlide.layers || []).map((layer) => fitLayerToSlide(layer)),
          },
        ],
      },
    ],
  };
}

function normalizePhasesArray(rawPhases = []) {
  const phaseObject = {};
  const coverPhase = rawPhases.find((phase) => phase?.key === 'cover');
  rawPhases.forEach((phase) => {
    const phaseKey = shortPhaseKeyMap[phase.key] || phase.key?.toLowerCase?.();
    if (!phaseKey) return;
    phaseObject[phaseKey] = {
      title: phase.title || phase.phase,
      steps: phase.steps || [],
    };
  });
  const normalized = normalizeFromObject(phaseObject);
  const normalizedCover = normalizeCoverPhase(coverPhase);
  return normalizedCover ? [normalizedCover, ...normalized] : normalized;
}

function normalizeFromObject(courseData) {
  const normalized = PHASES.map((phase) => {
    const rawPhase = courseData?.[phase.key] || courseData?.[Object.keys(shortPhaseKeyMap).find((key) => shortPhaseKeyMap[key] === phase.key)];
    const rawSteps = rawPhase?.steps || rawPhase?.slides;
    return {
      ...phase,
      steps: rawSteps?.length
        ? rawSteps.map((step, index) => normalizeStep(step, phase.key, index))
        : [],
    };
  });
  const normalizedCover = normalizeCoverPhase(courseData?.cover || courseData?.coverSlide || courseData?.cover_slide);
  return normalizedCover ? [normalizedCover, ...normalized] : normalized;
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

export function hasGeneratedPptContent(initialCourseData) {
  let source = initialCourseData;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      return false;
    }
  }

  if (source && typeof source === 'object' && !Array.isArray(source)) {
    source = source.canvasData || source.canvas_data || source.courseData || source.course_data || source;
  }

  const phases = Array.isArray(source)
    ? source
    : Object.values(source || {});

  return phases.some((phase) => {
    const steps = phase?.steps || phase?.slides || [];
    return steps.some((step) => (
      Array.isArray(step?.slides)
      && step.slides.some((slide) => Array.isArray(slide?.layers) && slide.layers.length > 0)
    ));
  });
}

function createCoverPhase(initialCourseData, template, courseMeta = {}, options = {}) {
  const isEnglish = options.language === 'en'
    || courseMeta?.language === 'en'
    || courseMeta?.outputLanguage === 'English';
  const source = typeof courseMeta === 'object' && courseMeta
    ? courseMeta
    : typeof initialCourseData === 'object' && !Array.isArray(initialCourseData)
      ? initialCourseData
      : {};
  const fallbackTitle = Array.isArray(initialCourseData)
    ? initialCourseData.find((phase) => phase?.steps?.length)?.steps?.[0]?.title
    : '';
  const title = isEnglish
    ? englishOnlyText(source.courseTitle || source.title || source.name || fallbackTitle, 'Course Courseware', 38)
    : compactText(source.courseTitle || source.title || source.name || fallbackTitle || '课程课件', '课程课件', 38);
  const subtitle = isEnglish
    ? englishOnlyText(source.description || source.subtitle || source.overview, 'Auto-generated from lesson plan. Continue editing content and assets.', 62)
    : compactText(source.description || source.subtitle || source.overview || '基于教案自动生成，可继续编辑内容与素材。', '基于教案自动生成，可继续编辑内容与素材。', 62);

  const slide = {
    id: `cover-slide-${Date.now()}`,
    title: isEnglish ? 'Course Cover' : '课程封面',
    background: template.background,
    backgroundImage: template.coverImage,
    templateId: template.id,
    isCover: true,
    layers: [
      createTextLayer({
        title: isEnglish ? 'Cover Title' : '封面标题',
        content: title,
        x: 110,
        y: 118,
        width: 720,
        height: 92,
        fontSize: 46,
        fontWeight: 'bold',
        textAlign: 'left',
        color: template.titleColor,
      }),
      createTextLayer({
        title: isEnglish ? 'Cover Subtitle' : '封面副标题',
        content: subtitle,
        x: 116,
        y: 238,
        width: 560,
        height: 72,
        fontSize: 25,
        fontWeight: 'bold',
        textAlign: 'left',
        color: template.bodyColor,
      }),
      createTextLayer({
        title: isEnglish ? 'Template Name' : '模板名称',
        content: isEnglish ? (template.nameEn || template.name) : template.name,
        x: 116,
        y: 374,
        width: 260,
        height: 44,
        fontSize: 23,
        fontWeight: 'bold',
        textAlign: 'left',
        color: template.accent,
      }),
    ],
  };

  return {
    key: 'cover',
    title: isEnglish ? 'Cover' : '封面',
    tone: 'cover',
    color: template.accent,
    steps: [
      {
        id: 'cover-step',
        title: isEnglish ? 'Course Cover' : '课程封面',
        slides: [slide],
      },
    ],
  };
}

function createTitleSlide(phase, step, stepIndex, template, isEnglish = false) {
  const duration = isEnglish
    ? englishOnlyText(step.duration, 'Class activity', 20)
    : compactText(step.duration, '课堂活动', 20);
  const objective = isEnglish
    ? englishOnlyText(step.objective, 'Clarify the learning goal and enter the classroom task with a question.', 110)
    : compactText(step.objective, '明确本环节的学习目标，带着问题进入课堂任务。', 110);
  const activity = isEnglish
    ? englishOnlyText(step.activity, 'Observe, communicate, express, and create around the lesson theme.', 100)
    : compactText(step.activity, '围绕主题完成观察、交流、表达与产出。', 100);
  const stepTitle = isEnglish ? englishOnlyText(step.title, `Lesson Step ${stepIndex + 1}`, 60) : step.title;
  const phaseTitle = isEnglish ? englishOnlyText(phase.title, 'Lesson Phase', 40) : phase.title;

  return {
    id: `${step.id}-template-title-${Date.now()}-${stepIndex}`,
    title: isEnglish ? `${stepTitle} · Intro` : `${step.title} · 导入页`,
    background: template.background,
    backgroundImage: '',
    templateId: template.id,
    layers: [
      createTextLayer({
        title: isEnglish ? 'Phase Label' : '阶段标签',
        content: phaseTitle,
        x: 70,
        y: 62,
        width: 360,
        height: 32,
        fontSize: 19,
        fontWeight: 'bold',
        textAlign: 'left',
        color: template.accent,
      }),
      createTextLayer({
        title: isEnglish ? 'Page Title' : '页面标题',
        content: stepTitle,
        x: 70,
        y: 128,
        width: 700,
        height: 82,
        fontSize: 38,
        fontWeight: 'bold',
        textAlign: 'left',
        color: template.titleColor,
      }),
      createTextLayer({
        title: isEnglish ? 'Goal Summary' : '目标摘要',
        content: isEnglish ? `Goal: ${objective}` : `目标：${objective}`,
        x: 72,
        y: 248,
        width: 710,
        height: 72,
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'left',
        color: template.bodyColor,
      }),
      createTextLayer({
        title: isEnglish ? 'Activity Summary' : '活动摘要',
        content: activity,
        x: 72,
        y: 342,
        width: 710,
        height: 60,
        fontSize: 19,
        fontWeight: 'normal',
        textAlign: 'left',
        color: template.bodyColor,
      }),
      createTextLayer({
        title: isEnglish ? 'Duration Label' : '时间标签',
        content: isEnglish ? `Duration ${duration}` : `时长 ${duration}`,
        x: 70,
        y: 432,
        width: 190,
        height: 34,
        fontSize: 18,
        fontWeight: 'bold',
        color: template.accent,
        textAlign: 'left',
      }),
      createTextLayer({
        title: isEnglish ? 'Classroom Tip' : '课堂提示',
        content: isEnglish ? 'Tip: Start from a question and let students speak, try, and connect first.' : '提示：从问题出发，让学生先说、先试、先连接。',
        x: 286,
        y: 432,
        width: 480,
        height: 34,
        fontSize: 18,
        fontWeight: 'bold',
        color: template.bodyColor,
        textAlign: 'left',
      }),
    ],
  };
}

function createActivitySlide(phase, step, stepIndex, template, isEnglish = false) {
  const points = splitPoints(
    isEnglish
      ? englishOnlyText(step.flow || step.activity, 'Teacher presents the task; students collaborate in groups; teams share and give feedback; teacher summarizes key methods', 220)
      : step.flow || step.activity,
    isEnglish
      ? 'Teacher presents the task; students collaborate in groups; teams share and give feedback; teacher summarizes key methods'
      : '教师提出任务；学生小组协作完成挑战；展示作品并互相反馈；教师总结关键方法'
  );
  const resource = isEnglish
    ? englishOnlyText(step.resources, 'Materials, images, videos, or classroom tools as needed.', 90)
    : compactText(step.resources, '材料、图片、视频或课堂工具按需补充。', 90);
  const stepTitle = isEnglish ? englishOnlyText(step.title, `Lesson Step ${stepIndex + 1}`, 60) : step.title;
  const phaseTitle = isEnglish ? englishOnlyText(phase.title, 'Lesson Phase', 40) : phase.title;

  return {
    id: `${step.id}-template-activity-${Date.now()}-${stepIndex}`,
    title: isEnglish ? `${stepTitle} · Activity` : `${step.title} · 活动页`,
    background: template.background,
    backgroundImage: '',
    templateId: template.id,
    layers: [
      createTextLayer({
        title: isEnglish ? 'Activity Page Title' : '活动页标题',
        content: stepTitle,
        x: 64,
        y: 48,
        width: 650,
        height: 58,
        fontSize: 34,
        fontWeight: 'bold',
        textAlign: 'left',
        color: template.titleColor,
      }),
      createTextLayer({
        title: isEnglish ? 'Phase Badge' : '阶段角标',
        content: phaseTitle,
        x: 682,
        y: 54,
        width: 180,
        height: 36,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        color: template.accent,
      }),
      createTextLayer({
        title: isEnglish ? 'Procedure Title' : '流程标题',
        content: isEnglish ? 'Class Flow' : '课堂流程',
        x: 74,
        y: 138,
        width: 180,
        height: 38,
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'left',
        color: template.accent,
      }),
      ...points.map((point, index) => createTextLayer({
        title: isEnglish ? `Flow ${index + 1}` : `流程 ${index + 1}`,
        content: `${index + 1}. ${point}`,
        x: 86,
        y: 196 + index * 58,
        width: 575,
        height: 42,
        fontSize: 21,
        fontWeight: index === 0 ? 'bold' : 'normal',
        textAlign: 'left',
        color: template.bodyColor,
      })),
      createTextLayer({
        title: isEnglish ? 'Material Note' : '材料提示',
        content: isEnglish ? `Materials: ${resource}` : `素材与支持：${resource}`,
        x: 690,
        y: 170,
        width: 170,
        height: 140,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: template.titleColor,
      }),
      createTextLayer({
        title: isEnglish ? 'Edit Note' : '生成说明',
        content: isEnglish ? 'You can replace images, videos, or audio assets.' : '可继续替换图片、视频或音频素材。',
        x: 690,
        y: 360,
        width: 170,
        height: 64,
        fontSize: 16,
        fontWeight: 'normal',
        textAlign: 'center',
        color: template.bodyColor,
      }),
    ],
  };
}

export function createGeneratedPptCourse(initialCourseData, templateId, courseMeta = {}, options = {}) {
  const template = getTemplate(templateId);
  const normalized = buildInitialPptCourse(initialCourseData);
  const isEnglish = options.language === 'en'
    || courseMeta?.language === 'en'
    || courseMeta?.outputLanguage === 'English';

  const contentPhases = normalized.filter((phase) => phase.key !== 'cover').map((phase) => ({
    ...phase,
    steps: phase.steps.map((step, stepIndex) => ({
      ...step,
      slides: [
        createTitleSlide(phase, step, stepIndex, template, isEnglish),
        createActivitySlide(phase, step, stepIndex, template, isEnglish),
      ],
    })),
  }));

  return [createCoverPhase(initialCourseData, template, courseMeta, options), ...contentPhases];
}

export function ensurePptCoverAndInnerPages(course, courseMeta = {}) {
  if (!Array.isArray(course) || course.length === 0) return course;

  const hasCover = course[0]?.key === 'cover';
  const coverPhase = hasCover ? course[0] : null;
  const contentPhases = hasCover ? course.slice(1) : course;
  const firstTemplateSlide = contentPhases
    .flatMap((phase) => phase.steps || [])
    .flatMap((step) => step.slides || [])
    .find((slide) => slide?.templateId || slide?.backgroundImage);
  const template = getTemplate(firstTemplateSlide?.templateId);
  const customerTemplateIds = new Set(PPT_TEMPLATES.map((item) => item.id));

  const cleanedContentPhases = contentPhases.map((phase) => ({
    ...phase,
    steps: (phase.steps || []).map((step) => ({
      ...step,
      slides: (step.slides || []).map((slide) => {
        const isCustomerTemplateSlide = customerTemplateIds.has(slide.templateId)
          || PPT_TEMPLATES.some((item) => item.coverImage === slide.backgroundImage);
        if (!isCustomerTemplateSlide || slide.isCover) return slide;
        return {
          ...slide,
          background: slide.background || template.background,
          backgroundImage: '',
          isCover: false,
        };
      }),
    })),
  }));

  if (coverPhase) return [coverPhase, ...cleanedContentPhases];
  if (!firstTemplateSlide) return course;

  return [
    createCoverPhase(courseMeta, template, courseMeta),
    ...cleanedContentPhases,
  ];
}
