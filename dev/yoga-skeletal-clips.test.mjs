import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const context=vm.createContext({});
for (const source of ['character-skins','skeletal-clips']) {
  vm.runInContext(fs.readFileSync(new URL('../workbench-ui/yoga/'+source+'.js',import.meta.url),'utf8'),context);
}
const rig=context.YogaSkeletalClips;
const ids=['poppy','edi','rolly','milo','ace'];
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const close=(a,b,description)=>assert.ok(Math.abs(a-b)<1e-5,description+' ('+a+' vs '+b+')');
const points=f=>[f.root,...[...f.arms,...f.legs].flatMap(l=>[l.a,l.b,l.c])];

test('each authored character-motion combination preserves bind lengths and closes its loop',()=>{
  for(const id of ids) for(const {id:motion} of rig.motions) {
    const tag=id+' '+motion,start=rig.sample(id,motion,0);
    let last=points(start),maxTravel=0;
    for(let i=1;i<=120;i++) {
      const f=rig.sample(id,motion,i/120),current=points(f);
      for(const [limbs,lengths] of [[f.arms,f.skin.armLengths],[f.legs,f.skin.legLengths]]) {
        for(const joint of limbs) {
          close(distance(joint.a,joint.b),lengths[0],tag+' upper');
          close(distance(joint.b,joint.c),lengths[1],tag+' lower');
        }
      }
      const step=Math.max(...current.map((p,n)=>distance(p,last[n])));
      assert.ok(step<15,tag+' jumps '+step+' units at '+i);
      maxTravel=Math.max(maxTravel,...current.map((p,n)=>distance(p,points(start)[n])));
      last=current;
    }
    points(start).forEach((p,n)=>close(distance(p,last[n]),0,tag+' first/last frame'));
    assert.ok(maxTravel>.65,tag+' has no visible movement');
    assert.doesNotMatch(rig.renderFrame(id,motion,.52),/NaN|undefined|Infinity/);
  }
});

test('standing poses keep supporting feet planted and the front warrior knee is above the ankle',()=>{
  for(const id of ids) for(const motion of ['mountain','star','garland','chair','warrior-ii','upward-salute','side-bend','tree','tree-toes']) {
    const start=rig.sample(id,motion,0),tag=id+' '+motion;
    for(let i=0;i<=32;i++) {
      const f=rig.sample(id,motion,i/32);
      close(distance(start.legs[0].c,f.legs[0].c),0,tag+' support');
      if(!motion.startsWith('tree'))close(distance(start.legs[1].c,f.legs[1].c),0,tag+' second support');
      if(motion==='tree-toes'){
        close(f.legs[1].c[1]+rig.toeDrop(f.skin,f.legs[1].angle),201,tag+' free toe contact');
      }
    }
    if(motion==='warrior-ii'){
      const {legs}=rig.sample(id,motion,.52);
      assert.ok(Math.abs(legs[0].b[0]-legs[0].c[0])<1.5,tag+' front shin');
      assert.ok(distance(legs[1].a,legs[1].c)>=distance(legs[1].a,legs[1].b)+distance(legs[1].b,legs[1].c)-.1,tag+' back knee');
    }
  }
});

test('all ten course motion names are actual backend pose keys; the guide and supported variant are distinct',()=>{
  const source=fs.readFileSync(new URL('../api/src/lib/experience/yogaPoses.ts',import.meta.url),'utf8');
  const poses=rig.motions.filter(m=>m.pose);
  assert.equal(poses.length,10);
  for(const {pose} of poses) assert.ok(source.includes("en: '"+pose+"'"),pose);
  assert.equal(new Set(rig.motions.map(m=>m.id)).size,12);
});
