export function formatMusicTime(seconds) {
  const ms = Math.round(Math.max(0, seconds) * 1000);
  return `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor(ms % 60000 / 1000)).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
}

export function parseMusicRange(value) {
  const m = String(value || '').match(/^(\d+):(\d{2})(?:\.(\d{1,3}))?\s*[–—-]\s*(\d+):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!m) return null;
  const sec = (min, seconds, fraction) => Number(min) * 60 + Number(seconds) + Number((fraction || '').padEnd(3, '0')) / 1000;
  const start = sec(m[1], m[2], m[3]);
  const end = sec(m[4], m[5], m[6]);
  return Number(m[2]) < 60 && Number(m[5]) < 60 && end > start ? { start, end } : null;
}

const normalize = text => String(text).toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']/g, '');
export function applyActualLrc(text, lyrics, duration) {
  const rows = [];
  for (const line of String(text).split(/\r?\n/)) {
    const matches = [...line.matchAll(/\[(\d+):(\d{2})(?:\.(\d{1,3}))?\]/g)];
    const content = line.replace(/\[[^\]]*\]/g, '').trim();
    if (!content) continue;
    for (const m of matches) {
      if (Number(m[2]) >= 60) throw new Error('LRC秒数无效');
      rows.push({ start: Number(m[1]) * 60 + Number(m[2]) + Number((m[3] || '').padEnd(3, '0')) / 1000, text: content });
    }
  }
  rows.sort((a, b) => a.start - b.start);
  if (rows.length !== lyrics.length || rows.some((r, i) => normalize(r.text) !== normalize(lyrics[i].text))) throw new Error('LRC必须与当前歌曲全部歌词逐行对应（包括重复句），不能缺行或换词');
  return rows.map((row, i) => {
    const end = rows[i + 1]?.start ?? duration;
    if (!Number.isFinite(end) || end <= row.start || end > duration + 0.01) throw new Error('LRC时间必须递增且位于实际歌曲时长内');
    return { ...lyrics[i], time: `${formatMusicTime(row.start)}–${formatMusicTime(end)}` };
  });
}
