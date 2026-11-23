import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const runtime = read('workbench-ui/move-match-v1/classroom/runtime.generated.js');
const env = vm.createContext({});
vm.runInContext(runtime.slice(runtime.indexOf('function MMOutcomeOf('), runtime.indexOf('function MMOutcomeLabel(')), env);
const transition = (game, event) => JSON.parse(JSON.stringify(env.MMOutcomeTransition(game, event)));
const fresh = () => ({ phase:'answering', index:0, collected:[], records:[], attempts:0, outcome:null, failureReason:null, epoch:4 });

test('a correct answer flies immediately and cannot be overwritten by a late timeout', () => {
  const answer = transition(fresh(), {correct:true});
  assert.equal(answer.phase, 'flying'); assert.equal(answer.outcome, 'success');
  assert.deepEqual(transition(answer, {expired:true}), answer);
});

test('a wrong move leaves the same countdown active and can be corrected before expiry', () => {
  const wrong = transition(fresh(), {});
  assert.equal(wrong.phase, 'answering'); assert.equal(wrong.outcome, null);
  assert.equal(wrong.attempts, 1); assert.equal(wrong.epoch, 4);
  const correct = transition(wrong, {correct:true});
  assert.equal(correct.phase, 'flying'); assert.equal(correct.outcome, 'success');
  assert.equal(correct.attempts, 1); assert.equal(correct.failureReason, null);
});

test('deadline sends unanswered and still-wrong cards to their correct tray as unsuccessful', () => {
  for (const wrong of [false, true]) {
    const game = wrong ? transition(fresh(), {}) : fresh();
    const expired = transition(game, {expired:true,correct:true});
    assert.equal(expired.phase, 'flying'); assert.equal(expired.outcome, 'unsuccessful');
    assert.equal(expired.failureReason, wrong ? 'incorrect' : 'timeout');
    assert.deepEqual(transition(expired, {correct:true}), expired);
  }
});

function repository() {
  const data=new Map();
  const context=vm.createContext({console,localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}});
  context.window=context;
  vm.runInContext(read('workbench-ui/move-match-v1/model.js'),context);
  vm.runInContext(read('dist/workbench-v6/move-match-v1/catalog.js'),context);
  vm.runInContext("var repo=new MMModel.Repository(localStorage), activity=repo.create(MMCatalog.find(t=>t.id==='articles-four')); activity=repo.confirm(activity.id,activity.revision); var session=repo.startSession(activity.id,activity.activeReleaseId);",context);
  const run=code=>vm.runInContext(code,context);
  return {context,run,session:()=>JSON.parse(run('JSON.stringify(session)')),
    save(progress){context.input=JSON.stringify(progress);return JSON.parse(run('session=repo.saveProgress(session.id,JSON.parse(input),session.revision);JSON.stringify(session)'));},
    reload(){run('repo=new MMModel.Repository(localStorage)');return JSON.parse(run('JSON.stringify(repo.getSession(session.id))'));}};
}
function progress(session) {
  const items=session.lesson.items;
  const records=[
    {item:items[0],attempts:1,independent:false,outcome:'success',failureReason:null},
    {item:items[1],attempts:1,independent:false,outcome:'unsuccessful',failureReason:'incorrect'},
    {item:items[2],attempts:0,independent:false,outcome:'unsuccessful',failureReason:'timeout'},
  ];
  return {schemaVersion:1,lessonId:session.lesson.id,game:{phase:'answering',index:3,collected:items.slice(0,3).map(i=>i.id),records,attempts:1,epoch:5,outcome:null,failureReason:null,remainingMs:987.5},paused:true,settings:session.settings,simulation:{enabled:true,scenario:'retry'},timedOut:false,hint:'Try again before time is up.'};
}
function bridge(session, value) {
  const token='outcome-check',payload={schemaVersion:1,token,mode:'classroom',lesson:session.lesson,settings:session.settings,progress:value};
  const c=vm.createContext({URLSearchParams,location:{origin:'https://test.local',search:'?launch='+token},sessionStorage:{getItem:()=>JSON.stringify(payload)},addEventListener(){}});
  c.window=c;c.parent=c;
  vm.runInContext(read('workbench-ui/move-match-v1/classroom/bridge.js'),c);
  return JSON.parse(JSON.stringify(c.MMClassroom));
}

test('result and remaining countdown survive saved sessions and the classroom bridge', () => {
  const f=repository(),value=progress(f.session());
  f.save(value);
  const restored=f.reload();
  assert.deepEqual(restored.progress,value);
  const frame=bridge(restored,restored.progress);
  assert.equal(frame.valid,true,frame.error);
  assert.deepEqual(frame.progress,value);
});

test('legacy collected cards remain successful even when they needed a retry', () => {
  const f=repository(),value=progress(f.session());
  value.game.index=1;value.game.collected=value.game.collected.slice(0,1);value.game.records=value.game.records.slice(0,1);
  delete value.game.outcome;delete value.game.failureReason;delete value.game.remainingMs;
  delete value.game.records[0].outcome;delete value.game.records[0].failureReason;
  const saved=f.save(value);
  assert.equal(saved.progress.game.records[0].outcome,'success');
  assert.equal(saved.progress.game.records[0].independent,false);
  assert.equal(saved.progress.game.outcome,null);
  const frame=bridge(f.session(),value);
  assert.equal(frame.valid,true,frame.error);assert.equal(frame.progress.game.records[0].outcome,'success');
});

test('invalid outcomes and countdown values do not replace a saved classroom', () => {
  for(const corrupt of [p=>p.game.records[0].outcome='pending',p=>p.game.records[0].outcome=null,p=>p.game.records[0].outcome='',p=>p.game.records[2].independent=true,p=>p.game.remainingMs=-1,p=>p.game.remainingMs=99999,p=>{p.game.outcome='unsuccessful';p.game.failureReason='incorrect';},p=>p.game.failureReason='incorrect']) {
    const f=repository(),value=progress(f.session());f.save(value);const before=f.reload();
    corrupt(value);assert.throws(()=>f.save(value));assert.deepEqual(f.reload(),before);
    assert.equal(bridge(before,value).valid,false);
  }
});

test('completed progress must match the last collected card result and failure reason', () => {
  const f=repository(),session=f.session(),value=progress(session),items=session.lesson.items;
  value.game={phase:'complete',index:items.length-1,collected:items.map(i=>i.id),records:items.map(item=>({item,attempts:0,independent:true,outcome:'success',failureReason:null})),attempts:0,epoch:40,outcome:'unsuccessful',failureReason:'timeout',remainingMs:0};
  value.game.records.at(-1).independent=false;value.game.records.at(-1).outcome='unsuccessful';value.game.records.at(-1).failureReason='timeout';
  f.save(value);const before=f.reload();
  for(const patch of [{outcome:'success',failureReason:null},{outcome:'unsuccessful',failureReason:'incorrect'},{outcome:null,failureReason:null}]) {
    const bad=structuredClone(value);Object.assign(bad.game,patch);
    assert.throws(()=>f.save(bad));assert.deepEqual(f.reload(),before);
    assert.equal(bridge(before,bad).valid,false);
  }
});

test('pause freezes the clock and restores the saved remainder instead of a full question', () => {
  const clockSource=runtime.slice(runtime.indexOf('Xs=class'),runtime.indexOf(';function Eh('));
  const c=vm.createContext({});vm.runInContext('var '+clockSource+';this.Clock=Xs',c);
  const clock=new c.Clock();clock.configure('question',6000,true,0);clock.freeze(2400);
  assert.equal(clock.snapshot(20000).remainingMs,3600);
  clock.configure('question',6000,true,20000);assert.equal(clock.snapshot(21000).remainingMs,2600);
  assert.equal(clock.takeElapsed(),false);clock.snapshot(23600);assert.equal(clock.takeElapsed(),true);assert.equal(clock.takeElapsed(),false);
  let now=1000;
  const effects=[];
  const hooks={useRef:value=>({current:value}),useState:value=>[value,()=>{}],useEffect:effect=>effects.push(effect)};
  const saved=vm.createContext({Ho:hooks,document:{hidden:false},performance:{now:()=>now},setTimeout:()=>1,clearTimeout(){}});
  const hookSource=runtime.slice(runtime.indexOf('Xs=class'),runtime.indexOf('var h=W(ge(),1),Qs='));
  vm.runInContext('var '+hookSource,saved);
  const restored=saved.Eh({phaseKey:'saved-question',durationMs:6000,initialRemainingMs:1234,running:true,onElapsed(){}});
  const cleanup=effects[0]();
  assert.equal(restored.getRemainingMs(),1234);
  now=1100;assert.equal(restored.getRemainingMs(),1134);
  cleanup();now=9000;assert.equal(restored.getRemainingMs(),1134);
});
