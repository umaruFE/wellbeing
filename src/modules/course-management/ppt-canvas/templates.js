const PPT_TEMPLATES = [
  {
    id: 'red-business',
    name: '红色商务风',
    description: '红色商务风格，简洁专业',
    coverBackgroundStyle: {
      background: 'linear-gradient(135deg, #FEE2E2 0%, #FFFFFF 40%, #FFF5F5 100%)',
    },
    contentBackgroundStyle: {
      background: 'linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 50%, #FFF0F0 100%)',
    },
    pptxCoverBackground: { color: 'FFFFFF' },
    pptxContentBackground: { color: 'FFFFFF' },
    previewColors: { primary: '#B91C1C', secondary: '#DC2626', accent: '#EF4444' },
    contentLayout: {
      title: { x: 30, y: 8, w: 900, h: 28, fontSize: 20, fontWeight: 'bold', color: '#991B1B', textAlign: 'left' },
      objective: { x: 30, y: 42, w: 440, h: 100, fontSize: 13, fontWeight: 'normal', color: '#7F1D1D', textAlign: 'left' },
      activitySteps: { x: 30, y: 150, w: 440, h: 370, fontSize: 12, fontWeight: 'normal', color: '#1F2937', textAlign: 'left' },
      image: { x: 490, y: 42, w: 440, h: 280 },
      script: { x: 490, y: 330, w: 440, h: 190, fontSize: 11, fontWeight: 'normal', color: '#6B7280', textAlign: 'left' },
    },
    coverLayout: {
      title: { x: 80, y: 160, w: 800, h: 60, fontSize: 32, fontWeight: 'bold', color: '#991B1B', textAlign: 'center' },
      objective: { x: 100, y: 240, w: 760, h: 80, fontSize: 15, fontWeight: 'normal', color: '#7F1D1D', textAlign: 'center' },
      activitySteps: null,
      image: null,
      script: null,
    }
  },
  {
    id: 'blue-business',
    name: '蓝色商务风',
    description: '蓝色商务风格，沉稳大气',
    coverBackgroundStyle: {
      background: 'linear-gradient(135deg, #DBEAFE 0%, #FFFFFF 40%, #EFF6FF 100%)',
    },
    contentBackgroundStyle: {
      background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 50%, #DBEAFE 100%)',
    },
    pptxCoverBackground: { color: 'FFFFFF' },
    pptxContentBackground: { color: 'FFFFFF' },
    previewColors: { primary: '#1E40AF', secondary: '#2563EB', accent: '#3B82F6' },
    contentLayout: {
      title: { x: 30, y: 8, w: 900, h: 28, fontSize: 20, fontWeight: 'bold', color: '#1E3A5F', textAlign: 'left' },
      objective: { x: 30, y: 42, w: 440, h: 100, fontSize: 13, fontWeight: 'normal', color: '#1E40AF', textAlign: 'left' },
      activitySteps: { x: 30, y: 150, w: 440, h: 370, fontSize: 12, fontWeight: 'normal', color: '#1F2937', textAlign: 'left' },
      image: { x: 490, y: 42, w: 440, h: 280 },
      script: { x: 490, y: 330, w: 440, h: 190, fontSize: 11, fontWeight: 'normal', color: '#6B7280', textAlign: 'left' },
    },
    coverLayout: {
      title: { x: 80, y: 160, w: 800, h: 60, fontSize: 32, fontWeight: 'bold', color: '#1E3A5F', textAlign: 'center' },
      objective: { x: 100, y: 240, w: 760, h: 80, fontSize: 15, fontWeight: 'normal', color: '#1E40AF', textAlign: 'center' },
      activitySteps: null,
      image: null,
      script: null,
    }
  },
  {
    id: 'nature-business',
    name: '自然商务风',
    description: '大气自然商务风格，清新简约',
    coverBackgroundStyle: {
      background: 'linear-gradient(135deg, #DCFCE7 0%, #FFFFFF 40%, #F0FDF4 100%)',
    },
    contentBackgroundStyle: {
      background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 50%, #DCFCE7 100%)',
    },
    pptxCoverBackground: { color: 'FFFFFF' },
    pptxContentBackground: { color: 'FFFFFF' },
    previewColors: { primary: '#166534', secondary: '#16A34A', accent: '#22C55E' },
    contentLayout: {
      title: { x: 30, y: 8, w: 900, h: 28, fontSize: 20, fontWeight: 'bold', color: '#14532D', textAlign: 'left' },
      objective: { x: 30, y: 42, w: 440, h: 100, fontSize: 13, fontWeight: 'normal', color: '#166534', textAlign: 'left' },
      activitySteps: { x: 30, y: 150, w: 440, h: 370, fontSize: 12, fontWeight: 'normal', color: '#1F2937', textAlign: 'left' },
      image: { x: 490, y: 42, w: 440, h: 280 },
      script: { x: 490, y: 330, w: 440, h: 190, fontSize: 11, fontWeight: 'normal', color: '#6B7280', textAlign: 'left' },
    },
    coverLayout: {
      title: { x: 80, y: 160, w: 800, h: 60, fontSize: 32, fontWeight: 'bold', color: '#14532D', textAlign: 'center' },
      objective: { x: 100, y: 240, w: 760, h: 80, fontSize: 15, fontWeight: 'normal', color: '#166534', textAlign: 'center' },
      activitySteps: null,
      image: null,
      script: null,
    }
  }
];

export function getTemplateById(id) {
  return PPT_TEMPLATES.find(t => t.id === id) || PPT_TEMPLATES[0];
}

export function isCoverStep(step, allSteps) {
  if (!allSteps || allSteps.length === 0) return false;
  return step.id === allSteps[0].id;
}

export function getTemplateStyleForStep(template, step, allSteps) {
  const cover = isCoverStep(step, allSteps);
  return {
    backgroundStyle: cover ? template.coverBackgroundStyle : template.contentBackgroundStyle,
    pptxBackground: cover ? template.pptxCoverBackground : template.pptxContentBackground,
    layout: cover ? template.coverLayout : template.contentLayout,
  };
}

export function getTemplatesForStep(step, template, allSteps) {
  const { layout } = getTemplateStyleForStep(template, step, allSteps);
  const assets = [];

  if (!layout) return assets;

  if (step.title && layout.title) {
    assets.push({
      id: `tpl-title-${step.id}`,
      type: 'text',
      title: '环节标题',
      content: step.title,
      url: '',
      prompt: '',
      referenceImage: null,
      ...layout.title,
    });
  }

  if (step.objective && layout.objective) {
    assets.push({
      id: `tpl-obj-${step.id}`,
      type: 'text',
      title: '教学目标',
      content: step.objective,
      url: '',
      prompt: '',
      referenceImage: null,
      ...layout.objective,
    });
  }

  if (step.activitySteps && layout.activitySteps) {
    assets.push({
      id: `tpl-steps-${step.id}`,
      type: 'text',
      title: '活动流程',
      content: step.activitySteps,
      url: '',
      prompt: '',
      referenceImage: null,
      ...layout.activitySteps,
    });
  }

  if (step.script && layout.script) {
    assets.push({
      id: `tpl-script-${step.id}`,
      type: 'text',
      title: '教师讲稿',
      content: step.script,
      url: '',
      prompt: '',
      referenceImage: null,
      ...layout.script,
    });
  }

  const imageAssets = (step.assets || []).filter(a => a.type === 'image' && a.url);
  if (imageAssets.length > 0 && layout.image) {
    assets.push({
      id: `tpl-img-${step.id}`,
      type: 'image',
      title: imageAssets[0].title || '教学图片',
      url: imageAssets[0].url,
      prompt: imageAssets[0].prompt || '',
      referenceImage: null,
      ...layout.image,
    });
  }

  return assets;
}

export default PPT_TEMPLATES;
