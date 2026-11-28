import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';

const module = {exports:{}};
vm.runInNewContext(fs.readFileSync(new URL('../workbench-ui/yoga/course-scene.js',import.meta.url),'utf8'),{module});
const legacy={renderBackground:()=>'<i>background</i>',renderReference:()=>'imported reference',setProgress(){}};
const scene=module.exports(legacy);
const settings={characterId:'poppy'};
const page={kind:'action',actionId:'tree',backendPose:'Tree Pose',title:'Under the tree',english:'Find the firefly.'};

function measure(action, progress, reduced=false) {
  const state={};
  const node=key=>({setAttribute:(_,value)=>{state[key]=value;}});
  const attrs={'data-yc-rig':'poppy','data-yc-action':action,'data-yc-variation':'toes'};
  const svg={
    getAttribute:key=>attrs[key],
    querySelector:key=>node(key),
    querySelectorAll:key=>[node(key)]
  };
  const adapter=module.exports(legacy,{matchMedia:()=>({matches:reduced})});
  adapter.setProgress({querySelectorAll:()=>[svg]},progress);
  return state;
}

test('generated classroom scenes contain the selected recognizable character and the reference uses the same pose',()=>{
  const ids=['poppy','edi','rolly','milo','ace'];
  const bodies=ids.map(characterId=>{
    const html=scene.renderCourseScene(page,{characterId},{backgroundMarkup:'<img alt="forest"/>'});
    assert.ok(html.includes('<img alt="forest"/>'));
    assert.ok(html.includes('data-yc-rig="'+characterId+'" data-yc-action="tree"'));
    assert.ok(html.indexOf('</svg></div>') < html.indexOf('class="yc-caption"'));
    assert.ok(scene.renderReference(page,{characterId}).includes('data-yc-rig="'+characterId+'" data-yc-action="tree"'));
    return html.match(/<g data-yc-torso=""[^>]+><path d="([^"]+)"/)[1];
  });
  assert.equal(new Set(bodies).size,ids.length);
  assert.equal(scene.renderReference({...page,wonder:{source:1}},settings),'imported reference');
  assert.match(scene.renderCourseScene({...page,kind:'cover',actionId:null},settings),/data-yc-action="guide"/);
  assert.match(scene.renderCourseScene({...page,kind:'intro',actionId:'savasana'},settings),/data-yc-action="savasana"/);
  assert.match(scene.renderCourseScene({...page,actionId:'unrecognized'},settings),/data-yc-action="guide"/);
});

test('the clock articulates the limbs of each pose, respects planted feet and restores the start pose',()=>{
  for (const id of ['mountain','tree','star','butterfly','garland','savasana']) {
    const initial=measure(id,0), target=measure(id,.55);
    assert.deepEqual(measure(id,1),initial,id);
    assert.notDeepEqual(initial,target,id);
    assert.deepEqual(measure(id,0,true),measure(id,1,true),id);
    assert.deepEqual(measure(id,0,true),target,id);
    if(['tree','garland','savasana','butterfly'].includes(id)){
      assert.equal(initial['[data-yc-tip="leg0"]'],target['[data-yc-tip="leg0"]'],id);
    }
    const key=id==='butterfly'?'leg0':'arm1';
    assert.notEqual(initial['[data-yc-path="'+key+'"]'],target['[data-yc-path="'+key+'"]'],id);
  }
});
