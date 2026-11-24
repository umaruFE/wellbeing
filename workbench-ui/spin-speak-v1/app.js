(()=>{'use strict';
const M=SpeakModel,$=s=>document.querySelector(s),E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='wellbeing-prep-six-modules-v1-speak';let lastStored=null,platformVisible=true;const sessionOwners=new Map();let saved=[],draft=M.initial(),view='home',tab='cases',error='',storageError='',generation=null,session=0,toastTimer;
let cloud, ready=false;
const readOnlyActions = new Set([
  'module', 'platform-return', 'home', 'tab', 'mine', 'resume', 'edit', 'case-preview',
  'step', 'back', 'preview-large', 'review-ready', 'teach', 'teach-current', 'export',
]);
const isReadOnly = () => cloud?.readOnly === true;
const canUseAction = action => !isReadOnly() || readOnlyActions.has(action);

function persist(){
  if (isReadOnly()) return true;
  const current = saved.findIndex(item => item.id === draft.id);
  if (current >= 0) saved[current] = M.clone(draft);
  if (storageError) return false;
  try {
    const value = JSON.stringify({ draft, items: saved });
    if (value !== lastStored) {
      (cloud?.storage || localStorage).setItem(KEY, value);
      lastStored = value;
    }
    return true;
  } catch {
    storageError = '保存失败，当前内容仍在页面中。请导出备份后再重试。';
    const warning = $('#storage-warning');
    if (warning) {
      warning.hidden = false;
      warning.querySelector('.storage-message').textContent = storageError;
    }
    return false;
  }
}
const B=(text,action,style='',attrs='')=>`<button type="button" class="btn wb-button ${style}" data-ui="button" ${style.split(' ').includes('primary')?'data-ui-variant="primary"':''} ${style.split(' ').includes('small')?'data-ui-size="sm"':''} data-action="${action}" ${attrs}>${text}</button>`;
const uiIcon=name=>`<svg class="speak-ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({'back':'<path d="m12 5-7 7 7 7M5 12h14"/>','check':'<path d="m5 12 4 4L19 6"/>','play':'<path d="m8 5 11 7-11 7z"/>','plus':'<path d="M12 5v14M5 12h14"/>','menu':'<path d="M4 6h16M4 12h16M4 18h16"/>'})[name]||''}</svg>`;
function stashDraft(){if(!isReadOnly()&&(draft.input||draft.pack)){const i=saved.findIndex(d=>d.id===draft.id);if(i<0)saved.push(M.clone(draft));else saved[i]=M.clone(draft);}}
const game=()=>M.games.find(g=>g.id===draft.game);
function syncSteps(){document.querySelectorAll('[data-step]').forEach(b=>b.disabled=!canStep(+b.dataset.step));$('#save-status')?.classList.remove('ready');}
function notify(text){$('#toast').textContent=text;$('#toast').classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('on'),2600);}
const posterText={tempo:['SPIN','THE BEAT','节奏唱片铺'],volume:['TURN','IT UP!','声音广播站'],energy:['CHARGE','& SAY','情绪充电花园'],words:['READ.','MOVE!','动作冒险营地'],role:['PICK','A VOICE','声音小剧场'],silly:['MIX IT.','SAY IT.','奇妙组合游乐铺'],flip:['FLIP','& FIND','答案发现博物馆']};
function art(id){return SpeakArt(id);}
function chrome(content){return `<div class="shell">${WBPlatform.navigation('speak')}<div class="workspace"><header class="topbar"><div class="row"><button class="btn library-navigation-toggle" aria-controls="speak-navigation" aria-expanded="false" aria-label="打开模块导航">${uiIcon('menu')}</button><span>创作工坊 / 口语互动</span></div><div class="row">${B('返回上个模块','platform-return','small')}<span class="avatar">教师</span></div></header><div class="notice wb-notice error" role="alert" id="storage-warning" ${storageError?'':'hidden'}><span class="storage-message">${E(storageError)}</span> ${B('导出当前内容','export','small')} ${B('重试保存','retry-save','small')}</div>${content}</div></div>`;}

function home(){
  if (cloud) tab = 'mine';
  const readOnly = isReadOnly();
  const resume = draft.pack || draft.input
    ? `<button type="button" data-ui="button" data-action="resume">${readOnly ? '查看备课' : '继续备课'}</button>`
    : '';
  const caseTab = cloud ? '' : `<button type="button" data-ui="tab" class="${tab === 'cases' ? 'active' : ''}" role="tab" aria-selected="${tab === 'cases'}" data-action="tab" data-tab="cases">案例库 <span>7</span></button>`;
  let activities;
  if (tab === 'cases') {
    const cards = M.games.map(game => `<article class="game-tile" data-theme="${game.id}">
      <div class="game-art">
        <div class="poster-copy"><span>${posterText[game.id][2]}</span><strong>${posterText[game.id][0]}<br>${posterText[game.id][1]}</strong></div>
        <div class="poster-prop">${art(game.id)}</div>
      </div>
      <div class="game-body">
        <h3>${game.name}</h3><div class="en">${game.en}</div><p>${game.description}</p>
        <div class="row game-actions">
          ${B(uiIcon('play') + '<span>预览案例</span>', 'case-preview', 'play-btn', `data-game="${game.id}"`)}
          ${B('制作同款', 'use-case', '', `data-game="${game.id}"`)}
        </div>
      </div>
    </article>`);
    activities = `<section class="game-library" aria-label="口语游戏案例">${cards.join('')}</section>`;
  } else if (saved.length) {
    const cards = saved.map((item, index) => {
      const version = item.published
        ? '授课版 ' + item.history.length + ' · ' + new Date(item.published.createdAt).toLocaleDateString('zh-CN')
        : '草稿';
      const attrs = `data-index="${index}"`;
      return `<article class="saved-item">
        <div class="spacer"><h3>${E(item.title)}</h3><div class="muted">${M.games.find(game => game.id === item.game)?.name} · ${version}</div></div>
        ${B(readOnly ? '查看草稿' : '编辑草稿', 'edit', '', attrs)}
        ${item.published ? B('开始授课', 'teach', 'primary', attrs) : ''}
      </article>`;
    });
    activities = `<section class="saved-list">${cards.join('')}</section>`;
  } else {
    activities = readOnly
      ? '<div class="empty"><h2>暂无口语活动</h2></div>'
      : `<div class="empty"><h2>还没有确认的授课活动</h2><p>完成试玩并确认授课版后，活动会出现在这里。</p>${B('新建口语活动', 'new', 'primary')}</div>`;
  }
  return `<main class="library-home library-main speak-library">
    <header class="lh-header">
      <div><h1>口语翻翻乐</h1></div>
      <div class="lh-header-actions">${resume}<button type="button" data-ui="button" data-ui-variant="primary" data-action="new">${uiIcon('plus')}<span>新建口语活动</span></button></div>
    </header>
    <div class="lh-library-head"><div class="lh-tabs" role="tablist" aria-label="活动来源">
      ${caseTab}
      <button type="button" data-ui="tab" class="${tab === 'mine' ? 'active' : ''}" role="tab" aria-selected="${tab === 'mine'}" data-action="tab" data-tab="mine">我制作的 <span>${saved.length}</span></button>
    </div></div>
    ${activities}
  </main>`;
}
const labels=['输入目标语言','确认操练语言','选择活动类型','预览游戏界面','确认授课版'];
function canStep(n){return n===1||(!generation&&((n===2&&draft.pack)||(n===3&&draft.confirmed)||(n===4&&draft.preview)||(n===5&&draft.preview&&draft.reviewed&&!draft.previewDirty)));}
function statusText(){if(storageError)return '保存未完成';if(isReadOnly())return '';if(cloud?.status==='pending')return '正在同步后台…';if(cloud?.dirty)return '待同步后台';if(draft.finalized)return '授课版 '+draft.history.length+' 已保存';if(draft.confirmed)return '操练语言已确认';return cloud&&lastStored?'草稿已同步后台':'草稿自动保存';}
function updateStatus(){const label=$('#save-status');if(label){label.textContent=statusText();label.hidden=!label.textContent;}}
function editor(){
 const n=draft.step;
 const saveLabel=statusText();
 return `<main class="main wb-authoring speak-authoring"><div class="wb-authoring-heading">${B(uiIcon('back')+'<span>返回活动</span>','home','quiet speak-back')}<header class="wb-authoring-header"><input class="title-input wb-authoring-title" aria-label="活动名称" id="activity-title" value="${E(draft.title)}"><div class="wb-authoring-status"><span class="status wb-status ${storageError?'is-error':draft.confirmed?'ready':''}" id="save-status" role="status" ${saveLabel ? '' : 'hidden'}>${saveLabel}</span>${draft.published&&!draft.finalized?`<span>授课版 ${draft.history.length} 已保留</span>`:''}</div></header></div><nav class="wb-authoring-steps" aria-label="备课步骤">${labels.map((l,i)=>`<button type="button" class="wb-authoring-step ${n===i+1?'active':i+1<n?'complete':''}" data-action="step" data-step="${i+1}" ${canStep(i+1)?'':'disabled'} ${n===i+1?'aria-current="step"':''}><span class="wb-step-number" aria-hidden="true">${i+1<n?uiIcon('check'):i+1}</span><span class="wb-step-label">${l}</span></button>`).join('')}</nav><div class="editor wb-authoring-body ${n===3||n===4?'wide':''}">${error?`<div class="notice wb-notice error" role="alert">${E(error)}</div>`:''}${[null,inputStep,languageStep,activityStep,previewStep,doneStep][n]()}</div></main>${footer()}`;
}
function inputStep(){return `<section class="work-panel wb-authoring-panel"><div class="intro wb-panel-heading"><h2>这节课，想让学生说什么？</h2><p>贴入英文课文、句子或对话，生成后可以逐条修改。</p></div><label class="wb-field" for="source"><span>目标语言</span><textarea class="source-input" id="source" ${generation?'disabled':''} placeholder="例如：We play football together every weekend.">${E(draft.input)}</textarea></label><div class="preset-row"><span class="muted">试试这些内容</span>${Object.entries(M.samples).map(([k,s])=>B(s.title,'preset','small',`data-preset="${k}" ${generation?'disabled':''}`)).join('')}</div>${generation?'<div class="notice wb-notice" role="status">正在通过后台生成操练语言…</div>':''}</section>`;}
function languageStep(){const p=draft.pack;return `<section class="work-panel wb-authoring-panel"><div class="intro wb-panel-heading"><h2>确认本课要用的操练语言</h2><p>勾选要练的句子和问答，直接改写文字。确认后选择玩法。</p></div><h3 class="section-label">句子</h3>${['main','full'].map((k,i)=>`<div class="language-row ${p.sel[k]?'':'off'}"><input type="checkbox" data-select="${k}" aria-label="使用${i?'完整表达':'核心句'}" ${p.sel[k]?'checked':''}><label class="wb-field"><span>${i?'完整表达':'核心句'}</span><textarea rows="2" data-field="${k}" aria-label="${i?'完整表达':'核心句'}">${E(p.sentences[k])}</textarea></label></div>`).join('')}<h3 class="section-label">问答</h3>${p.dialog.map((d,i)=>`<div class="language-row ${p.sel.d[i]?'':'off'}"><input type="checkbox" data-select="d${i}" aria-label="使用第 ${i+1} 组问答" ${p.sel.d[i]?'checked':''}><div class="qa-fields wb-form-grid"><label class="wb-field"><span>问题 ${i+1}</span><textarea rows="2" data-field="q" data-index="${i}" aria-label="问题 ${i+1}">${E(d.q)}</textarea></label><label class="wb-field"><span>回答 ${i+1}</span><textarea rows="2" data-field="a" data-index="${i}" aria-label="回答 ${i+1}">${E(d.a)}</textarea></label></div></div>`).join('')}<div class="status wb-status warning language-status" id="language-status" role="status">${draft.confirmed?'已确认；修改后需要重新确认。':'请确认语言准确、难度适合本班。'}</div></section>`;}
function activityStep(){return `<section class="work-panel wb-authoring-panel speak-activity-panel"><div class="intro wb-panel-heading"><h2>选一种开口的方式</h2><p>每次制作一个活动。玩法不同，使用同一份已确认的操练语言。</p></div><div class="choose-grid" role="radiogroup" aria-label="活动类型">${M.games.map(g=>`<button type="button" class="choice ${draft.game===g.id?'active':''}" role="radio" aria-checked="${draft.game===g.id}" data-action="choose" data-game="${g.id}"><span class="thumb" data-theme="${g.id}">${art(g.id)}</span><span class="choice-copy"><strong>${g.name}</strong><small>${g.description}</small><span class="requirement">${g.need}</span></span><span class="radio" aria-hidden="true"></span></button>`).join('')}</div>${M.need(draft.game,M.activePack(draft.pack))?'':`<p class="notice wb-notice warning" role="status">这个活动用到的内容还不够：多勾选几条操练语言，或换个活动试试。</p>`}</section>`;}
function releaseSession(owner){const key=sessionOwners.get(owner);if(key){try{sessionStorage.removeItem(key);}catch(e){}sessionOwners.delete(owner);}}
function sessionURL(id,content,owner){releaseSession(owner);const token='s'+Date.now()+'-'+(++session);try{const key='wellbeing-six-modules-v1-speak-session:'+token;sessionStorage.setItem(key,JSON.stringify(content));sessionOwners.set(owner,key);}catch(e){throw Error('无法创建试玩快照，请检查浏览器存储后重试。');}return 'games/'+(id==='volume'?'volume-v3':id)+'.html?session='+token+(id==='tempo'?'&v=152':id==='volume'?'&v=23':id==='energy-v3'?'&v=16':'');}
function derivedFields(){const c=draft.preview;let fields=[];if(draft.game==='energy'){fields=[['问句','question',c.question],...c.answers.map((a,i)=>[a.label,'answer-'+i,a.text])];}else if(draft.game==='flip'){fields=c.qa.flatMap((q,i)=>[['提示 '+(i+1),'hint-'+i,q.hint]]).concat([['揭晓句','reveal',c.reveal]]);}else if(draft.game==='words'){fields=c.acts.filter(a=>!a.own).map((a,i)=>['候选词 '+(i+1),'act-'+i,a.text]);}else if(draft.game==='silly'){fields=c.poolA.map((a,i)=>['动作 '+(i+1),'poolA-'+i,a.text]);}else return '';return `<div class="content-review wb-authoring-panel"><details ${draft.game==='energy'?'open':''}><summary>${draft.game==='energy'?'核对 6 档情绪答句':'调整游戏内容'}</summary><div class="wb-form-stack speak-derived-fields">${fields.map(([l,k,v])=>`<label class="derived-field wb-field"><span>${E(l)}</span><input class="text-input" data-derived="${k}" value="${E(draft.previewEdits?.[k]??v)}"></label>`).join('')}</div><div class="row speak-derived-actions">${B('应用修改并重新预览','apply-preview')}<span class="status wb-status" id="derived-status">${draft.previewDirty?'修改待应用':''}</span></div></details></div>`;}
function previewStep(){let url='';try{url=sessionURL(draft.game,draft.preview,'inline');}catch(e){error=e.message;}return `<section class="speak-preview-step"><div class="intro wb-panel-heading"><h2>试玩一下，再带进课堂</h2><p>${game().name} · ${game().en}</p></div><div class="preview-layout"><div class="preview-column"><div class="preview-stage"><iframe src="${E(url)}" id="inline-game" title="${game().name}预览" allow="microphone"></iframe></div><div class="preview-toolbar"><span class="muted">预览中的操作不会写入授课版</span>${B('放大试玩','preview-large')}</div>${derivedFields()}</div><aside class="review-panel wb-authoring-panel"><div class="wb-panel-heading"><h2>授课前核对</h2></div><ul class="speak-review-points"><li>目标语言是否正确？</li><li>抽取、翻牌和完成是否符合预期？</li><li>${draft.game==='energy'?'逐条确认情绪答句与问题匹配。':'让学生要说的内容保持清晰。'}</li></ul><label class="review-check"><input type="checkbox" id="reviewed" ${draft.reviewed?'checked':''} ${draft.previewDirty?'disabled':''}><span>我已核对内容，可以用于本课</span></label>${draft.published?'<div class="notice wb-notice">之前的授课版仍保留，确认后会新增一个版本。</div>':''}</aside></div></section>`;}
function finalContent(){const c=draft.preview;switch(draft.game){case 'tempo':return c.lines;case 'volume':case 'role':return [c.line];case 'words':return [c.words.join(' '),'候选：'+c.acts.map(a=>a.text).join(' · ')];case 'energy':return [c.question,...c.answers.map(a=>a.label+' · '+a.text)];case 'silly':return [c.question,'We like ___ with ___.','动作池：'+c.poolA.map(a=>a.text).join(' · ')];default:return [...c.qa.map(q=>q.q+' → '+q.a),c.reveal];}}
function doneStep(){if(!draft.finalized)return `<section class="work-panel final-review wb-authoring-panel"><div class="intro wb-panel-heading"><h2>确认本次授课内容</h2><p>保存后生成一个独立版本，课堂从新的一轮开始。</p></div><div class="notice wb-notice success">${E(game().name)} · 已完成内容核对</div><h3>${E(draft.title)}</h3><div class="speak-final-content">${finalContent().map(line=>`<p class="final-line">${E(M.plain(line))}</p>`).join('')}</div><p class="muted speak-version-note">下一版本：${draft.history.length+1}${draft.published?' · 之前的授课版继续保留':''}</p></section>`;return `<section class="done-panel wb-authoring-panel"><div class="speak-complete-heading"><span class="done-symbol">${uiIcon('check')}</span><div class="wb-panel-heading"><h2>授课版已准备好</h2><p>${E(draft.title)} · ${game().name}</p></div></div><p class="muted speak-version-note">授课版 ${draft.history.length}，保存于 ${new Date(draft.published.createdAt).toLocaleString('zh-CN',{hour12:false})}</p></section>`;}
function footer(){const n=draft.step;let prev=n>1?B('上一步','back'):'';let main='';if(n===1)main=generation?B('取消生成','cancel'):B('生成操练语言','generate','primary');if(n===2)main=B('确认，去选择活动','confirm','primary');if(n===3)main=B('生成预览界面','generate-preview','primary',M.need(draft.game,M.activePack(draft.pack))?'':'disabled');if(n===4)main=B('下一步，确认授课版','review-ready','primary',draft.reviewed?'':'disabled');if(n===5){prev=draft.finalized?B('返回我制作的','mine')+B('继续修改草稿','modify'):B('返回试玩','back');main=draft.finalized?B('开始授课','teach-current','primary'):B('确认并保存授课版','publish','primary');}return `<footer class="footer wb-authoring-footer"><div class="wb-footer-meta"><span class="hint">${n===1?'支持直接输入或从案例开始':n===2?'任何文字或勾选变动，都需要重新确认':n===3?'当前选择：'+game().name:n===4?'确认后保存为独立的授课版':draft.finalized?'授课版 '+draft.history.length+' 已保存':'保存后生成独立授课版，之前的版本继续保留'}</span></div><div class="wb-footer-actions">${prev}${main}</div></footer>`;}
function applyReadOnlyControls(app){
  for (const button of app.querySelectorAll('button[data-action]')) {
    if (canUseAction(button.dataset.action)) continue;
    button.disabled = true;
  }
  for (const field of app.querySelectorAll('.speak-authoring input, .speak-authoring textarea, .speak-authoring select')) {
    if (field.matches('input:not([type]), input[type="text"], textarea')) field.readOnly = true;
    else field.disabled = true;
  }
}

function render(){
  releaseSession('inline');
  document.querySelectorAll('iframe').forEach(frame => { if (frame.id === 'inline-game') frame.src = 'about:blank'; });
  const app = $('#app');
  app.innerHTML = chrome(view === 'home' ? home() : editor());
  if (isReadOnly()) applyReadOnlyControls(app);
  bindGameFrames();
}
function cancelGeneration(){
 const current=generation;
 generation=null;
 current?.abort();
}
function move(n){error='';draft.step=n;persist();render();window.scrollTo({top:0});}
function openPlayer(id,content,title,teaching=false){try{$('#player-title').textContent=(teaching?'授课版 · ':'试玩 · ')+title;$('#player-close').textContent=teaching?'结束授课':'退出试玩';$('#player-frame').src=sessionURL(id,M.clone(content),'player');$('#player').showModal();forwardVisibility();}catch(e){notify(e.message);}}
function closePlayer(){$('#player-frame').src='about:blank';releaseSession('player');$('#player').close();forwardVisibility();}
$('#player-close').onclick=closePlayer;$('#player').addEventListener('cancel',e=>{e.preventDefault();closePlayer();});
$('#app').addEventListener('input',e=>{
 if(isReadOnly())return;
 const t=e.target;
 if(t.id==='activity-title'){draft.title=t.value;persist();return;}
 if(t.id==='source'){draft.input=t.value;draft.pack=null;M.invalidate(draft);draft.step=1;syncSteps();persist();return;}
 if(t.dataset.field){const k=t.dataset.field;if(['q','a'].includes(k))draft.pack.dialog[+t.dataset.index][k]=t.value;else draft.pack.sentences[k]=t.value;M.invalidate(draft);$('#language-status').textContent='已修改，待确认。';$('#save-status').textContent='已修改，待确认';syncSteps();persist();}
 if(t.dataset.derived){draft.previewEdits=draft.previewEdits||{};draft.previewEdits[t.dataset.derived]=t.value;draft.previewDirty=true;draft.reviewed=false;$('#reviewed').checked=false;$('#reviewed').disabled=true;document.querySelector('[data-action=review-ready]').disabled=true;$('#derived-status').textContent='修改待应用';persist();}
});
$('#app').addEventListener('change',e=>{
 if(isReadOnly())return;
 const t=e.target;if(t.id==='reviewed'){if(draft.previewDirty){t.checked=false;return;}draft.reviewed=t.checked;document.querySelector('[data-action=review-ready]').disabled=!draft.reviewed;persist();}
 if(t.dataset.select){const k=t.dataset.select,p=draft.pack;if(!t.checked&&M.count(p)<=1){t.checked=true;notify('至少要勾选一条，游戏才有内容可说');return;}if(k.startsWith('d'))p.sel.d[+k.slice(1)]=t.checked;else p.sel[k]=t.checked;M.invalidate(draft);persist();render();}
});
$('#app').addEventListener('click',async e=>{
 const b=e.target.closest('[data-action]');if(!b)return;e.preventDefault();const a=b.dataset.action;
 if(!canUseAction(a))return;
 error='';
 if(a==='module'){navigate(b.dataset.module);return;}
 if(a==='platform-return'){if(window.parent!==window)window.parent.postMessage({type:'wellbeing:return'},location.origin);else navigate('music');return;}
 if(a==='home'){cancelGeneration();view='home';persist();render();return;}
 if(a==='tab'){tab=b.dataset.tab;render();return;}
 if(a==='mine'){tab='mine';view='home';render();return;}
 if(a==='new'){stashDraft();draft=M.initial();view='edit';persist();render();return;}
 if(a==='resume'){view='edit';render();return;}
 if(a==='preset'){draft.input=M.samples[b.dataset.preset].input;draft.pack=null;M.invalidate(draft);draft.step=1;persist();render();return;}
 if(a==='use-case'){stashDraft();draft=M.initial();draft.game=b.dataset.game;draft.input=M.samples.family.input;draft.pack=M.buildLanguage(draft.input);draft.title='My Family · '+M.games.find(g=>g.id===draft.game).name;draft.step=2;view='edit';persist();render();return;}
 if(a==='case-preview'){
  const id=b.dataset.game,p=M.activePack(M.buildLanguage(M.samples.family.input));
  // The Energy case keeps the reviewed dinner dialogue; preparation generation stays independent.
  const c=id==='energy'?{question:'Do you want to join our family dinner?',answers:[
   {label:'SUPER!',text:"Yes! I'd love to!"},{label:'HAPPY',text:'Yes! That sounds so fun!'},
   {label:'READY',text:"OK! I can't wait!"},{label:'SO-SO',text:'Maybe next time.'},
   {label:'TIRED',text:"No, thanks. I'm tired."},{label:'EMPTY',text:"Sorry, I can't come today."}
  ]}:M.generate(id,p);
  if(id==='volume')c.line=p.lines[0];
  openPlayer(id==='energy'?'energy-v3':id,c,M.games.find(g=>g.id===id).name);return;
 }
 if(a==='step'){const n=+b.dataset.step;if(canStep(n))move(n);return;}
 if(a==='back'){move(draft.step-1);return;}
 if(a==='cancel'){cancelGeneration();render();$('#source').focus();return;}
 if(a==='generate'){
  const input=draft.input.trim();
  if(!input){error='先输入本课要练的目标语言。';render();$('#source').focus();return;}
  const request=new AbortController();
  generation=request;
  render();
  try{
   const api=window.WBWorkbenchApi;
   if(!api)throw Error('请在已连接后台的平台内生成操练语言。');
   const {data:pack}=await api.request('/api/ai/generate-speaking-language',{
    method:'POST',body:{input},signal:request.signal
   });
   if(generation!==request)return;
   if(!pack?.unit||!pack.sentences||!Array.isArray(pack.dialog)||!Array.isArray(pack.pools?.acts)||!pack.sel){
    throw Error('后台返回的操练语言不完整，请重试。');
   }
   generation=null;
   draft.pack=pack;
   M.invalidate(draft);
   if(draft.title==='未命名口语活动')draft.title=pack.unit+' · 口语练习';
   move(2);
  }catch(e){
   if(generation!==request)return;
   generation=null;
   error=e.message||'未能生成操练语言，请稍后重试。';
   render();
  }
  return;
 }
 if(a==='confirm'){
  const p=M.activePack(draft.pack);if(!p.lines.length&&!p.dialog.length){error='至少保留一条操练语言。';render();return;}
  if(p.dialog.some(d=>!d.q.trim()||!d.a.trim())||['main','full'].some(k=>draft.pack.sel[k]&&!M.plain(draft.pack.sentences[k]))){error='勾选的句子或问答不能为空，请补充后确认。';render();return;}
  draft.confirmed=true;move(3);return;
 }
 if(a==='choose'){draft.game=b.dataset.game;draft.preview=null;draft.reviewed=false;persist();render();return;}
 if(a==='generate-preview'){try{draft.preview=M.generate(draft.game,M.activePack(draft.pack));draft.finalized=false;draft.previewDirty=false;draft.previewEdits={};draft.reviewed=false;move(4);}catch(e){error=e.message;render();}return;}
 if(a==='preview-large'){openPlayer(draft.game,draft.preview,game().name);return;}
 if(a==='apply-preview'){
  let invalid=false;document.querySelectorAll('[data-derived]').forEach(input=>{if(!input.value.trim())invalid=true;});if(invalid){notify('游戏内容不能为空，请补充后应用');return;}
  document.querySelectorAll('[data-derived]').forEach(input=>{const key=input.dataset.derived,v=input.value.trim();if(key.startsWith('answer-'))draft.preview.answers[+key.split('-')[1]].text=v;else if(key.startsWith('hint-'))draft.preview.qa[+key.split('-')[1]].hint=v;else if(key.startsWith('act-')){const item=draft.preview.acts[+key.split('-')[1]];if(item.text!==v)item.em='💬';item.text=v;}else if(key.startsWith('poolA-')){const item=draft.preview.poolA[+key.split('-')[1]];if(item.text!==v)item.em='💬';item.text=v;}else draft.preview[key]=v;});draft.finalized=false;draft.previewDirty=false;draft.previewEdits={};draft.reviewed=false;persist();render();notify('修改已应用，请重新核对');return;
 }
 if(a==='review-ready'){if(draft.reviewed&&!draft.previewDirty)move(5);return;}
 if(a==='publish'){
  if(!draft.title.trim()){notify('请填写活动名称');$('#activity-title').focus();return;}
  try{const next=M.snapshot(draft),old=M.clone(draft);draft.published=next;draft.finalized=true;draft.history.push(next);draft.step=5;const idx=saved.findIndex(d=>d.id===draft.id);const previous=M.clone(saved);if(idx<0)saved.push(M.clone(draft));else saved[idx]=M.clone(draft);if(!persist()){draft=old;saved=previous;render();return;}render();window.scrollTo({top:0});}catch(e){notify(e.message);}return;
 }
 if(a==='modify'){draft.finalized=false;draft.step=2;view='edit';persist();render();return;}
 if(a==='edit'){stashDraft();draft=M.clone(saved[+b.dataset.index]);draft.step=draft.pack?2:1;view='edit';persist();render();return;}
 if(a==='teach'||a==='teach-current'){const d=a==='teach'?saved[+b.dataset.index]:draft;openPlayer(d.published.game,d.published.content,d.published.title,true);return;}
 if(a==='export'){const blob=new Blob([JSON.stringify({draft,items:saved},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob),link=document.createElement('a');link.href=u;link.download='口语翻翻乐-备份.json';link.click();URL.revokeObjectURL(u);return;}
 if(a==='retry-save'){storageError='';persist();render();return;}
});
async function navigate(module){
 if(!['song','music','yoga','doodle','move-match'].includes(module))return;
 if(window.parent!==window)window.parent.postMessage({type:'wellbeing:module',module},location.origin);
 else if(await window.WBPrepareModuleSwitch())location.href='../prep-workbench-six-modules-v1/latest.html#'+module;
}
function prepareLocalLeave(){
 if(!ready||isReadOnly())return true;
 if(generation){notify('正在生成操练语言，请稍后再切换模块。');return false;}
 if(storageError){notify('保存尚未成功，请先重试保存；也可先导出备份保护内容。');return false;}
 if(!draft.input&&!draft.pack&&!saved.length&&lastStored===null)return true;
 return persist();
}
window.WBPrepareModuleSwitch=async()=>prepareLocalLeave()&&(!cloud||await cloud.flush());
function forwardVisibility(){
 const visible=platformVisible&&!document.hidden,playerOpen=$('#player').open;
 for(const frame of document.querySelectorAll('#inline-game,#player-frame')){
  const active=visible&&(frame.id==='player-frame'?playerOpen:!playerOpen);
  frame.contentWindow?.postMessage({type:'wellbeing:visibility',visible:!!active},location.origin);
 }
}
function bindGameFrames(){for(const frame of document.querySelectorAll('#inline-game,#player-frame')){if(!frame.dataset.visibilityBound){frame.dataset.visibilityBound='true';frame.addEventListener('load',forwardVisibility);}}forwardVisibility();}
window.WBPauseForModuleSwitch=()=>{platformVisible=false;forwardVisibility();};
window.addEventListener('message',event=>{
 if(event.source!==window.parent||event.origin!==location.origin||event.data?.type!=='wellbeing:visibility'||typeof event.data.visible!=='boolean')return;
 platformVisible=event.data.visible;forwardVisibility();
});
document.addEventListener('visibilitychange',forwardVisibility);
window.addEventListener('pagehide',event=>{platformVisible=false;forwardVisibility();if(!event.persisted)for(const owner of [...sessionOwners.keys()])releaseSession(owner);});
window.addEventListener('pageshow',()=>{platformVisible=true;forwardVisibility();});
window.addEventListener('beforeunload',event=>{if(!prepareLocalLeave()||cloud?.dirty){event.preventDefault();event.returnValue='';}});
function initialize(){
 try{
  lastStored=(cloud?.storage||localStorage).getItem(KEY);
  const data=JSON.parse(lastStored||'null');
  if(data){
   if(!data.draft||!Array.isArray(data.items))throw Error('活动数据格式有误。');
   saved=data.items;draft=data.draft;
   cloud?.importLocal();
  }
 }catch(e){storageError='已有内容未能读取，当前编辑不会覆盖原记录。';}
 ready=true;
 render();
}
function backendLoadError(e){
 $('#app').innerHTML=`<main class="library-home" data-workbench-load-error><h1>暂时无法读取口语活动</h1><p role="alert">${E(e.message)}</p><button type="button" id="retry-load">重试</button></main>`;
 $('#retry-load').onclick=()=>location.reload();
}
try{
 cloud=window.WBWorkbenchApi?.activityStore('spin-speak',KEY,updateStatus);
 if(cloud)cloud.load().then(initialize,backendLoadError);else initialize();
}catch(e){backendLoadError(e);}
})();
