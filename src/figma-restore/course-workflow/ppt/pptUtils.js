export function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

export function findActiveSlide(course, activePhaseKey, activeStepId, activeSlideId) {
  const phase = course.find((item) => item.key === activePhaseKey);
  const step = phase?.steps.find((item) => item.id === activeStepId) || phase?.steps[0];
  const slide = step?.slides.find((item) => item.id === activeSlideId) || step?.slides[0];
  return { phase, step, slide };
}

export function layerIcon(type) {
  if (type === 'text') return 'T';
  if (type === 'audio') return '♪';
  if (type === 'video') return '▶';
  return '▣';
}
