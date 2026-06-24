export function splitStepResources(text) {
  return String(text || '')
    .split(/[、，,；;/\n]/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

const flowTitles = {
  zh: ['创设悬念', '朗读来信', '情绪感知', '发布任务'],
  en: ['Build Suspense', 'Read the Letter', 'Emotion Awareness', 'Announce Task'],
};

const flowTitleMap = {
  '创设悬念': { zh: '创设悬念', en: 'Build Suspense' },
  '朗读来信': { zh: '朗读来信', en: 'Read the Letter' },
  '情绪感知': { zh: '情绪感知', en: 'Emotion Awareness' },
  '发布任务': { zh: '发布任务', en: 'Announce Task' },
  'Build Suspense': { zh: '创设悬念', en: 'Build Suspense' },
  'Read the Letter': { zh: '朗读来信', en: 'Read the Letter' },
  'Emotion Awareness': { zh: '情绪感知', en: 'Emotion Awareness' },
  'Announce Task': { zh: '发布任务', en: 'Announce Task' },
};

function translateFlowTitle(title, isEn) {
  return flowTitleMap[title]?.[isEn ? 'en' : 'zh'] || title;
}

export function parseLabeledFlowSteps(flow, isEn = false) {
  const raw = String(flow || '').replace(/\u200b/g, '').replace(/\r/g, '\n').trim();
  if (!raw) return [];
  const titles = flowTitles[isEn ? 'en' : 'zh'];
  const labelPattern = new RegExp(`(${titles.join('|')})\\s*[：:]\\s*`, 'g');
  const matches = Array.from(raw.matchAll(labelPattern));
  if (matches.length < 2) return [];
  return matches
    .map((match, index) => {
      const start = match.index + match[0].length;
      const end = matches[index + 1]?.index ?? raw.length;
      return {
        title: match[1],
        desc: raw.slice(start, end).replace(/^[\s。；;，,]+|[\s。；;，,]+$/g, '').trim(),
      };
    })
    .filter((item) => item.desc);
}

export function splitStepFlowText(flow, isEn = false) {
  const raw = String(flow || '').trim();
  if (!raw) return [];
  const labeled = parseLabeledFlowSteps(raw, isEn);
  if (labeled.length) return labeled.map((item) => `${item.title}：${item.desc}`);
  return raw
    .split(/\n+|[①②③④⑤⑥⑦⑧⑨]|\d+[.、)]/g)
    .map((item) => item.replace(/^[：:；;，,\s-]+/, '').trim())
    .filter(Boolean);
}

export function buildStepFlowItems(step, isEn = false) {
  const data = {
    flow: step?.flow,
    script: step?.teacherScript,
    scenario: step?.scenario,
    activity: step?.activity,
  };
  const labeled = parseLabeledFlowSteps(data.flow, isEn);
  if (labeled.length) return labeled.map(item => ({ ...item, title: translateFlowTitle(item.title, isEn) }));
  const parts = splitStepFlowText(data.flow, isEn);
  const titles = flowTitles[isEn ? 'en' : 'zh'];
  const defaults = isEn
    ? [
        { title: titles[0], desc: data.flow || 'Teacher starts with a mysterious signal, showing an image with animal clues.' },
        { title: titles[1], desc: data.script || 'Read the rescue message in English with emotion and slightly slower speed.' },
        { title: titles[2], desc: data.scenario || 'Show animal silhouette images, guide students to respond with expressions and simple language.' },
        { title: titles[3], desc: data.activity || 'Clarify the task for this section, let students proceed with objectives.' },
      ]
    : [
        { title: titles[0], desc: data.flow || '教师以神秘信号开场，展示一个印有动物线索的画面。' },
        { title: titles[1], desc: data.script || '用富有感情、语速稍慢的英文朗读求救信息。' },
        { title: titles[2], desc: data.scenario || '展示动物轮廓图，引导学生用表情和简单语言回应。' },
        { title: titles[3], desc: data.activity || '明确本环节任务，让学生带着目标进入下一步探索。' },
      ];
  if (parts.length >= 2) {
    return titles.map((title, index) => ({ title, desc: parts[index] || defaults[index].desc }));
  }
  return defaults;
}

function extractScriptSegments(script) {
  const raw = String(script || '')
    .replace(/\u200b/g, '')
    .replace(/\r/g, '\n')
    .replace(/\(T\)|（T）/g, '')
    .trim();
  if (!raw) return [];
  const quoteRegex = /["“]([^"”]+)["”]/g;
  const matches = Array.from(raw.matchAll(quoteRegex));
  if (matches.length) {
    return matches.map((match, index) => {
      const tailStart = match.index + match[0].length;
      const tailEnd = matches[index + 1]?.index ?? raw.length;
      const tail = raw.slice(tailStart, tailEnd);
      const cues = Array.from(tail.matchAll(/(?:\[|【)([^】\]]+)(?:\]|】)/g)).map((item) => item[1].trim());
      const responses = Array.from(tail.matchAll(/[（(]([^()（）]*(?:回应|学生|No|Yes)[^()（）]*)[）)]/gi)).map((item) => item[1].trim());
      return {
        text: `"${match[1].trim()}"`,
        cue: cues.join('；'),
        response: responses.join('；'),
      };
    });
  }
  return raw
    .split(/\n+|(?<=[。！？!?])\s*/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((text) => ({ text, cue: '', response: '' }));
}

function pickScriptSegmentsForStep(segments, index) {
  if (!segments.length) return [];
  const matchers = [
    /Shhh|special letter|信封|神秘|开场|letter/i,
    /from|Dear|sad|lonely|help us|朗读|来信|animals are not happy/i,
    /Look|elephant|panda|happy|excited|animal|情绪|感受|表情/i,
    /Let'?s help|ready|Rescue Team|team|任务|帮助|Are you ready/i,
  ];
  const matched = segments.filter((segment) => matchers[index]?.test(`${segment.text} ${segment.cue} ${segment.response}`));
  if (matched.length) return matched.slice(0, 3);
  const chunkSize = Math.max(1, Math.ceil(segments.length / 4));
  return segments.slice(index * chunkSize, index * chunkSize + chunkSize).slice(0, 2);
}

export function buildStepExecutionItems(step, isEn = false) {
  const flowItems = buildStepFlowItems(step, isEn);
  const scriptSegments = extractScriptSegments(step?.teacherScript);
  const defaultLines = [
    { text: '"Listen carefully. I have something special to show you."', cue: '用神秘、轻声的语气开场，展示关键道具或画面。', response: '' },
    { text: '"Let’s read the message together. What can you find?"', cue: '放慢语速朗读重点信息，配合表情和手势帮助理解。', response: '' },
    { text: '"Look closely. How do they feel? Can you say it in English?"', cue: '指向图片细节，引导学生观察、猜测并回应。', response: '' },
    { text: '"Now we know our mission. Are you ready to help?"', cue: '明确任务身份和最终挑战，推动学生进入下一环节。', response: '' },
  ];
  const cues = defaultLines.map((item) => item.cue);
  return flowItems.map((item, index) => ({
    title: item.title,
    desc: item.desc,
    stageCue: cues[index] || '用清晰指令连接活动目标和学生行动。',
    lines: (pickScriptSegmentsForStep(scriptSegments, index).length
      ? pickScriptSegmentsForStep(scriptSegments, index)
      : [defaultLines[index] || defaultLines[defaultLines.length - 1]]
    ).map((line) => ({
      text: line.text,
      cue: line.cue || cues[index] || '用清晰指令连接活动目标和学生行动。',
      response: line.response || '',
    })),
  }));
}

export function createFlowStepsForForm(step, isEn = false) {
  return buildStepFlowItems(step, isEn).map((item, index) => ({
    title: item.title,
    desc: item.desc,
    teacher: index === 0 ? step?.teacherScript || '' : '',
    cue: '',
  }));
}

export function composeFlowFromSteps(flowSteps = []) {
  return flowSteps
    .map((item, index) => `${item?.title || `步骤${index + 1}`}：${item?.desc || ''}`)
    .join('\n');
}

export function composeScriptFromSteps(flowSteps = []) {
  return flowSteps
    .map((item) => [item?.teacher, item?.cue ? `【动作/引导】${item.cue}` : ''].filter(Boolean).join(' '))
    .filter(Boolean)
    .join('\n');
}
