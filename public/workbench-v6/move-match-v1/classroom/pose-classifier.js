/* Geometric pose checks for the opt-in practice view, never a game answer source.
   MediaPipe indexes are anatomical left/right, before the preview is mirrored.
   x is normalized by image width and y by height: pass the video aspect ratio. */
(function (root) {
  'use strict';

  const I = { ls: 11, rs: 12, le: 13, re: 14, lw: 15, rw: 16, lh: 23, rh: 24, lk: 25, rk: 26, la: 27, ra: 28 };
  const actions = new Set(['left', 'right', 'both', 'squat', 'clap', 'balance']);
  const result = (status, message) => ({ matched: status === 'matched', status, message });
  const missing = message => result('missing', message);
  const adjust = message => result('adjust', message);
  const matched = () => result('matched', '动作正确，请保持一下。');

  function evaluate(landmarks, { gesture, seated = false, aspectRatio = 1 } = {}) {
    if (!actions.has(gesture)) return adjust('请先选择要测试的动作。');
    if (!Array.isArray(landmarks) || landmarks.length < 33) return missing('请站到摄像头前，让身体进入画面。');
    const aspect = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1;
    const visible = index => {
      const p = landmarks[index];
      return p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0.005 && p.x <= 0.995 && p.y >= 0.005 && p.y <= 0.995 &&
        Number.isFinite(p.visibility) && p.visibility >= 0.55 &&
        (p.presence === undefined || (Number.isFinite(p.presence) && p.presence >= 0.55));
    };
    const has = names => names.every(name => visible(I[name]));
    if (!has(['ls', 'rs'])) return missing('请面向摄像头，让双肩完整进入画面。');
    const p = Object.fromEntries(Object.entries(I).map(([name, index]) => [name, landmarks[index]]));
    const delta = (a, b) => ({ x: (a.x - b.x) * aspect, y: a.y - b.y });
    const length = v => Math.hypot(v.x, v.y);
    const distance = (a, b) => length(delta(a, b));
    const width = distance(p.ls, p.rs);
    if (width < 0.065) return missing('请靠近一些，并面向摄像头露出双肩。');
    if (Math.abs(p.ls.y - p.rs.y) > width * 0.6) return adjust('请保持身体直立、双肩平稳。');
    const angle = (a, b, c) => {
      const u = delta(a, b), v = delta(c, b), denominator = length(u) * length(v);
      if (denominator < 0.00001) return NaN;
      return Math.acos(Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y) / denominator))) * 180 / Math.PI;
    };
    const upperBody = () => has(['le', 're', 'lw', 'rw']);
    const armsMissing = () => missing('请让双肩、手肘和双手完整进入画面。');
    const up = side => p[side + 'w'].y < p[side + 's'].y - width * 0.25 && p[side + 'e'].y < p[side + 's'].y + width * 0.2;
    const down = side => p[side + 'w'].y > p[side + 's'].y + width * 0.25;

    if (gesture === 'left' || gesture === 'right' || gesture === 'both') {
      if (!upperBody()) return armsMissing();
      if (gesture === 'both') {
        if (!up('l') || !up('r')) return adjust('请把两只手都举到肩膀上方。');
        if (distance(p.lw, p.rw) < width * 0.6) return adjust('请将举起的双手稍微分开。');
        return matched();
      }
      const side = gesture === 'left' ? 'l' : 'r', other = side === 'l' ? 'r' : 'l';
      if (!up(side)) return adjust(gesture === 'left' ? '请举起自己的左手，超过肩膀。' : '请举起自己的右手，超过肩膀。');
      if (!down(other)) return adjust(gesture === 'left' ? '左手保持举起，请放下右手。' : '右手保持举起，请放下左手。');
      return matched();
    }

    if (gesture === 'clap') {
      if (!upperBody()) return armsMissing();
      const shoulderY = (p.ls.y + p.rs.y) / 2, handY = (p.lw.y + p.rw.y) / 2;
      const centerX = (p.ls.x + p.rs.x) / 2;
      // This static test verifies the hands-together pose, not the sound of a clap.
      if (distance(p.lw, p.rw) <= width * 0.32 && handY < shoulderY + width * 0.45 &&
          Math.abs(((p.lw.x + p.rw.x) / 2 - centerX) * aspect) < width * 0.55) return matched();
      return adjust('请在胸前或头顶将双手合拢，并保持一下。');
    }

    if (gesture === 'balance' && seated) {
      if (!upperBody()) return armsMissing();
      const side = Math.sign(p.ls.x - p.rs.x);
      const horizontal = (s, e, w, sign) => (w.x - s.x) * aspect * sign > width * 0.5 &&
        Math.abs(w.y - s.y) < width * 0.25 && Math.abs(e.y - s.y) < width * 0.25 && angle(s, e, w) > 150;
      return horizontal(p.ls, p.le, p.lw, side) && horizontal(p.rs, p.re, p.rw, -side) ? matched() : adjust('请将双臂向两侧平举，伸直手肘。');
    }

    if (gesture === 'squat' && seated) {
      if (!has(['lw', 'rw', 'lh', 'rh', 'lk', 'rk'])) return missing('请让腰部、双手和膝盖完整进入画面。');
      const onThigh = (w, hip, knee) => {
        const v = delta(knee, hip), hand = delta(w, hip), squared = v.x * v.x + v.y * v.y;
        if (squared < width * width * 0.06) return false;
        const along = (hand.x * v.x + hand.y * v.y) / squared;
        const near = length({ x: hand.x - v.x * along, y: hand.y - v.y * along });
        return along >= 0.15 && along <= 1.2 && near < width * 0.28 && w.y > hip.y - width * 0.08;
      };
      return onThigh(p.lw, p.lh, p.lk) && onThigh(p.rw, p.rh, p.rk) ? matched() : adjust('请坐稳，将双手放在自己的大腿上。');
    }

    if (!has(['lh', 'rh', 'lk', 'rk', 'la', 'ra'])) return missing('请后退一些，让腰部、膝盖和双脚完整进入画面。');
    const hipY = (p.lh.y + p.rh.y) / 2, shoulderY = (p.ls.y + p.rs.y) / 2;
    if (hipY - shoulderY < width * 0.35) return adjust('请保持上身直立，让肩膀和腰部清晰可见。');
    const leftAngle = angle(p.lh, p.lk, p.la), rightAngle = angle(p.rh, p.rk, p.ra);

    if (gesture === 'squat') {
      const kneeY = (p.lk.y + p.rk.y) / 2, ankleY = (p.la.y + p.ra.y) / 2;
      const shinHeight = ankleY - kneeY;
      const lowered = shinHeight > width * 0.35 && kneeY - hipY < shinHeight * 0.9 && hipY < ankleY - width * 0.3;
      return leftAngle < 145 && rightAngle < 145 && lowered ? matched() : adjust('请弯曲双膝、降低身体，双脚保持在画面中。');
    }

    const leftLifted = p.ra.y - p.la.y > width * 0.32 && leftAngle < 150 && rightAngle > 155;
    const rightLifted = p.la.y - p.ra.y > width * 0.32 && rightAngle < 150 && leftAngle > 155;
    return leftLifted || rightLifted ? matched() : adjust('请抬起一只脚，另一条腿站稳并保持平衡。');
  }

  root.MMClassroomPoseClassifier = { evaluate };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MMClassroomPoseClassifier;
})(typeof window !== 'undefined' ? window : globalThis);
