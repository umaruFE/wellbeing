const PHASE_LIMIT_RATIOS: Record<string, number> = {
  engage: 0.15,
  empower: 0.4,
  execute: 0.3,
  elevate: 0.15,
};

const FIXED_FLOW_NAMES = new Set([
  '情境开启',
  '任务说明',
  '合作探索',
  '语言练习',
  '成果分享',
  '课堂收束',
  '打开线索',
  '小组探索',
  '任务收束',
]);

export function parseDurationMinutes(value: unknown, fallback = 0) {
  const matches = String(value || '').match(/\d+(?:\.\d+)?/g);
  if (!matches?.length) return fallback;
  const parsed = Number(matches[matches.length - 1]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMinutes(value: number) {
  const rounded = Math.max(1, Math.round(value));
  return `${rounded}分钟`;
}

function makeFlowName(content: string, index: number) {
  const cleaned = String(content || '')
    .replace(/教师说|老师说|学生|教师|小组|全班|并说/g, ' ')
    .replace(/[“”"'，、。！？；;：:（）()\[\]①②③④⑤⑥]/g, ' ')
    .trim();
  const compact = cleaned.split(/\s+/).filter(Boolean).join('');
  if (compact) return compact.slice(0, 8);
  return `课堂推进${index + 1}`;
}

export function normalizeActivitySteps(step: any) {
  if (!step || typeof step !== 'object') return step;

  const raw = step.activitySteps || step.flow;
  if (typeof raw !== 'string' || !raw.trim()) return step;

  const lines = raw
    .split(/\n|[;；]/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return step;

  const nextLines = lines.map((line, index) => {
    const separatorIndex = line.search(/[：:]/);
    if (separatorIndex < 0) return line;

    const name = line.slice(0, separatorIndex).replace(/^[①②③④⑤⑥\-\d.\s]+/, '').trim();
    const content = line.slice(separatorIndex + 1).trim();
    if (!FIXED_FLOW_NAMES.has(name)) return line;

    return `${makeFlowName(content, index)}：${content}`;
  });

  const next = nextLines.join('\n');
  step.activitySteps = next;
  if (step.flow !== undefined) step.flow = next;
  return step;
}

export function normalizePhaseDurations(courseData: any, duration: unknown) {
  const root = courseData?.courseData || courseData;
  if (!root || typeof root !== 'object') return courseData;

  const totalMinutes = parseDurationMinutes(duration, 60);
  for (const [phaseKey, ratio] of Object.entries(PHASE_LIMIT_RATIOS)) {
    const steps = root[phaseKey]?.steps;
    if (!Array.isArray(steps) || steps.length === 0) continue;

    steps.forEach(normalizeActivitySteps);

    const limit = Math.max(1, Math.round(totalMinutes * ratio));
    const minutes = steps.map((step: any) => parseDurationMinutes(step.time || step.duration, 0));
    const sum = minutes.reduce((acc: number, item: number) => acc + item, 0);
    if (sum <= limit || sum <= 0) continue;

    const scaled = minutes.map((item: number) => Math.max(1, Math.floor((item / sum) * limit)));
    let scaledSum = scaled.reduce((acc: number, item: number) => acc + item, 0);
    let cursor = 0;
    while (scaledSum < limit && scaled.length > 0) {
      scaled[cursor % scaled.length] += 1;
      scaledSum += 1;
      cursor += 1;
    }
    while (scaledSum > limit && scaled.length > 0) {
      const idx = cursor % scaled.length;
      if (scaled[idx] > 1) {
        scaled[idx] -= 1;
        scaledSum -= 1;
      }
      cursor += 1;
      if (cursor > scaled.length * 4 && scaledSum > limit) break;
    }

    steps.forEach((step: any, index: number) => {
      const value = formatMinutes(scaled[index] || 1);
      step.time = value;
      step.duration = value;
    });
  }

  return courseData;
}

export function normalizeStepsForPhase(steps: any[], phaseKey: string, duration: unknown) {
  if (!Array.isArray(steps)) return steps;
  const wrapper = { [phaseKey]: { steps } };
  normalizePhaseDurations(wrapper, duration);
  return wrapper[phaseKey].steps;
}
