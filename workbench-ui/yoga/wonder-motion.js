/* Local, texture-preserving deformations of the supplied yoga PNG poses.
 * Coordinates are the displayed crop's [0,1] rectangle, with y pointing down.
 * This module owns no DOM, timers, playback state or image resources. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.YogaWonderMotion = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const COLUMNS = 20, ROWS = 24;
  const freeze = value => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  // Joint and protection regions were placed against the original visible
  // alpha bounds, not the transparent source canvas. Rest is the exception:
  // its original PPT crop includes blank space above the blue character.
  const definitions = freeze({
    tall: {
      name: '向上伸展', phaseLabels: ['站稳准备', '缓缓上举', '伸展停留', '缓缓放松'],
      viewport: [172, 45, 437, 553], aspect: 265 / 508,
      face: [.50, .235, .26, .115],
      anchors: { leftFoot: [.36, .97], rightFoot: [.63, .97] },
      joints: { leftShoulder: [.35, .435], rightShoulder: [.65, .435], leftHand: [.10, .055], rightHand: [.90, .055] },
    },
    tree: {
      name: '大树平衡', phaseLabels: ['站稳准备', '手臂伸展', '保持平衡', '回到准备'],
      viewport: [63, 10, 311, 456], aspect: 248 / 446,
      face: [.50, .275, .27, .12],
      anchors: { standingFoot: [.44, .975] },
      joints: { leftShoulder: [.31, .50], rightShoulder: [.69, .50], leftHand: [.11, .055], rightHand: [.89, .055], raisedKnee: [.80, .765] },
    },
    side: {
      name: '侧向伸展', phaseLabels: ['稳定支撑', '侧向伸展', '停留呼吸', '缓缓回正'],
      viewport: [81, 92, 520, 540], aspect: 439 / 448,
      face: [.81, .36, .16, .16],
      anchors: { standingFoot: [.52, .975] },
      joints: { hip: [.47, .65], shoulder: [.60, .28], reachingHand: [.925, .045], lowerHand: [.875, .66] },
    },
    rock: {
      name: '站立平衡', phaseLabels: ['站稳准备', '展开手臂', '保持平衡', '缓缓还原'],
      viewport: [102, 72, 558, 575], aspect: 456 / 503,
      face: [.48, .195, .25, .20],
      anchors: { standingFoot: [.48, .975] },
      joints: { leftShoulder: [.37, .405], rightShoulder: [.59, .405], leftHand: [.035, .405], rightHand: [.965, .405], hip: [.46, .68], raisedKnee: [.30, .75] },
    },
    lake: {
      name: '坐姿轻转', phaseLabels: ['坐稳准备', '轻轻转体', '停留呼吸', '缓缓回正'],
      viewport: [84, 100, 516, 560], aspect: 432 / 460,
      face: [.64, .205, .29, .21],
      anchors: { seat: [.65, .87], frontFoot: [.13, .965], backFoot: [.045, .90], supportingHand: [.87, .94] },
      joints: { waist: [.65, .84], neck: [.65, .44], chest: [.69, .62] },
    },
    mountain: {
      name: '山式伸展', phaseLabels: ['站稳准备', '向上伸展', '自然呼吸', '放松还原'],
      viewport: [97, 4, 278, 459], aspect: 181 / 455,
      face: [.50, .29, .29, .115],
      anchors: { leftFoot: [.30, .975], rightFoot: [.69, .975] },
      joints: { joinedHands: [.50, .07], chest: [.50, .56], waist: [.50, .74] },
    },
    ground: {
      name: '蝴蝶坐姿', phaseLabels: ['坐稳准备', '膝盖缓开', '放松停留', '膝盖还原'],
      viewport: [15, 61, 332, 416], aspect: 317 / 355,
      face: [.50, .22, .34, .21],
      anchors: { seat: [.50, .975], joinedFeet: [.50, .925] },
      joints: { leftHip: [.36, .84], rightHip: [.64, .84], leftKnee: [.11, .86], rightKnee: [.91, .86] },
    },
    rest: {
      name: '安静休息', phaseLabels: ['安静躺好', '轻轻吸气', '自然停留', '缓缓呼气'],
      viewport: [822.6737485488902, 0, 1265, 712], aspect: 243.8666666667 / 403.4666666667,
      face: [.265, .345, .25, .14],
      anchors: { leftFoot: [.51, .86], rightFoot: [.77, .80] },
      joints: { chest: [.47, .605], abdomen: [.48, .67] },
    },
  });

  const uvs = new Float32Array((COLUMNS + 1) * (ROWS + 1) * 2);
  const indices = new Uint16Array(COLUMNS * ROWS * 6);
  for (let row = 0; row <= ROWS; row++) for (let column = 0; column <= COLUMNS; column++) {
    const offset = (row * (COLUMNS + 1) + column) * 2;
    uvs[offset] = column / COLUMNS;
    uvs[offset + 1] = row / ROWS;
  }
  let nextIndex = 0;
  for (let row = 0; row < ROWS; row++) for (let column = 0; column < COLUMNS; column++) {
    const a = row * (COLUMNS + 1) + column, b = a + 1, c = a + COLUMNS + 1, d = c + 1;
    indices.set([a, b, c, b, d, c], nextIndex);
    nextIndex += 6;
  }

  const clamp = value => Math.max(0, Math.min(1, value));
  const smoother = value => {
    const t = clamp(value);
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  const fadeBelow = (y, start, end) => 1 - smoother((y - start) / (end - start));
  function oval(x, y, cx, cy, rx, ry, core = 0) {
    const distance = Math.hypot((x - cx) / rx, (y - cy) / ry);
    return 1 - smoother((distance - core) / (1 - core));
  }
  function faceFree(x, y, face) {
    const distance = Math.hypot((x - face[0]) / face[2], (y - face[1]) / face[3]);
    // Eyes and mouth keep a rigid transform; feather outside their full region.
    return smoother((distance - 1) / .50);
  }
  function capsule(x, y, start, end, radius, aspect) {
    const px = (x - start[0]) * aspect, py = y - start[1];
    const vx = (end[0] - start[0]) * aspect, vy = end[1] - start[1];
    const t = clamp((px * vx + py * vy) / (vx * vx + vy * vy || 1));
    const dx = px - vx * t, dy = py - vy * t;
    // A Gaussian falloff avoids a hard contour pulling across a narrow limb.
    return Math.exp(-2 * (dx * dx + dy * dy) / (radius * radius));
  }
  function stationaryWeight(x, y, definition) {
    let weight = 1;
    for (const anchor of Object.values(definition.anchors)) {
      weight *= 1 - oval(x, y, anchor[0], anchor[1], .11, .075, .55);
    }
    return weight;
  }

  function displacement(kind, x, y) {
    const definition = definitions[kind], joints = definition.joints;
    const freeFace = faceFree(x, y, definition.face);
    let dx = 0, dy = 0;
    const move = (tx, ty, weight) => { dx += tx * weight; dy += ty * weight; };
    const rotate = (pivot, angle, weight) => {
      const px = (x - pivot[0]) * definition.aspect, py = y - pivot[1];
      const cosine = Math.cos(angle), sine = Math.sin(angle);
      move((px * cosine - py * sine - px) / definition.aspect, px * sine + py * cosine - py, weight);
    };
    const arm = (pivot, hand, angle, radius = .17) => {
      rotate(pivot, angle, capsule(x, y, pivot, hand, radius, definition.aspect) * freeFace);
    };
    const breathe = (center, rx, ry, horizontal, vertical) => {
      const weight = oval(x, y, center[0], center[1], rx, ry, .20) * freeFace;
      move((x - center[0]) * horizontal, (y - center[1]) * vertical, weight);
    };

    // Each field describes a preparation offset from the supplied target
    // pose. The cycle eases this offset to zero, holds, then eases it back.
    switch (kind) {
      case 'tall':
        arm(joints.leftShoulder, joints.leftHand, -.24);
        arm(joints.rightShoulder, joints.rightHand, .24);
        breathe([.50, .56], .35, .20, -.025, -.012);
        break;
      case 'tree':
        move(-.012, .004, fadeBelow(y, .65, .93));
        arm(joints.leftShoulder, joints.leftHand, -.175);
        arm(joints.rightShoulder, joints.rightHand, .175);
        move(-.012, -.012, oval(x, y, ...joints.raisedKnee, .22, .18));
        break;
      case 'side':
        // The complete head receives one rigid hip rotation. Only the reaching
        // arm gets a second local change; the lower support leg remains fixed.
        rotate(joints.hip, -.105, fadeBelow(y, .55, .76));
        arm(joints.shoulder, joints.reachingHand, -.045, .11);
        move(-.008, -.008, oval(x, y, ...joints.lowerHand, .20, .17) * freeFace);
        break;
      case 'rock':
        arm(joints.leftShoulder, joints.leftHand, -.175, .11);
        arm(joints.rightShoulder, joints.rightHand, .175, .11);
        rotate(joints.hip, .04, oval(x, y, ...joints.raisedKnee, .25, .20));
        move(.006, -.008, oval(x, y, ...joints.raisedKnee, .25, .20));
        break;
      case 'lake':
        // Above the neck this is a single small rigid rotation, never separate
        // scaling of the eyes. The blend reaches zero before the seated base.
        rotate(joints.waist, .070, fadeBelow(y, .42, .84));
        move(.018, 0, oval(x, y, ...joints.chest, .28, .24) * freeFace);
        break;
      case 'mountain':
        move(0, .050, fadeBelow(y, .64, .94));
        move(0, .012, oval(x, y, ...joints.joinedHands, .35, .20) * freeFace);
        breathe(joints.chest, .43, .20, -.035, -.012);
        break;
      case 'ground':
        rotate(joints.leftHip, .045, oval(x, y, ...joints.leftKnee, .28, .20));
        rotate(joints.rightHip, -.045, oval(x, y, ...joints.rightKnee, .28, .20));
        move(.012, -.050, oval(x, y, ...joints.leftKnee, .28, .20));
        move(-.012, -.050, oval(x, y, ...joints.rightKnee, .28, .20));
        break;
      case 'rest':
        // This crop's y=0..0.20 is transparent. Only chest/abdomen breathe;
        // neither the full bitmap nor the neighbouring characters can sway.
        breathe(joints.chest, .32, .19, -.055, -.045);
        move(0, .003, oval(x, y, ...joints.abdomen, .24, .13) * freeFace);
        break;
    }
    const fixed = stationaryWeight(x, y, definition);
    return [dx * fixed, dy * fixed];
  }

  const fields = Object.fromEntries(Object.keys(definitions).map(kind => {
    const field = new Float32Array(uvs.length);
    for (let offset = 0; offset < uvs.length; offset += 2) {
      const delta = displacement(kind, uvs[offset], uvs[offset + 1]);
      field[offset] = delta[0]; field[offset + 1] = delta[1];
    }
    return [kind, field];
  }));

  function sample(kind, progress, options = {}) {
    if (!Object.prototype.hasOwnProperty.call(definitions, kind)) throw new RangeError('Unknown yoga motion pose: ' + kind);
    const numeric = Number(progress), p = Number.isNaN(numeric) ? 0 : clamp(numeric);
    const reduced = options?.reducedMotion === true;
    const phaseIndex = reduced ? 2 : p < .14 ? 0 : p < .50 ? 1 : p < .68 ? 2 : 3;
    const amount = reduced ? 0 : p === 1 ? 1 : p < .14 ? 1 : p < .50 ? 1 - smoother((p - .14) / .36)
      : p < .68 ? 0 : smoother((p - .68) / .32);
    const positions = new Float32Array(uvs.length), field = fields[kind];
    for (let index = 0; index < uvs.length; index++) positions[index] = uvs[index] + field[index] * amount;
    return {
      positions,
      uvs: new Float32Array(uvs),
      indices: new Uint16Array(indices),
      phase: ['prepare', 'extend', 'hold', 'return'][phaseIndex],
      phaseLabel: definitions[kind].phaseLabels[phaseIndex],
    };
  }

  return Object.freeze({ definitions, sample });
});
