import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const {loadRig,bakeSvg} = require('../workbench-ui/yoga/bake-motions.cjs');
const rig = loadRig();
const roles = ['poppy','edi','rolly','milo','ace'];
const legacy = {renderBackground:()=>'<i>background</i>',renderReference:()=>'imported reference',setProgress(){}};
const page = {kind:'action',actionId:'tree',backendPose:'Tree Pose',title:'Tree',english:'Balance on one foot.'};
const catalog = roles.flatMap(characterId => rig.motions.map(({id:poseId,...motion}) => ({
  characterId, poseId, ...motion, frameCount:24, durationMs:1200,
  url:'/api/yoga-motions/'+characterId+'/'+poseId+'?v='+crypto.createHash('sha256').update(characterId+poseId).digest('hex')
})));
function setup(reduced = false) {
  const context = vm.createContext({URL});
  for (const file of ['public/workbench-v6/prep-workbench-six-modules-v1/language-goals.js','workbench-ui/yoga/model.js']) {
    vm.runInContext(fs.readFileSync(new URL('../'+file, import.meta.url),'utf8'),context);
  }
  const model = context.YogaModel;
  model.installMotionLibrary(catalog);
  const module = {exports:{}};
  vm.runInNewContext(fs.readFileSync(new URL('../workbench-ui/yoga/course-scene.js',import.meta.url),'utf8'),{module});
  return {scene:module.exports(legacy,{YogaModel:model,matchMedia:()=>({matches:reduced})}),model};
}

test('classroom and teacher reference select the same versioned frame asset for every role and pose', () => {
  const {scene} = setup();
  for (const clip of catalog) {
    const isGuide = clip.poseId === 'guide';
    const p = {...page,kind:isGuide?'cover':'action',actionId:clip.poseId};
    const settings = {characterId:clip.characterId};
    const classroom = scene.renderCourseScene(p,settings,{backgroundMarkup:'<img alt="forest"/>'});
    assert.ok(classroom.includes('<img alt="forest"/>'));
    assert.ok(classroom.includes(clip.url+'#f12'));
    assert.ok(scene.renderReference(p,settings).includes(clip.url+'#f12'));
  }
  assert.equal(scene.clipFor({...page,teacher:'另一边脚尖点地'},{characterId:'poppy'}).poseId,'tree-toes');
  assert.equal(scene.renderReference({...page,wonder:{}},{}),'imported reference');
  assert.match(scene.renderCourseScene({...page,actionId:'unknown'},{characterId:'poppy'}), /此页暂无对应动作/);
});

test('clock seeks stored frames, closes the loop and respects reduced motion', () => {
  const clip = catalog[0];
  function sample(t, reduced=false) {
    const {scene} = setup(reduced);
    let href = '';
    const use = {getAttribute:()=>href,setAttribute:(_,v)=>{href=v;}};
    scene.setProgress({querySelectorAll:()=>[{dataset:{clipUrl:clip.url,frameCount:'24'},querySelector:()=>use}]}, t);
    return href;
  }
  assert.equal(sample(0),sample(1));
  assert.equal(sample(.5),clip.url+'#f12');
  assert.equal(sample(.9,true),sample(0,true));
});

test('new drafts pin stored motion revisions, survive saving and rebind changed characters', () => {
  const {model} = setup();
  const source = ['','Chair Pose','Warrior II','Side Bend','Upward Salute',''].map((pose,i) =>
    ({type:i===0?'scene':i===5?'ending':'action',pose,subtitle:'Follow me.'}));
  const empty = model.createState(), settings = {...empty.settings,characterId:'ace'};
  let state = model.useBackendCourse(empty,settings,{title:'Practice',pages:source});
  assert.ok(state.draft.pages.every(p=>p.motionRef.characterId==='ace'));
  assert.equal(state.draft.pages[1].motionRef.poseId,'chair');
  assert.doesNotThrow(()=>model.validateState(JSON.parse(JSON.stringify(state))));
  const oldRef = state.draft.pages[1].motionRef;
  model.installMotionLibrary(catalog.map(c=>({...c,url:c.url.split('=')[0]+'='+'e'.repeat(64)})));
  assert.equal(model.clipForPage(state.draft.pages[1],settings).url,oldRef.url);
  state = model.editContent(state,{target:'settings',values:{characterId:'milo'}});
  assert.ok(state.draft.pages.every(p=>p.motionRef.characterId==='milo'));
  assert.doesNotThrow(()=>model.validateState(JSON.parse(JSON.stringify(state))));
});

test('one baked SVG can be played independently or sampled by frame ID', () => {
  const document = bakeSvg(rig,'edi',rig.motions.find(m=>m.id==='chair'),1000,25);
  assert.equal((document.match(/id="f\d+"/g)||[]).length,25);
  assert.equal((document.match(/repeatCount="indefinite"/g)||[]).length,25);
  const ids = new Set([...document.matchAll(/ id="([^"]+)"/g)].map(match=>match[1]));
  for (const link of document.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(link[1]));
  assert.doesNotMatch(document, /(?:NaN|Infinity|<script|<image|foreignObject)/);
});
