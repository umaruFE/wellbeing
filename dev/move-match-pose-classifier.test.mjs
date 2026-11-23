import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({ window: {} });
vm.runInContext(readFileSync(new URL('../workbench-ui/move-match-v1/classroom/pose-classifier.js', import.meta.url), 'utf8'), context);
const { evaluate } = context.window.MMClassroomPoseClassifier;
const point = (x, y) => ({ x, y, z: 0, visibility: 0.99, presence: 0.99 });
function body() {
  const a = Array.from({ length: 33 }, () => point(0.5, 0.2));
  for (const [i, x, y] of [[11,.4,.35],[12,.6,.35],[13,.36,.48],[14,.64,.48],[15,.36,.62],[16,.64,.62],
    [23,.43,.55],[24,.57,.55],[25,.43,.72],[26,.57,.72],[27,.43,.92],[28,.57,.92]]) a[i] = point(x,y);
  return a;
}
function raised(side, a = body()) {
  if (side === 'left' || side === 'both') { a[13] = point(.32,.24); a[15] = point(.30,.12); }
  if (side === 'right' || side === 'both') { a[14] = point(.68,.24); a[16] = point(.70,.12); }
  return a;
}
function crouched() {
  const a = body();
  for (const [i,x,y] of [[23,.43,.65],[24,.57,.65],[25,.32,.70],[26,.68,.70],[27,.33,.91],[28,.67,.91]]) a[i]=point(x,y);
  return a;
}
function oneLeg() {
  const a=body();a[26]=point(.64,.60);a[28]=point(.54,.73);return a;
}
const is = (a, gesture, status, options = {}) => assert.equal(evaluate(a, { gesture, ...options }).status, status);

test('left/right use anatomical landmark IDs, including a mirrored camera image', () => {
  for (const side of ['left','right']) {
    const a=raised(side);
    is(a, side, 'matched');
    is(a, side === 'left' ? 'right':'left', 'adjust');
    is(a.map(p=>({...p,x:1-p.x})), side, 'matched');
  }
});

test('single-arm and both-arm poses stay distinct and shoulder-height wrists do not pass', () => {
  is(raised('both'),'both','matched');
  is(raised('both'),'left','adjust');is(raised('both'),'right','adjust');
  is(raised('left'),'both','adjust');
  const a=raised('left');a[15].y=.34;is(a,'left','adjust');
  a[15].y=.12;a[16].y=.35;is(a,'left','adjust');
});

test('low confidence, absent joints, out-of-frame hands and non-finite points cannot pass', () => {
  is(null,'left','missing');is([],'left','missing');
  for (const change of [p=>{p.visibility=.54;},p=>{p.presence=.54;},p=>{delete p.visibility;},p=>{p.x=-.1;},p=>{p.y=1.1;},p=>{p.y=NaN;}]) {
    const a=raised('left');change(a[15]);is(a,'left','missing');
  }
  const a=raised('left');delete a[15].presence;is(a,'left','matched');
  a[16]=undefined;is(a,'left','missing');
});

test('squat requires two bent knees and visible lower body; standing and a single bent leg fail', () => {
  is(crouched(),'squat','matched');is(body(),'squat','adjust');is(oneLeg(),'squat','adjust');
  for (const i of [23,24,25,26,27,28]) { const a=crouched();a[i].visibility=.1;is(a,'squat','missing'); }
  const upperOnly=crouched();upperOnly[27].y=1.2;upperOnly[28].y=1.2;is(upperOnly,'squat','missing');
});

test('seated squat is hands on the lap, with no ankle requirement or standing-squat substitution', () => {
  const a=body();
  a[23]=point(.43,.62);a[24]=point(.57,.62);a[25]=point(.38,.76);a[26]=point(.62,.76);
  a[15]=point(.405,.69);a[16]=point(.595,.69);a[27].visibility=0;a[28].visibility=0;
  is(a,'squat','matched',{seated:true});is(a,'squat','missing');
  a[15]=point(.43,.62);a[16]=point(.57,.62);is(a,'squat','adjust',{seated:true});
  a[25].visibility=.1;is(a,'squat','missing',{seated:true});
});

test('clap accepts hands together at chest/head height, but rejects hands apart or together on lap', () => {
  const a=body();a[15]=point(.48,.30);a[16]=point(.52,.30);is(a,'clap','matched');
  is(raised('both'),'clap','adjust');
  a[15].y=.65;a[16].y=.65;is(a,'clap','adjust');
  const overhead=raised('both');overhead[15].x=.48;overhead[16].x=.52;
  is(overhead,'clap','matched');is(overhead,'both','adjust');
});

test('standing balance needs one raised ankle and a straight supporting knee', () => {
  is(oneLeg(),'balance','matched');is(body(),'balance','adjust');is(crouched(),'balance','adjust');
  const a=oneLeg();a[27].visibility=.1;is(a,'balance','missing');
});

test('seated balance uses horizontally extended arms, not a one-leg pose', () => {
  const a=body();a[13]=point(.29,.35);a[14]=point(.71,.35);a[15]=point(.18,.35);a[16]=point(.82,.35);
  a[27].visibility=0;a[28].visibility=0;
  is(a,'balance','matched',{seated:true});
  is(a.map(p=>({...p,x:1-p.x})),'balance','matched',{seated:true});
  is(raised('both'),'balance','adjust',{seated:true});is(oneLeg(),'balance','adjust',{seated:true});
});

test('pose checks are scale/translation invariant and compensate for independently normalized axes', () => {
  for (const [a,gesture] of [[raised('left'),'left'],[raised('both'),'both'],[crouched(),'squat'],[oneLeg(),'balance']]) {
    const smaller=a.map(p=>({...p,x:.5+(p.x-.5)*.7,y:.1+p.y*.7}));is(smaller,gesture,'matched');
    const wide=a.map(p=>({...p,x:.5+(p.x-.5)/1.7778}));is(wide,gesture,'matched',{aspectRatio:1.7778});
  }
});

test('unsupported actions and degenerate shoulder geometry cannot produce success', () => {
  is(body(),'unknown','adjust');
  const a=raised('both');a[12]={...a[11]};is(a,'both','missing');
});
