import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sourceUrl = new URL('../workbench-ui/yoga/wonder-motion.js', import.meta.url);
const code = fs.readFileSync(sourceUrl, 'utf8');
const commonJS = { exports: {} };
const forbidden = () => { throw Error('Geometry must not use a DOM or timer'); };
vm.runInNewContext(code, { module: commonJS, setTimeout: forbidden, requestAnimationFrame: forbidden,
  document: new Proxy({}, { get: forbidden }) }, { filename: sourceUrl.pathname });
const motion = commonJS.exports;
const kinds = ['tall', 'tree', 'side', 'rock', 'lake', 'mountain', 'ground', 'rest'];
const signedArea = (positions, a, b, c) => {
  const ax = positions[a * 2], ay = positions[a * 2 + 1];
  const bx = positions[b * 2], by = positions[b * 2 + 1];
  const cx = positions[c * 2], cy = positions[c * 2 + 1];
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
};
const physicalDistance = (positions, a, b, aspect) => Math.hypot(
  (positions[a * 2] - positions[b * 2]) * aspect,
  positions[a * 2 + 1] - positions[b * 2 + 1],
);

test('the module supports browser and CommonJS without DOM or timer work', () => {
  const browser = {};
  vm.runInNewContext(code, browser, { filename: sourceUrl.pathname });
  assert.equal(typeof browser.YogaWonderMotion.sample, 'function');
  assert.deepEqual(Object.keys(motion.definitions), kinds);
  assert.deepEqual(Object.keys(browser.YogaWonderMotion.definitions), kinds);
  assert.equal(Object.isFrozen(motion.definitions), true);
  assert.equal(Object.isFrozen(motion.definitions.rest.viewport), true);
  assert.equal(motion.definitions.rest.viewport[1], 0, 'Rest keeps the transparent area above the blue crop');
  assert.ok(Math.abs(motion.definitions.rest.viewport[0] - 822.6737485488902) < 1e-9);
});

test('all eight loops close, reach the original target at .55 and provide four Chinese stage labels', () => {
  for (const kind of kinds) {
    const first = motion.sample(kind, 0), last = motion.sample(kind, 1), target = motion.sample(kind, .55);
    assert.equal(first.positions.constructor.name, 'Float32Array');
    assert.equal(first.uvs.constructor.name, 'Float32Array');
    assert.equal(first.indices.constructor.name, 'Uint16Array');
    assert.equal(first.positions.length, 21 * 25 * 2);
    assert.equal(first.uvs.length, first.positions.length);
    assert.equal(first.indices.length, 20 * 24 * 6);
    assert.deepEqual(first.positions, last.positions, `${kind} must close without a jump`);
    assert.deepEqual(target.positions, target.uvs, `${kind} target must preserve the original pose`);
    assert.deepEqual(motion.sample(kind, -100).positions, first.positions);
    assert.deepEqual(motion.sample(kind, 100).positions, last.positions);
    assert.deepEqual(motion.sample(kind, NaN).positions, first.positions);
    assert.deepEqual(motion.sample(kind, Infinity).positions, last.positions);
    const phases = [0, .3, .55, .9].map(progress => motion.sample(kind, progress));
    assert.deepEqual(phases.map(frame => frame.phase), ['prepare', 'extend', 'hold', 'return']);
    assert.ok(phases.every(frame => /[\u3400-\u9fff]/.test(frame.phaseLabel)));
  }
});

test('reduced motion is the unchanged target and returned buffers cannot corrupt later frames', () => {
  for (const kind of kinds) {
    for (const progress of [0, .21, .55, .89, 1]) {
      const frame = motion.sample(kind, progress, { reducedMotion: true });
      assert.deepEqual(frame.positions, frame.uvs);
      assert.equal(frame.phase, 'hold');
    }
    const before = motion.sample(kind, .25), changed = motion.sample(kind, .25);
    changed.positions[0] = 999;
    changed.uvs[0] = 999;
    changed.indices[0] = 65535;
    const later = motion.sample(kind, .25);
    assert.deepEqual(later.positions, before.positions);
    assert.deepEqual(later.uvs, before.uvs);
    assert.deepEqual(later.indices, before.indices);
  }
  assert.throws(() => motion.sample('unknown', .5), /Unknown yoga motion pose/);
  assert.throws(() => motion.sample('toString', .5), /Unknown yoga motion pose/);
});

test('the entire sampled cycle stays finite, inside its padding and free of flipped or collapsed triangles', () => {
  for (const kind of kinds) {
    const original = motion.sample(kind, .55);
    for (let tick = 0; tick <= 100; tick++) {
      const frame = motion.sample(kind, tick / 100);
      assert.deepEqual(frame.uvs, original.uvs, `${kind} texture coordinates must not drift`);
      assert.deepEqual(frame.indices, original.indices);
      for (const value of frame.positions) {
        assert.ok(Number.isFinite(value));
        assert.ok(value >= -.22 && value <= 1.22, `${kind} escaped the transparent padding at ${tick}%`);
      }
      for (let index = 0; index < frame.indices.length; index += 3) {
        const [a, b, c] = frame.indices.subarray(index, index + 3);
        const area = signedArea(frame.positions, a, b, c);
        const baseline = signedArea(original.positions, a, b, c);
        assert.ok(area > baseline * .20, `${kind} folded or collapsed a triangle at ${tick}%`);
      }
    }
  }
});

test('motion changes local regions rather than moving the bitmap rigidly, while support points remain fixed', () => {
  for (const kind of kinds) {
    const frame = motion.sample(kind, 0), definition = motion.definitions[kind];
    let moved = 0, stationary = 0, maximumLocalStrain = 0;
    for (let vertex = 0; vertex < frame.positions.length / 2; vertex++) {
      const offset = vertex * 2;
      const distance = Math.hypot(frame.positions[offset] - frame.uvs[offset], frame.positions[offset + 1] - frame.uvs[offset + 1]);
      if (distance > .001) moved++;
      if (distance < 1e-7) stationary++;
      if (vertex % 21 < 20) {
        const original = physicalDistance(frame.uvs, vertex, vertex + 1, definition.aspect);
        const current = physicalDistance(frame.positions, vertex, vertex + 1, definition.aspect);
        maximumLocalStrain = Math.max(maximumLocalStrain, Math.abs(current / original - 1));
      }
    }
    assert.ok(moved >= 6, `${kind} needs visible local motion`);
    assert.ok(stationary >= 25, `${kind} must retain stable regions`);
    assert.ok(maximumLocalStrain > .002, `${kind} must deform body parts, not rotate or translate the whole image`);
    for (const [name, anchor] of Object.entries(definition.anchors)) {
      const column = Math.round(anchor[0] * 20), row = Math.round(anchor[1] * 24);
      const offset = (row * 21 + column) * 2;
      assert.equal(frame.positions[offset], frame.uvs[offset], `${kind}/${name} x support drift`);
      assert.equal(frame.positions[offset + 1], frame.uvs[offset + 1], `${kind}/${name} y support drift`);
    }
  }
});

test('the principal limb movement is legible at classroom scale without exaggerating rest', () => {
  // Distances are fractions of the displayed character height. A 400px actor
  // needs more than a one-pixel limb adjustment to communicate an action.
  const minimumMoves = {
    tall: ['leftHand', .07], tree: ['rightHand', .06], side: ['reachingHand', .07],
    rock: ['leftHand', .04], lake: ['neck', .02], mountain: ['joinedHands', .05],
    ground: ['leftKnee', .05],
  };
  for (const [kind, [joint, minimum]] of Object.entries(minimumMoves)) {
    const definition = motion.definitions[kind], frame = motion.sample(kind, 0);
    const [x, y] = definition.joints[joint];
    const offset = (Math.round(y * 24) * 21 + Math.round(x * 20)) * 2;
    const distance = Math.hypot((frame.positions[offset] - frame.uvs[offset]) * definition.aspect,
      frame.positions[offset + 1] - frame.uvs[offset + 1]);
    assert.ok(distance >= minimum, `${kind}/${joint} is too small to read in the classroom`);
  }
  const rest = motion.sample('rest', 0);
  let largestBreath = 0;
  for (let offset = 0; offset < rest.positions.length; offset += 2) {
    largestBreath = Math.max(largestBreath, Math.hypot(
      (rest.positions[offset] - rest.uvs[offset]) * motion.definitions.rest.aspect,
      rest.positions[offset + 1] - rest.uvs[offset + 1]));
  }
  assert.ok(largestBreath > .002 && largestBreath < .015, 'Rest should remain a small local breath');
});

test('protected faces stay nearly rigid and timing boundaries have smooth displacement', () => {
  for (const kind of kinds) {
    const definition = motion.definitions[kind], [cx, cy, rx, ry] = definition.face;
    const target = motion.sample(kind, .55);
    const inside = vertex => Math.hypot((target.uvs[vertex * 2] - cx) / rx, (target.uvs[vertex * 2 + 1] - cy) / ry) < .8;
    let checked = 0;
    for (const progress of [0, .31, .82]) {
      const frame = motion.sample(kind, progress);
      for (let vertex = 0; vertex < 525; vertex++) {
        if (vertex % 21 === 20 || !inside(vertex) || !inside(vertex + 1)) continue;
        const ratio = physicalDistance(frame.positions, vertex, vertex + 1, definition.aspect)
          / physicalDistance(target.positions, vertex, vertex + 1, definition.aspect);
        assert.ok(Math.abs(ratio - 1) < .002, `${kind} distorted an eye/face region`);
        checked++;
      }
    }
    assert.ok(checked >= 6, `${kind} face protection must be sampled`);
    for (const boundary of [.14, .50, .68]) {
      const before = motion.sample(kind, boundary - .0001), after = motion.sample(kind, boundary + .0001);
      assert.ok(before.positions.every((value, index) => Math.abs(value - after.positions[index]) < 1e-6), `${kind} jumps at phase ${boundary}`);
    }
  }
});
