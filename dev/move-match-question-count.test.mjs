import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import vm from 'node:vm';

const sourceRuntime = new URL('../public/workbench-v6/', import.meta.url);
const root = existsSync(new URL('move-match-v1/index.html', sourceRuntime))
  ? sourceRuntime : new URL('../dist/workbench-v6/', import.meta.url);
const quantities = [10, 20, 30, 50];
const templates = ['articles-four', 'articles-two', 'be-three'];
const read = path => readFileSync(new URL(path, root), 'utf8');
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

// Exercise the actual UI event handlers, generator, repository and classroom
// transport. The DOM shell records rendered HTML; it does not emulate a browser.
function fixture(packaged, api) {
  const listeners = {}, data = new Map(), sessions = new Map(), timers = new Map();let timerId=0;
  const storage = map => ({ getItem: key => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) });
  const node = () => ({ innerHTML: '', textContent: '', value: '', dataset: {}, style: {},
    classList: { add() {}, remove() {}, toggle() {} }, focus() {}, scrollIntoView() {},
    setAttribute() {}, removeAttribute() {}, addEventListener() {},
    replaceChildren() { this.innerHTML = ''; }, showModal(){this.open=true;}, close() { this.open = false; } });
  const nodes = Object.fromEntries(['#app', '#modal', '#stage', '#notice', '#save-status',
    '#save-error', '#question-edit-errors', '.toolbar-title', '#prep-goal-input', '#goal-tags',
    '#prep-question-count', '#prep-question-count-help', '#preview-question-count',
    '.preparation-errors', '#generation-status'].map(id => [id, node()]));
  const context = vm.createContext({ URLSearchParams, AbortController, console, crypto: { randomUUID },
    WBWorkbenchApi: api && { activityStore: () => null, ...api },
    WB_WEB_SCOPE: 'count_test', scrollY: 0, scrollTo() {},
    location: { origin: 'https://test.local', hash: '' },
    history: { replaceState() {} }, CSS:{escape:value=>value}, setTimeout: (fn,ms) => {const id=++timerId;timers.set(id,{fn,ms});return id;}, clearTimeout(id) {timers.delete(id);},
    localStorage: storage(data), sessionStorage: storage(sessions),
    addEventListener() {},
    document: { hidden: false, body: { style: {} }, activeElement: null,
      querySelector: selector => nodes[selector] ?? null, querySelectorAll: () => [],
      addEventListener: (type, listener) => { listeners[type] = listener; } },
    MMPlatform: { homeShell: html => html, editorShell: html => html,
      homeHeading: html => html, decorate() {} },
  });
  context.window = context; context.parent = context;
  const run = (code, filename) => vm.runInContext(code, context, { filename });
  for (const file of ['model.js', 'catalog.js', 'word-bank.js', 'grammar-bank.js',
    'generation.js', 'question-art.js', 'linked-content.js', 'question-context.js']) {
    const source = !packaged && file === 'model.js'
      ? readFileSync(new URL('../workbench-ui/move-match-v1/model.js', import.meta.url), 'utf8')
      : read('move-match-v1/' + file);
    run(source, file);
  }
  run(read('prep-workbench-six-modules-v1/language-goals.js'), 'language-goals.js');
  const originalCatalog = run('JSON.stringify(MMCatalog)');
  run(packaged ? read('move-match-v1/app.js') : readFileSync(new URL('../workbench-ui/move-match-v1/app.js', import.meta.url), 'utf8'), 'app.js');
  assert.match(nodes['#app'].innerHTML, /case-grid/, 'library must load');
  const input = async target => { listeners.input({ target }); await settle(); };
  return { nodes, data, sessions, context, run, originalCatalog, input,
    tickSave(){for(const [id,timer]of [...timers])if(timer.ms===350){timers.delete(id);timer.fn();}},
    async change(target){listeners.change({target});await settle();},
    async click(action, dataset = {}) {
      const target = { dataset: { action, ...dataset } };
      listeners.click({ target: { closest: () => target } }); await settle();
    },
    async caseCount(id, count) {
      await input({ dataset: { caseQuestionCount: id }, value: String(count), closest: () => null });
    },
    async prepCount(count) {
      const target = nodes['#prep-question-count'];
      target.dataset.preparation = 'questionCount'; target.value = String(count);
      await input(target);
    },
    activities: () => JSON.parse(run('JSON.stringify(new MMModel.Repository(localStorage).list())')),
    payload: () => JSON.parse([...sessions.values()].at(-1)),
  };
}

function selectValues(html, id) {
  const select = html.match(new RegExp(`<select\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)</select>`));
  assert.ok(select, `${id} must be a select`);
  assert.doesNotMatch(html, new RegExp(`<input\\b[^>]*id="${id}"`));
  return [...select[1].matchAll(/<option value="(\d+)"/g)].map(match => Number(match[1]));
}

function classroom(payload) {
  const context = vm.createContext({ URLSearchParams, location: {
    origin: 'https://test.local', search: '?launch=' + payload.token },
    WB_WEB_SCOPE: 'count_test', addEventListener() {},
    sessionStorage: { getItem: key => key === 'wellbeing-web-three-v1-count_test-external-move-match-move-match-v1:launch:' + payload.token ? JSON.stringify(payload) : null },
  });
  context.window = context; context.parent = context;
  vm.runInContext(read('move-match-v1/classroom/bridge.js'), context);
  assert.equal(context.MMClassroom.valid, true, context.MMClassroom.error);
  return context.MMClassroom.lesson;
}

for (const packaged of [false, true]) {
  const label = packaged ? 'packaged' : 'maintained';
  test(`${label}: backend generation keeps exact candidates separate until adoption`, async () => {
    const requests = [];
    const f = fixture(packaged, { request(path, options) {
      return new Promise(resolve => requests.push({path,options,resolve}));
    } });
    await f.click('new-activity');
    await f.click('fill-example', { value: 'words' });
    await f.prepCount(20);
    await f.click('generate');
    assert.equal(requests[0].path, '/api/ai/generate-classification');
    assert.equal(requests[0].options.method, 'POST');
    assert.equal(requests[0].options.body.questionCount, 20);
    assert.equal(f.nodes['#generation-status'].hidden, false);
    await f.prepCount(10);
    assert.equal(requests[0].options.signal.aborted, true);
    requests[0].resolve({ data: { items: [] } });
    await settle();
    assert.equal(f.nodes['#generation-status'].hidden, true);
    assert.doesNotMatch(f.nodes['#app'].innerHTML, /候选 · 尚未采用/);

    await f.click('generate');
    requests[1].resolve({ data: { items: [] } });
    await settle();
    assert.match(f.nodes['#app'].innerHTML, /返回的题数不符/);
    assert.equal(f.activities()[0].draft.lesson.items.length, 0, 'invalid responses never replace the draft');

    await f.click('generate');
    const data = f.run(`MMGeneration.generate(${JSON.stringify(requests[2].options.body)})`);
    requests[2].resolve({data:{...data.lesson,unmatchedGoals:data.unmatchedGoals}});
    await settle();
    assert.match(f.nodes['#app'].innerHTML, /候选 · 尚未采用/);
    assert.equal(f.activities()[0].draft.lesson.items.length, 0);
    await f.click('adopt-candidate');
    assert.equal(f.activities()[0].draft.lesson.generation.source, 'backend-ai');
    assert.equal(f.activities()[0].draft.lesson.items.length, 10);
  });

  test(`${label}: all case previews load exactly the chosen number of distinct cards`, async () => {
    for (const id of templates) for (const count of quantities) {
      const f = fixture(packaged);
      assert.doesNotMatch(f.nodes['#app'].innerHTML, /data-case-question-count=/);
      await f.caseCount(id, count);
      await f.click('example', { id });
      const payload = f.payload(), lesson = classroom(payload);
      assert.equal(lesson.items.length, count, `${id}: ${count}`);
      assert.equal(new Set(lesson.items.map(item => item.id)).size, count);
      assert.equal(new Set(lesson.items.map(item => item.sentence)).size, count);
      assert.equal(payload.lesson.preparation.questionCount, count);
      assert.match(f.nodes['#stage'].innerHTML, new RegExp(`共 ${count} 张卡片`));
      assert.deepEqual(selectValues(f.nodes['#stage'].innerHTML, 'preview-question-count'), quantities);
      assert.equal(f.data.size, 0, 'previews must not create activities');
      assert.equal(f.run('JSON.stringify(MMCatalog)'), f.originalCatalog);
    }
  });

  test(`${label}: changing a preview replaces the deck and copying retains its selected quantity`, async () => {
    const f = fixture(packaged), id = 'articles-two';
    await f.click('example', { id });
    for (const count of [50, 20]) {
      await f.input({ id: 'preview-question-count', dataset: {}, value: String(count) });
      assert.equal(classroom(f.payload()).items.length, count);
      assert.equal(f.sessions.size, 1, 'old temporary decks must be removed');
    }
    await f.click('create-from-preview', { id });
    const [activity] = f.activities();
    assert.equal(activity.draft.lesson.items.length, 20);
    assert.equal(activity.draft.lesson.preparation.questionCount, 20);
    assert.equal(activity.releases.length, 0);
    assert.deepEqual(selectValues(f.nodes['#app'].innerHTML, 'prep-question-count'), quantities);
    await f.click('home');
    assert.match(f.nodes['#app'].innerHTML, /data-case-count="articles-two">20</);
  });

  test(`${label}: creation from a case and new word activities preserve every chosen quantity through preview`, async () => {
    const copy = fixture(packaged);
    await copy.caseCount('be-three', 30);
    await copy.click('create', { id: 'be-three' });
    assert.equal(copy.activities()[0].draft.lesson.items.length, 30);
    assert.equal(copy.activities()[0].draft.lesson.preparation.questionCount, 30);
    for (const count of quantities) {
      const f = fixture(packaged);
      await f.click('new-activity');
      assert.deepEqual(selectValues(f.nodes['#app'].innerHTML, 'prep-question-count'), quantities);
      await f.prepCount(count);
      await f.click('fill-example', { value: 'words' });
      await f.click('generate');
      assert.equal((f.nodes['#app'].innerHTML.match(/class="question-card"/g) || []).length, count);
      await f.click('adopt-candidate');
      await f.click('preview');
      assert.equal(classroom(f.payload()).items.length, count);
      assert.equal(f.activities()[0].draft.lesson.preparation.questionCount, count);
    }
  });

  test(`${label}: unsupported quantities cannot be entered; old cases remain readable`, async () => {
    const f = fixture(packaged);
    await f.click('new-activity');
    await f.prepCount(20);
    for (const invalid of ['', '12', '21', '-10', '51', 'hello']) await f.prepCount(invalid);
    await f.click('fill-example', { value: 'words' });
    await f.click('generate');
    await f.click('adopt-candidate');
    assert.equal(f.activities()[0].draft.lesson.preparation.questionCount, 20);
    const oldId = f.run('new MMModel.Repository(localStorage).create(MMCatalog[0]).id');
    await f.click('edit', { id: oldId });
    assert.match(f.nodes['#app'].innerHTML, /请选择（原 12 题）/);
    assert.equal(f.activities().find(a => a.id === oldId).draft.lesson.items.length, 12);
  });
  test(`${label}: optional AI images are generated from questions and saved with the draft`, async () => {
    const f=fixture(packaged), requests=[];
    f.context.AbortSignal=AbortSignal;
    f.context.fetch=async (url, options)=>{
      requests.push(JSON.parse(options.body));
      return {ok:true,json:async()=>({success:true,url:'https://images.example.test/card.png'})};
    };
    await f.click('new-activity');
    assert.equal(f.activities()[0].draft.lesson.showImages,false);
    await f.input({id:'show-question-images',dataset:{},value:'yes'});
    await f.click('fill-example',{value:'words'});
    await f.click('generate');
    for(let i=0;i<60;i++)await settle();
    assert.equal(requests.length,10);
    assert.match(requests[0].prompt,/儿童英语教学卡片/);
    await f.click('adopt-candidate');
    const lesson=f.activities()[0].draft.lesson;
    assert.equal(lesson.showImages,true);
    assert.ok(lesson.items.every(item=>item.imageOrigin==='ai'&&item.imageUrl));
    const id=lesson.items[0].id;
    await f.click('edit-item',{id});
    await f.input({dataset:{imagePrompt:id},value:'一只红色小鸟，白色背景'});
    await f.click('generate-image',{id});for(let i=0;i<10;i++)await settle();
    assert.equal(requests.at(-1).prompt,'一只红色小鸟，白色背景');
    f.context.createImageBitmap=async()=>({width:1200,height:600,close(){}});
    f.context.document.createElement=()=>({getContext:()=>({drawImage(){}}),toDataURL:()=> 'data:image/png;base64,dXBsb2Fk'});
    await f.change({dataset:{imageUpload:id},files:[{type:'image/png',size:1000,name:'bird.png'}]});
    await f.click('save-question');
    await f.click('preview');
    const preview=classroom(f.payload());
    assert.ok(preview.items.every(item=>item.imageUrl));
    assert.equal(preview.items[0].imageUrl,'data:image/png;base64,dXBsb2Fk');
  });

  test(`${label}: no-image activities strip artwork and AI failures preserve questions`, async () => {
    const f=fixture(packaged);
    await f.click('new-activity');await f.click('fill-example',{value:'words'});
    await f.click('generate');await f.click('adopt-candidate');await f.click('preview');
    assert.ok(classroom(f.payload()).items.every(item=>!item.imageUrl&&!item.art));
    const g=fixture(packaged);g.context.AbortSignal=AbortSignal;
    g.context.fetch=async()=>({ok:false,json:async()=>({error:'AI 服务暂未连接'})});
    await g.click('new-activity');await g.input({id:'show-question-images',dataset:{},value:'yes'});
    await g.click('fill-example',{value:'words'});await g.click('generate');
    for(let i=0;i<10;i++)await settle();
    assert.match(g.nodes['#app'].innerHTML,/AI 服务暂未连接/);
    await g.click('adopt-candidate');
    assert.equal(g.activities()[0].draft.lesson.items.length,10);
  });


  test(`${label}: editing and adding are isolated until save, and cancel never writes`, async () => {
    for(const adopted of [false,true]){
      const f=fixture(packaged);await f.click('new-activity');await f.click('fill-example',{value:'words'});await f.click('generate');
      if(adopted)await f.click('adopt-candidate');
      const originalHtml=f.nodes['#app'].innerHTML;
      const id=originalHtml.match(/data-item-id="([^"]+)"/)[1];
      const original=JSON.stringify(f.activities());
      await f.click('edit-item',{id});
      assert.equal(f.nodes['#modal'].open,true);
      assert.match(f.nodes['#modal'].innerHTML,/保存修改/);
      await f.input({dataset:{field:'word'},value:'changed word',closest:()=>({dataset:{itemId:id}})});
      await f.input({dataset:{imagePrompt:id},value:'changed image prompt'});
      f.tickSave();
      assert.equal(JSON.stringify(f.activities()),original,'typing must not autosave');
      assert.equal(f.nodes['#app'].innerHTML,originalHtml,'committed card stays unchanged');
      await f.click('cancel-item');
      assert.equal(f.nodes['#modal'].open,false);
      assert.equal(JSON.stringify(f.activities()),original);
      await f.click('add-item');
      const added=f.nodes['#modal'].innerHTML.match(/data-item-id="([^"]+)"/)[1];
      assert.match(f.nodes['#modal'].innerHTML,/保存并添加/);
      assert.equal([...f.nodes['#app'].innerHTML.matchAll(/data-item-id=/g)].length,10);
      await f.input({dataset:{field:'word'},value:'temporary',closest:()=>({dataset:{itemId:added}})});
      f.tickSave();await f.click('cancel-item');
      if(!adopted)await f.click('adopt-candidate');
      assert.equal(f.activities()[0].draft.lesson.items.length,10);
      assert.ok(!f.activities()[0].draft.lesson.items.some(item=>item.word==='temporary'));
    }
  });

  test(`${label}: saving validates fields, commits once, and retains explicit category`, async () => {
    const f=fixture(packaged);await f.click('new-activity');await f.click('fill-example',{value:'words'});await f.click('generate');await f.click('adopt-candidate');
    await f.click('add-item');const id=f.nodes['#modal'].innerHTML.match(/data-item-id="([^"]+)"/)[1];
    await f.click('save-question');assert.equal(f.nodes['#modal'].open,true);
    assert.match(f.nodes['#modal'].innerHTML,/请填写分类题词/);
    assert.equal(f.activities()[0].draft.lesson.items.length,10);
    await f.input({dataset:{field:'word'},value:'owl',closest:()=>({dataset:{itemId:id}})});
    await f.click('save-question');assert.equal(f.nodes['#modal'].open,false);
    const lesson=f.activities()[0].draft.lesson;assert.equal(lesson.items.length,11);
    assert.equal(lesson.items.at(-1).word,'owl');
    await f.click('save-question');assert.equal(f.activities()[0].draft.lesson.items.length,11);
    await f.click('edit-item',{id});
    await f.input({dataset:{field:'word'},value:'rabbit',closest:()=>({dataset:{itemId:id}})});
    await f.click('close-modal');assert.match(f.nodes['#modal'].innerHTML,/尚未保存/);
    assert.equal(f.activities()[0].draft.lesson.items.at(-1).word,'owl');
    await f.click('continue-question');await f.click('save-question');
    assert.equal(f.activities()[0].draft.lesson.items.at(-1).word,'rabbit');
    await f.click('preview');assert.equal(classroom(f.payload()).items.length,11);
  });

  test(`${label}: quota failures keep editor input and original saved question`, async () => {
    const f=fixture(packaged);await f.click('new-activity');await f.click('fill-example',{value:'words'});await f.click('generate');await f.click('adopt-candidate');
    const original=f.activities()[0].draft.lesson.items[0],id=original.id;
    await f.click('edit-item',{id});await f.input({dataset:{field:'word'},value:'owl',closest:()=>({dataset:{itemId:id}})});
    const write=f.context.localStorage.setItem;f.context.localStorage.setItem=()=>{throw Error('quota');};
    await f.click('save-question');assert.equal(f.nodes['#modal'].open,true);assert.match(f.nodes['#modal'].innerHTML,/value="owl"/);
    assert.deepEqual(f.activities()[0].draft.lesson.items[0],original);
    f.context.localStorage.setItem=write;await f.click('save-question');assert.equal(f.nodes['#modal'].open,false);
    assert.equal(f.activities()[0].draft.lesson.items[0].word,'owl');
  });

  test(`${label}: a pending image cannot save and a cancelled image result cannot change the draft`, async () => {
    const f=fixture(packaged);await f.click('create',{id:'articles-two'});
    const original=JSON.stringify(f.activities()[0].draft.lesson),id=f.activities()[0].draft.lesson.items[0].id;
    let resolve;f.context.AbortSignal=AbortSignal;f.context.fetch=()=>new Promise(r=>{resolve=r;});
    await f.click('edit-item',{id});await f.click('generate-image',{id});
    await f.click('save-question');assert.equal(f.nodes['#modal'].open,true);
    await f.click('cancel-item');resolve({ok:true,json:async()=>({success:true,url:'https://images.example.test/late.png'})});
    for(let i=0;i<20;i++)await settle();f.tickSave();
    assert.equal(JSON.stringify(f.activities()[0].draft.lesson),original);
    assert.equal(f.nodes['#modal'].open,false);
  });

  test(`${label}: sentence validation and copy preserve the source until explicitly saved`, async () => {
    const f=fixture(packaged);await f.click('create',{id:'articles-two'});
    const original=f.activities()[0].draft.lesson.items[0];
    await f.click('copy-item',{id:original.id});
    const id=f.nodes['#modal'].innerHTML.match(/data-item-id="([^"]+)"/)[1];
    const field=async(key,value)=>f.input({dataset:{field:key},value,closest:()=>({dataset:{itemId:id}})});
    await field('sentence','No blank');await f.click('save-question');assert.equal(f.nodes['#modal'].open,true);
    assert.match(f.nodes['#modal'].innerHTML,/填空/);
    await field('sentence','I see ___ owl.');
    const category=f.activities()[0].draft.lesson.categories.find(c=>c.label==='an');
    await field('categoryId',category.id);
    await f.click('save-question');
    const lesson=f.activities()[0].draft.lesson;
    assert.equal(lesson.items.length,11);assert.deepEqual(lesson.items[0],original);
    assert.equal(lesson.items.at(-1).answerText,'an');
    await f.click('preview');assert.equal(classroom(f.payload()).items.at(-1).sentence,'I see ___ owl.');
  });

  test(`${label}: saving a candidate edit stays separate until adoption`, async () => {
    const f=fixture(packaged);await f.click('new-activity');await f.click('fill-example',{value:'words'});await f.click('generate');
    const id=f.nodes['#app'].innerHTML.match(/data-item-id="([^"]+)"/)[1];
    await f.click('edit-item',{id});await f.input({dataset:{field:'word'},value:'owl',closest:()=>({dataset:{itemId:id}})});
    await f.click('save-question');assert.equal(f.nodes['#modal'].open,false);
    assert.equal(f.activities()[0].draft.lesson.items.length,0);
    await f.click('adopt-candidate');assert.equal(f.activities()[0].draft.lesson.items[0].word,'owl');
  });

  test(`${label}: a text default supports one illustrated card and new cards inherit the current default`, async () => {
    const f=fixture(packaged);await f.click('new-activity');
    assert.match(f.nodes['#app'].innerHTML,/默认题卡样式/);
    await f.click('fill-example',{value:'words'});await f.click('generate');await f.click('adopt-candidate');
    const id=f.activities()[0].draft.lesson.items[0].id;
    f.context.AbortSignal=AbortSignal;f.context.fetch=async()=>({ok:true,json:async()=>({success:true,url:'https://images.example.test/single.png'})});
    await f.click('edit-item',{id});assert.match(f.nodes['#modal'].innerHTML,/添加图片/);
    await f.click('add-image');assert.match(f.nodes['#modal'].innerHTML,/移除图片/);
    await f.click('generate-image',{id});for(let i=0;i<10;i++)await settle();
    await f.click('save-question');
    const saved=f.activities()[0].draft.lesson;
    assert.equal(saved.showImages,false);assert.equal(saved.items[0].imageEnabled,true);
    assert.ok(saved.items.slice(1).every(item=>item.imageEnabled===false));
    await f.click('step',{value:'1'});await f.input({id:'show-question-images',dataset:{},value:'yes'});f.tickSave();
    assert.deepEqual(f.activities()[0].draft.lesson.items,saved.items,'default changes must not change existing cards');
    await f.click('step',{value:'2'});await f.click('add-item');assert.match(f.nodes['#modal'].innerHTML,/移除图片/);
    await f.click('remove-image');assert.match(f.nodes['#modal'].innerHTML,/添加图片/);
    const added=f.nodes['#modal'].innerHTML.match(/data-item-id="([^"]+)"/)[1];
    await f.input({dataset:{field:'word'},value:'owl',closest:()=>({dataset:{itemId:added}})});
    await f.click('save-question');await f.click('preview');
    const lesson=classroom(f.payload());
    assert.equal(lesson.items[0].imageUrl,'https://images.example.test/single.png');
    assert.ok(lesson.items.slice(1).every(item=>!item.imageUrl&&!item.art&&!item.relation));
  });

  test(`${label}: removing one picture respects cancel and preserves the rest in classroom`, async () => {
    const f=fixture(packaged);f.context.AbortSignal=AbortSignal;
    f.context.fetch=async()=>({ok:true,json:async()=>({success:true,url:'https://images.example.test/picture.png'})});
    await f.click('new-activity');await f.input({id:'show-question-images',dataset:{},value:'yes'});
    await f.click('fill-example',{value:'words'});await f.click('generate');for(let i=0;i<60;i++)await settle();await f.click('adopt-candidate');
    const original=f.activities()[0].draft.lesson.items[0],id=original.id;
    await f.click('edit-item',{id});await f.click('remove-image');await f.click('cancel-item');
    assert.deepEqual(f.activities()[0].draft.lesson.items[0],original);
    await f.click('edit-item',{id});await f.click('remove-image');await f.click('save-question');
    const saved=f.activities()[0].draft.lesson;assert.equal(saved.showImages,true);assert.equal(saved.items[0].imageEnabled,false);
    await f.click('preview');const lesson=classroom(f.payload());
    assert.ok(!lesson.items[0].imageUrl&&!lesson.items[0].art);
    assert.ok(lesson.items.slice(1).every(item=>item.imageUrl==='https://images.example.test/picture.png'));
  });

  test(`${label}: readding images to legacy pending or review cards shows an empty placeholder`, async () => {
    for(const status of ['pending','review']){
      const f=fixture(packaged);await f.click('create',{id:'articles-two'});
      const activityId=f.activities()[0].id;
      f.run(`(()=>{
        const repo=new MMModel.Repository(localStorage),activity=repo.get(${JSON.stringify(activityId)});
        const item=activity.draft.lesson.items[0],baseline=MMModel.clone(item);
        if(!MMQuestionArt.source(baseline))throw new Error('Legacy fixture must retain a baseline image');
        item.sentence='Look at ___ orange.';
        item.contentSync={status:${JSON.stringify(status)},baseline};
        repo.saveDraft(activity.id,activity.draft,activity.editor,activity.revision);
      })()`);
      await f.click('edit',{id:activityId});
      const original=f.activities()[0].draft,id=original.lesson.items[0].id;
      await f.click('edit-item',{id});await f.click('remove-image');
      assert.doesNotMatch(f.nodes['#modal'].innerHTML,/picture-placeholder|picture-pending/);
      await f.click('add-image');
      assert.match(f.nodes['#modal'].innerHTML,/class="question-picture picture-placeholder"/);
      assert.doesNotMatch(f.nodes['#modal'].innerHTML,/picture-pending/);
      await f.click('cancel-item');
      assert.deepEqual(f.activities()[0].draft,original,'cancel must retain the original image and pending metadata');

      await f.click('edit-item',{id});await f.click('remove-image');await f.click('add-image');await f.click('save-question');
      assert.equal(f.nodes['#modal'].open,false);
      const saved=f.activities()[0].draft.lesson.items[0];
      assert.equal(saved.imageEnabled,true);assert.equal(saved.imageUrl,'');assert.equal(saved.art,null);
      await f.click('home');await f.click('edit',{id:activityId});await f.click('edit-item',{id});
      assert.match(f.nodes['#modal'].innerHTML,/class="question-picture picture-placeholder"/);
      assert.doesNotMatch(f.nodes['#modal'].innerHTML,/picture-pending/);
    }
  });

  test(`${label}: changing defaults pins legacy cards and preserves candidate edits`, async () => {
    const f=fixture(packaged);await f.click('create',{id:'articles-two'});
    const before=f.activities()[0].draft.lesson.items;
    assert.ok(before.every(item=>item.imageEnabled===undefined));
    await f.input({id:'show-question-images',dataset:{},value:'no'});f.tickSave();
    const after=f.activities()[0].draft.lesson.items;
    assert.deepEqual(after,before.map(item=>({...item,imageEnabled:true})));
    await f.click('preview');const lesson=classroom(f.payload());
    assert.equal(lesson.items[0].art,before[0].art);
    assert.equal(lesson.items[0].imageUrl,before[0].imageUrl);
    const g=fixture(packaged);await g.click('new-activity');await g.click('fill-example',{value:'words'});await g.click('generate');
    const id=g.nodes['#app'].innerHTML.match(/data-item-id="([^"]+)"/)[1];
    await g.click('edit-item',{id});await g.input({dataset:{field:'word'},value:'owl',closest:()=>({dataset:{itemId:id}})});await g.click('save-question');
    await g.input({id:'show-question-images',dataset:{},value:'yes'});await g.click('adopt-candidate');
    assert.equal(g.activities()[0].draft.lesson.items[0].word,'owl');
    assert.ok(g.activities()[0].draft.lesson.items.every(item=>item.imageEnabled===false));
  });

  test(`${label}: removing an image invalidates late AI and upload results`, async () => {
    const f=fixture(packaged);await f.click('create',{id:'articles-two'});
    const id=f.activities()[0].draft.lesson.items[0].id;
    let resolve;f.context.AbortSignal=AbortSignal;f.context.fetch=()=>new Promise(r=>{resolve=r;});
    await f.click('edit-item',{id});await f.click('generate-image',{id});await f.click('remove-image');
    resolve({ok:true,json:async()=>({success:true,url:'https://images.example.test/late.png'})});for(let i=0;i<10;i++)await settle();
    assert.match(f.nodes['#modal'].innerHTML,/添加图片/);await f.click('save-question');
    assert.equal(f.activities()[0].draft.lesson.items[0].imageUrl,'');
    let decode;f.context.createImageBitmap=()=>new Promise(r=>{decode=r;});
    f.context.document.createElement=()=>({getContext:()=>({drawImage(){}}),toDataURL:()=> 'data:image/png;base64,bGF0ZQ=='});
    await f.click('edit-item',{id});await f.click('add-image');
    await f.change({dataset:{imageUpload:id},files:[{type:'image/png',size:100,name:'late.png'}]});
    await f.click('remove-image');await f.click('add-image');
    decode({width:10,height:10,close(){}});for(let i=0;i<10;i++)await settle();
    await f.click('save-question');assert.equal(f.activities()[0].draft.lesson.items[0].imageUrl,'');
  });

}
