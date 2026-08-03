const raw = $json || {};

const stripCodeFence = (value) => String(value || '')
  .trim()
  .replace(/^\`\`\`(?:json)?\s*/i, '')
  .replace(/\`\`\`$/i, '')
  .trim();

const extractJsonObject = (value) => {
  const text = stripCodeFence(value);
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  return first >= 0 && last > first ? text.slice(first, last + 1) : text;
};

const escapeLooseQuotes = (value) => {
  let output = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (!inString) {
      if (ch === '"') inString = true;
      output += ch;
      continue;
    }
    if (escaped) {
      output += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      output += ch;
      escaped = true;
      continue;
    }
    if (ch === '"') {
      const rest = value.slice(i + 1);
      const next = rest.match(/\S/)?.[0] || '';
      let closesString = !next || [':', '}', ']'].includes(next);
      if (next === ',') {
        const afterComma = rest.slice(rest.indexOf(',') + 1).trimStart();
        closesString = /^"(?:[^"\\]|\\.)*"\s*:/.test(afterComma);
      }
      if (closesString) {
        output += ch;
        inString = false;
      } else {
        output += '\\"';
      }
      continue;
    }
    output += ch;
  }
  return output;
};

const parseJsonLike = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  const extracted = extractJsonObject(value);
  if (!extracted) throw new Error('The slide model returned an empty response');
  const attempts = [extracted, escapeLooseQuotes(extracted)];
  let lastError;
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (error) {
      lastError = error;
    }
  }
  const preview = extracted.slice(0, 500).replace(/\s+/g, ' ');
  throw new Error(`Invalid slide JSON from model: ${lastError.message}. Preview: ${preview}`);
};

const sanitizeText = (value) => String(value ?? '')
  .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
  .replace(/[ \t]+/g, ' ')
  .replace(/ *\n */g, '\n')
  .trim();

const sanitizeDeep = (value) => {
  if (typeof value === 'string') return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, sanitizeDeep(child)]));
  }
  return value;
};

const responseCandidate = (value) => {
  const candidate = value.output
    ?? value.text
    ?? value.content
    ?? value.response
    ?? value.message?.content
    ?? value.choices?.[0]?.message?.content
    ?? value;
  if (Array.isArray(candidate)) {
    return candidate
      .map((part) => typeof part === 'string' ? part : (part?.text ?? part?.content ?? ''))
      .join('');
  }
  return candidate;
};

const contexts = $('Parse Slide Plan').all().map((item) => item.json);
const currentIndex = typeof $itemIndex === 'number' ? $itemIndex : 0;
let context = contexts[currentIndex];

const buildFallbackSlide = (slideContext, reason) => {
  if (!slideContext) throw new Error(`No slide-plan context found for item ${currentIndex + 1}`);
  const plan = slideContext.slidePlan || {};
  const isCover = slideContext.slideIndex === 0;
  const id = String(plan.id || `slide-${slideContext.slideIndex + 1}`);
  const title = sanitizeText(plan.title) || (isCover ? 'English Learning Adventure' : 'English Practice');
  const purpose = sanitizeText(plan.purpose) || (isCover
    ? 'A playful journey to learn English together.'
    : 'Learn, speak, and practice English together.');
  const elements = isCover ? [
    { id: `${id}-title`, type: 'text', role: 'title', content: title, x: 90, y: 145, width: 760, height: 90, fontSize: 48, fontWeight: 'bold', color: '#253142', textAlign: 'center' },
    { id: `${id}-subtitle`, type: 'text', role: 'subtitle', content: purpose, x: 150, y: 255, width: 640, height: 60, fontSize: 24, fontWeight: 'normal', color: '#385A7C', textAlign: 'center' }
  ] : [
    { id: `${id}-eyebrow`, type: 'text', role: 'eyebrow', content: 'ENGLISH LEARNING', x: 64, y: 58, width: 300, height: 36, fontSize: 18, fontWeight: 'bold', color: '#3978A8', textAlign: 'left' },
    { id: `${id}-title`, type: 'text', role: 'title', content: title, x: 64, y: 108, width: 720, height: 80, fontSize: 42, fontWeight: 'bold', color: '#253142', textAlign: 'left' },
    { id: `${id}-body`, type: 'text', role: 'body', content: purpose, x: 64, y: 220, width: 620, height: 100, fontSize: 24, fontWeight: 'normal', color: '#385A7C', textAlign: 'left' }
  ];
  return {
    id,
    phaseKey: String(plan.phaseKey || (isCover ? 'cover' : '')),
    stepId: String(plan.stepId || (isCover ? 'cover-step' : '')),
    type: String(plan.type || (isCover ? 'cover' : 'content')),
    title,
    speakerNotes: isCover
      ? 'Welcome learners and introduce the English learning adventure.'
      : `Guide learners through this activity: ${purpose}`,
    visualPrompt: `${sanitizeText(slideContext.visualStyle)} Text-free child-friendly educational illustration with generous negative space.`.trim(),
    layout: { name: isCover ? 'cover' : 'title-focus', background: '#FFFFFF', elements },
    generationWarning: sanitizeText(reason)
  };
};

let slide;
try {
  const parsed = sanitizeDeep(parseJsonLike(responseCandidate(raw)));
  const parsedSlide = parsed.slide || parsed;
  const parsedId = String(parsedSlide?.id || '');
  const parsedIndex = Number(parsedId.match(/slide-(\d+)/i)?.[1]) - 1;
  if (!context && parsedId) context = contexts.find((item) => item.slidePlan?.id === parsedId);
  if (!context && Number.isInteger(parsedIndex)) context = contexts[parsedIndex];
  if (!context) throw new Error(`No slide-plan context found for ${parsedId || `item ${currentIndex + 1}`}`);
  if (!parsedSlide?.layout || !Array.isArray(parsedSlide.layout.elements) || parsedSlide.layout.elements.length < 2) {
    throw new Error(`No usable layout returned for ${context.slidePlan.id}`);
  }
  slide = parsedSlide;
} catch (error) {
  slide = buildFallbackSlide(context, error.message);
}

// The slide plan is authoritative; prevent a model hallucination from shifting item identity.
slide.id = context.slidePlan.id;
slide.phaseKey = context.slidePlan.phaseKey;
slide.stepId = context.slidePlan.stepId;
slide.type = context.slidePlan.type;
slide.title = sanitizeText(slide.title) || sanitizeText(context.slidePlan.title);

return { json: {
  slideIndex: context.slideIndex,
  presentationTitle: context.presentationTitle,
  templateId: context.templateId,
  slide
} };
