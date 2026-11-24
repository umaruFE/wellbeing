/* Teacher workspace; classroom state stays behind the V39 adapter boundary. */
(() => {
  'use strict';
  const M = window.MMModel, Art = window.MMQuestionArt, Linked = window.MMLinkedContent, Context = window.MMQuestionContext, G = window.MMGeneration, Goals = window.WBLanguageGoals, Platform = window.MMPlatform, templates = window.MMCatalog;
  const app = document.querySelector('#app'), modal = document.querySelector('#modal'), stage = document.querySelector('#stage');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = value => M.clone(value);
  const paths = {
    image:'M3 3h18v18H3zM3 16l5-5 4 4 3-3 6 6M14 7h.01',
    grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', back:'m14 6-6 6 6 6M8 12h13',
    arrow:'M4 12h16m-6-6 6 6-6 6', play:'m8 4 12 8-12 8z', eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
    plus:'M12 5v14M5 12h14', copy:'M8 8h12v13H8zM16 8V3H3v13h5', trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
    up:'m6 14 6-6 6 6', down:'m6 10 6 6 6-6', check:'m4 12 5 5L20 6', close:'m6 6 12 12M6 18 18 6',
    more:'M5 12h.01M12 12h.01M19 12h.01', grip:'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
    book:'M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3zM12 6v15', file:'M6 2h8l5 5v15H6zM14 2v6h5M9 12h7M9 16h7',
    save:'M4 3h14l3 3v15H3V3zM7 3v6h10V3M7 21v-8h10v8', info:'M12 8v.1M12 11v6M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
    clock:'M12 6v6l4 3M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20', download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
    sound:'m3 9 5 0 5-5v16l-5-5H3zM17 8q6 4 0 8', star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;
  const btn = (label, action, opts = {}) => `<button type="button" class="wb-button ${opts.variant==='ghost'?'quiet':opts.variant||'secondary'}${opts.small?' small':''}" data-ui="button" data-action="${action}" ${opts.id ? `data-id="${esc(opts.id)}"` : ''} ${opts.value !== undefined ? `data-value="${esc(opts.value)}"` : ''} ${opts.variant ? `data-ui-variant="${opts.variant}"` : ''} ${opts.small ? 'data-ui-size="sm"' : ''} ${opts.disabled ? 'disabled' : ''} ${opts.title ? `title="${esc(opts.title)}" aria-label="${esc(opts.title)}"` : ''}>${opts.icon ? icon(opts.icon) : ''}${label}</button>`;
  const field = (label, key, value, options = {}) => `<div class="field wb-field ${options.className || ''}"><label for="f-${key}">${label}</label>${options.textarea ? `<textarea id="f-${key}" data-field="${key}" data-ui="field" rows="${options.rows || 2}">${esc(value)}</textarea>` : `<input id="f-${key}" data-field="${key}" data-ui="field" value="${esc(value)}" ${options.maxlength ? `maxlength="${options.maxlength}"` : ''}>`}${options.hint ? `<small>${options.hint}</small>` : ''}</div>`;
  const formatDate = value => new Date(value).toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const actionName = (action, seated) => ({left:'抬左臂',right:'抬右臂',both:'抬双臂',squat:seated?'双手放膝上':'下蹲'}[action] || action);
  let repo, cloud, activity = null, page = 'library', pending = false, saveError = null, saveTimer = null, liveAnswer = false;
  let currentLaunch = null, suspendedLaunch = null, restoreFocus = null, noticeTimer, launchTimer, closingStage = false;
  const progressWaiters = new Map();
  let candidate = null, pendingAdoption = false, preparationErrors = [], generationRound = 0, generationJob = null;
  const api = window.WBWorkbenchApi;
  let editingItemId=null, questionFilter='all', deferredAction=null, readingItemId=null;
  let questionMenu=null, questionDrag=null, suppressCardClickUntil=0;
  let libraryTab='cases', platformVisible=true, switchPreparation=null;
  const QUESTION_COUNT_OPTIONS=[10,20,30,50];
  const caseQuestionCounts=new Map();
  if (!M || !Art || !Linked || !G || !Goals || !Platform || !Array.isArray(templates)) { app.innerHTML = '<main class="fatal"><h1>工作台未能加载</h1><p>请检查模块文件是否完整，然后刷新页面。</p></main>'; return; }
  function toast(message) { clearTimeout(noticeTimer); const node=document.querySelector('#notice'); node.textContent=message;node.classList.add('show');noticeTimer=setTimeout(()=>node.classList.remove('show'),3600); }
  function header(){return `<header class="app-header"><div class="brand"><span class="brand-mark">${icon('star')}</span><strong>小星星</strong><span class="brand-divider"></span><span>分类游戏</span></div><div class="header-note"><span class="badge simulation">动作模拟</span><span class="muted">未使用摄像头</span></div></header>`;}
  function titleOf(template){return template.nameZh || {'articles-four':'冠词分类','articles-two':'a 还是 an','be-three':'be 动词'}[template.id] || template.title;}
  function activeRelease(a){return a.releases.find(r=>r.id===a.activeReleaseId);}
  function localError(error) {
    saveError = error; updateSaveState();
    const area=document.querySelector('#save-error');
    if(area) { area.hidden=false;area.innerHTML=`<div><strong>${error.code==='CONFLICT'?'另一页已更新这份活动':'当前修改尚未保存'}</strong><p>${esc(error.message || '浏览器保存失败，请保留当前页面。')}</p></div><div class="error-actions">${error.code==='CONFLICT'?btn('载入已保存内容','reload-activity'):pendingAdoption?btn('重试采用','adopt-candidate'):btn('重试保存','retry-save')}${btn(candidate?'导出生成候选':'导出当前草稿','export-draft')}${btn('另存为新活动','fork-current')}</div>`; }
    toast(error.code==='CONFLICT'?'检测到保存冲突，当前输入已保留。':'保存未完成，当前输入仍保留在页面中。');
  }
  function fatal(error){app.innerHTML=`${header()}<main class="fatal" id="main"><h1>暂时无法读取活动</h1><p>${esc(error.message)}</p><p>已有内容未被清空。可以先导出原始保存文件，再处理或恢复。</p><div class="fatal-actions">${btn('导出原始数据','export-raw',{icon:'download'})}${btn('重新读取','reload-page')}</div></main>`;}
  function saveStatus(){if(saveError)return '未保存，请处理页面提示';if(pending)return '正在保存草稿…';if(cloud?.status==='pending')return '正在同步后台…';if(cloud?.dirty)return '待同步后台';if(cloud?.readOnly)return '';return cloud?'草稿已同步后台':'草稿已保存到本机';}
  function updateSaveState(){const n=document.querySelector('#save-status');if(n){n.textContent=saveStatus();n.hidden=!n.textContent;n.classList.toggle('error',!!saveError);n.classList.toggle('is-error',!!saveError);}const t=document.querySelector('.toolbar-title');if(t&&activity)t.textContent=activity.draft.lesson.title||'未命名活动';}
  function flush(){clearTimeout(saveTimer);if(!activity||!pending)return !saveError;try{activity=repo.saveDraft(activity.id,activity.draft,editorState(),activity.revision);pending=false;saveError=null;const area=document.querySelector('#save-error');if(area)area.hidden=true;updateSaveState();return true;}catch(e){localError(e);return false;}}
  function queueSave(){pending=true;updateSaveState();clearTimeout(saveTimer);saveTimer=setTimeout(flush,350);}
  function editorState(){return {...(activity?.editor||{}),step:activity?.editor?.step||1,selectedItemId:activity?.editor?.selectedItemId||activity?.draft.lesson.items[0]?.id||null,scrollY:window.scrollY};}
  function saveEditor(){if(!activity)return true;activity.editor=editorState();try{repo.saveEditor(activity.id,activity.editor);return true;}catch(e){localError(e);return false;}}
  let questionEdit=null;
  function baseLesson(){return candidate?.result.lesson||activity.draft.lesson;}
  function editingLesson(){return questionEdit?.lesson||baseLesson();}
  function itemUsesImage(item,lesson){return typeof item.imageEnabled==='boolean'?item.imageEnabled:lesson.showImages!==false;}
  function setDefaultCardStyle(lesson,enabled){
    // Freeze the effective style of older cards before changing the default.
    for(const item of lesson.items)if(typeof item.imageEnabled!=='boolean')item.imageEnabled=itemUsesImage(item,lesson);
    lesson.showImages=enabled;
  }
  function changeDefaultCardStyle(enabled){
    if(!flush())return;
    const previousRevision=activity.revision,draft=clone(activity.draft);
    setDefaultCardStyle(draft.lesson,enabled);
    try{
      activity=repo.saveDraft(activity.id,draft,editorState(),previousRevision);
      if(candidate&&candidate.activityId===activity.id&&candidate.revision===previousRevision){
        setDefaultCardStyle(candidate.result.lesson,enabled);candidate.revision=activity.revision;
      }
      updateSaveState();
    }catch(error){localError(error);const select=document.querySelector('#show-question-images');if(select)select.value=activity.draft.lesson.showImages===false?'no':'yes';}
  }
  function clearQuestionImage(item){
    item.imageUrl='';item.art=null;item.imageAlt='';
    delete item.relation;delete item.imageOrigin;delete item.imageError;
  }
  function setQuestionImage(enabled){
    if(!questionEdit)return;
    const item=currentItem();item.imageEnabled=enabled;
    if(!enabled){imageJobs.delete(item.id);clearQuestionImage(item);}
    markQuestionChange();renderQuestionDialog();
    document.querySelector(enabled?'[data-action="generate-image"]':'[data-action="add-image"]')?.focus();
  }
  function openQuestionEditor(id,mode='edit'){
    if(questionEdit)return;
    if(!flush())return;
    stopReading();
    const base=baseLesson(),lesson=clone(base),source=base.items.find(item=>item.id===id);
    if(mode==='edit'&&!source)return;
    const category=lesson.categories.find(c=>c.id===questionFilter)||lesson.categories[0];
    const item=mode==='edit'?lesson.items.find(item=>item.id===id):mode==='copy'?{...clone(source),id:uid()}:{id:uid(),categoryId:category?.id||'',sentence:'',answerText:lesson.mode==='word-sort'?(category?.label||''):(category?.label||'').toLowerCase()==='ø'?'':(category?.label||'').toLowerCase(),word:'',keyword:'',art:null,imageAlt:'',imageEnabled:lesson.showImages!==false,context:'',explanation:'',hint:'',archiveText:'',type:lesson.mode};
    if(mode==='copy')item.imageEnabled=itemUsesImage(source,base);
    if(mode!=='edit')lesson.items.push(item);
    questionEdit={lesson,id:item.id,isNew:mode!=='edit',activityId:activity.id,original:mode==='edit'?clone(source):null,initial:clone(item),errors:[],closing:false};
    editingItemId=item.id;
    renderQuestionDialog();
    document.querySelector(lesson.mode==='word-sort'?'#f-word':'#f-sentence')?.focus();
  }
  function questionIsDirty(){return !!questionEdit&&JSON.stringify(currentItem())!==JSON.stringify(questionEdit.initial);}
  function cancelQuestion(){
    if(!questionEdit)return;
    const oldId=questionEdit.id,isNew=questionEdit.isNew;imageJobs.delete(oldId);stopReading();questionEdit=null;editingItemId=null;
    modal.classList.remove('mm-question-dialog');closeDialog();renderEditor();
    document.querySelector(isNew?'[data-action="add-item"]':`[data-action="edit-item"][data-id="${CSS.escape(oldId)}"]`)?.focus({preventScroll:true});
  }
  function requestQuestionClose(){
    if(!questionEdit)return;
    if(!questionIsDirty()&&!imageJobs.has(questionEdit.id)){cancelQuestion();return;}
    questionEdit.closing=true;renderQuestionDialog();document.querySelector('[data-action="continue-question"]')?.focus();
  }
  function renderQuestionDialog(){
    if(!questionEdit)return;
    const session=questionEdit,item=currentItem(),lesson=session.lesson,focused=document.activeElement,focusId=focused?.id,promptId=focused?.dataset?.imagePrompt,selectionStart=focused?.selectionStart,selectionEnd=focused?.selectionEnd;
    modal.classList.add('mm-question-dialog');
    const body=`<p class="mm-edit-intro">${session.isNew?'填写题目并选择正确分类，保存后加入列表。':'修改仅在此窗口中预览，点击保存后更新题目。'}</p>${session.closing?`<div class="mm-close-prompt" role="alert"><strong>这道题有尚未保存的内容</strong><div class="mini-actions">${btn('继续编辑','continue-question',{small:true,variant:'primary'})}${btn('放弃修改并关闭','cancel-item',{small:true})}</div></div>`:''}<div class="mm-question-layout"><section class="mm-question-form" data-item-id="${esc(item.id)}">${renderQuestionFields()}<div id="question-edit-errors" role="alert" ${session.errors.length?'':'hidden'}>${session.errors.map(e=>`<p>${esc(e.message)}</p>`).join('')}</div></section><aside class="mm-question-preview"><h3>题卡预览</h3><p>答题前的显示效果</p><div id="question-edit-preview">${renderTaskPreview(item,lesson)}</div><span id="question-edit-category" class="badge">正确分类：${esc(lesson.categories.find(c=>c.id===item.categoryId)?.label||'未选择')}</span></aside></div>`;
    dialog(session.isNew?'新增题目':'编辑题目',body,`<span class="mm-editor-status">${imageJobs.has(item.id)?'图片正在处理，请稍候':questionIsDirty()?'有未保存的修改':'保存后应用到题目列表'}</span><div class="mini-actions">${btn('取消','cancel-item')}${btn(session.isNew?'保存并添加':'保存修改','save-question',{variant:'primary',icon:'check',disabled:imageJobs.has(item.id)})}</div>`);
    const focusTarget=focusId?document.querySelector('#'+CSS.escape(focusId)):promptId?document.querySelector('[data-image-prompt="'+CSS.escape(promptId)+'"]'):null;
    if(focusTarget){focusTarget.focus({preventScroll:true});if(typeof selectionStart==='number'&&focusTarget.setSelectionRange)focusTarget.setSelectionRange(selectionStart,selectionEnd);}
    for(const error of session.errors)document.querySelector('#f-'+error.field)?.setAttribute('aria-invalid','true');
  }
  function saveQuestion(){
    const session=questionEdit;if(!session||imageJobs.has(session.id))return;
    const lesson=session.lesson,item=clone(currentItem()),category=lesson.categories.find(c=>c.id===item.categoryId);
    item.word=(item.word||'').trim();item.sentence=(item.sentence||'').trim();
    item.imageEnabled=itemUsesImage(item,lesson);if(!item.imageEnabled)clearQuestionImage(item);
    item.answerText=lesson.mode==='word-sort'?(category?.label||''):(category?.label||'').toLowerCase()==='ø'?'':(category?.label||'').toLowerCase();
    item.archiveText=lesson.mode==='word-sort'?item.word:item.sentence.replace('___',item.answerText).replace(/\s+/g,' ').trim();
    // The teacher's selected category remains authoritative. Only refresh local
    // teaching suggestions when they agree with it; custom pictures stay intact.
    const original=session.original,changed=!original||['word','sentence','categoryId'].some(key=>original[key]!==item[key]);
    if(changed){
      const suggestion=Linked.analyze(item,lesson);
      for(const key of ['context','hint','explanation'])if(item[key]===(original?.[key]||''))item[key]=suggestion.kind==='auto'&&suggestion.item.categoryId===item.categoryId?(suggestion.item[key]||''):'';
    }
    item.contentSync={status:'synced',message:'已由教师保存并确认题目与分类。'};
    const checked={...lesson,items:lesson.items.map(i=>i.id===item.id?item:i)};
    session.errors=M.validate(checked,activity.draft.settings).filter(error=>error.itemId===item.id);
    if(session.errors.length){renderQuestionDialog();document.querySelector('#f-'+session.errors[0].field)?.focus();return;}
    const base=baseLesson(),existing=base.items.find(i=>i.id===item.id);
    if(!session.isNew&&JSON.stringify(existing)!==JSON.stringify(session.original)){
      session.errors=[{message:'原题目已更新，请复制当前输入后取消编辑，再打开最新题目。'}];renderQuestionDialog();return;
    }
    const next=clone(base);
    if(session.isNew)next.items.push(item);else next.items[next.items.findIndex(i=>i.id===item.id)]=item;
    try{
      if(candidate){candidate.result.lesson=next;candidate.edited=true;}
      else activity=repo.saveDraft(activity.id,{...activity.draft,lesson:next},editorState(),activity.revision);
    }catch(error){session.errors=[{message:error.message||'保存失败，输入已保留，请重试。'}];renderQuestionDialog();return;}
    imageJobs.delete(item.id);questionEdit=null;editingItemId=null;if(session.isNew)questionFilter='all';modal.classList.remove('mm-question-dialog');closeDialog();renderEditor();
    document.querySelector(`[data-action="edit-item"][data-id="${CSS.escape(item.id)}"]`)?.focus({preventScroll:true});
    toast(session.isNew?'已添加题目。':'已保存题目修改。');
  }
  function currentItem(){return editingLesson().items.find(i=>i.id===(editingItemId||activity.editor.selectedItemId))||editingLesson().items[0];}
  function markQuestionChange(lesson=editingLesson()){if(questionEdit&&lesson===questionEdit.lesson){questionEdit.errors=[];return;}if(candidate){candidate.edited=true;const note=document.querySelector('.candidate-bar p');if(note)note.textContent='候选已调整，采用后才会保存到草稿。';}else queueSave();}
  const teachingFields=['context','hint','explanation','archiveText'];
  const linkedFieldNames={sentence:'题目句子',word:'题目词卡',keyword:'题目对象',art:'配图',imageUrl:'配图',imageAlt:'配图对象',categoryId:'正确分类',answerText:'答案',context:'语境说明',hint:'答错提示',explanation:'答后解释',archiveText:'收集卡文字'};
  function linkState(item){return item.contentSync?.status||'';}
  function needsLinkReview(item){return ['pending','review'].includes(linkState(item));}
  function legacyImageMismatch(item,lesson){
    if(item.imageOrigin||item.contentSync||!Art.source(item))return false;
    const result=Linked.analyze(item,lesson);
    return result.kind==='auto'&&Art.source(item)!==Art.source(result.item);
  }
  function stalePicture(item,lesson){return legacyImageMismatch(item,lesson)||needsLinkReview(item)&&item.contentSync?.kind!=='manual'&&!Linked.visibleImage(item)&&!!(Art.source(item)||Art.source(item.contentSync?.baseline));}
  function questionStatus(item,lesson){
    if(!itemUsesImage(item,lesson))return '纯文字题目';
    if(item.imageOrigin)return item.imageOrigin==='upload'?'已上传配图':'AI 生成配图';
    if(linkState(item)==='pending'||legacyImageMismatch(item,lesson))return '内容待同步';
    if(linkState(item)==='review')return '教学内容待核对';
    if(linkState(item)==='synced')return Art.source(item)?'已同步配图':'待添加配图';
    return Art.source(item)?'配图随题目自动匹配':'待添加配图';
  }
  function replaceItem(id,next){const lesson=editingLesson(),n=lesson.items.findIndex(i=>i.id===id);if(n<0)return;lesson.items[n]={...next,id};markQuestionChange();refreshCurrent();document.querySelector('.question-card.is-editing .linked-actions button,.question-card.is-editing [data-action="finish-item"]')?.focus({preventScroll:true});}
  function validationErrors(lesson,settings){return [...M.validate(lesson,settings).map(e=>teachingFields.includes(e.field)?{...e,field:'contentSync',message:'请先完成这道题的修改。'}:e),...lesson.items.filter(i=>legacyImageMismatch(i,lesson)).map(i=>({itemId:i.id,field:'sentence',message:'题目配图与内容不一致，请打开该题并完成同步。'}))];}
  function linkedChanges(state,lesson){
    const seen=new Set();
    const readable=(field,value)=>field==='categoryId'?(lesson.categories.find(c=>c.id===value)?.label||'未分类'):field==='answerText'?(value||'不填（Ø）'):['art','imageUrl'].includes(field)?(value?'有对应配图':'纯文字'):(value||'无');
    const beforeImage=Art.source(state.baseline),afterImage=Art.source(state.proposal),picture=src=>src?`<img src="${esc(src)}" alt="待核对配图">`:'<span>纯文字</span>';
    const imageChange=beforeImage!==afterImage?`<div class="linked-change"><dt>配图</dt><dd class="linked-art-change">${picture(beforeImage)}<span aria-hidden="true">→</span>${picture(afterImage)}</dd></div>`:'';
    return imageChange+(state.changes||[]).filter(change=>{if(['keyword','imageAlt','imageUrl','art',...teachingFields].includes(change.field))return false;const key=change.field;if(seen.has(key))return false;seen.add(key);return true;}).map(c=>`<div class="linked-change"><dt>${esc(c.field==='word'&&lesson.mode!=='word-sort'?'题目对象':linkedFieldNames[c.field]||c.field)}</dt><dd><span>${esc(readable(c.field,c.before))}</span><span aria-hidden="true">→</span><strong>${esc(readable(c.field,c.after))}</strong></dd></div>`).join('');
  }
  function renderLinkedStatus(item,lesson){
    const state=item.contentSync,status=linkState(item),mismatch=legacyImageMismatch(item,lesson);
    if(status==='review')return `<div class="linked-status needs-review" data-sync-status="review"><strong>${state.kind==='manual'?'请核对题目和分类':'这次修改需要核对'}</strong>${state.kind==='manual'?'<p>本地规则未覆盖这道题，请确认下方正确分类。暂无配图时使用纯文字。</p>':`<p>${esc(state.message)}</p><dl class="linked-changes">${linkedChanges(state,lesson)}</dl>`}<div class="linked-actions">${btn(state.kind==='manual'?'已核对，完成修改':'确认这些变化',state.kind==='manual'?'review-item':'apply-linked',{id:item.id,variant:'primary',small:true})}${btn('撤销这次修改','undo-item',{id:item.id,small:true})}</div><p class="linked-error" role="alert" hidden></p></div>`;
    if(status==='pending'||mismatch)return state?.baseline?`<div class="linked-undo" data-sync-status="pending">${btn('撤销这次修改','undo-item',{id:item.id,small:true,variant:'ghost'})}</div>`:'';
    if(status==='synced')return `<div class="linked-undo" data-sync-status="synced">${state.baseline?btn('撤销这次修改','undo-item',{id:item.id,small:true,variant:'ghost'}):''}</div>`;
    return '';
  }
  function finishItem(id){
    const lesson=editingLesson(),item=lesson.items.find(i=>i.id===id);if(!item)return;
    if(linkState(item)==='synced'){toast('这道题已完成同步。');return;}
    const baseline=clone(item.contentSync?.baseline||Linked.clean(item)),result=Linked.analyze(item,lesson);
    if(result.kind==='auto'&&item.sentence===baseline.sentence&&item.word===baseline.word&&item.categoryId===baseline.categoryId){for(const field of item.contentSync?.editedFields||[])result.item[field]=item[field];}
    // Carry teacher-written copy into both automatic and suggested bundles.
    // It still needs review when the question itself has changed.
    if(item.contentSync?.editedFields?.some(field=>result.item[field]!==item[field])){
      for(const field of item.contentSync.editedFields)result.item[field]=item[field];
      if(result.kind!=='manual')result.kind='review';
      result.message='已保留你手动调整的教学说明，请核对它们是否与新题目一致。'+(result.kind==='manual'?'本地规则无法判断其余内容，请补齐核对。':'');
      result.changes=[...new Set([...result.changes.map(c=>c.field),...item.contentSync.editedFields])].map(field=>({field,before:baseline[field],after:result.item[field]}));
    }
    if(result.kind==='auto'){
      replaceItem(id,{...result.item,contentSync:{status:'synced',baseline,message:result.message}});toast(Art.source(result.item)?'已同步配图和教学说明，可撤销。':'已同步教学说明；暂无匹配配图，使用纯文字。');
    }else if(result.kind==='review'){
      replaceItem(id,{...item,contentSync:{status:'review',kind:'review',baseline,proposal:result.item,message:result.message,changes:result.changes}});
    }else{
      replaceItem(id,{...result.item,contentSync:{status:'review',kind:'manual',baseline,message:result.message}});
    }
  }
  function completeManualReview(id){
    const lesson=editingLesson(),item=lesson.items.find(i=>i.id===id);if(item?.contentSync?.kind!=='manual')return;
    const next=Linked.clean(item);
    next.archiveText=lesson.mode==='word-sort'?(next.word||'').trim():(next.sentence||'').replace('___',next.answerText||'').replace(/\s+/g,' ').trim();
    const copy=clone(lesson);copy.items=copy.items.map(i=>i.id===id?next:i);
    const errors=M.validate(copy,activity.draft.settings).filter(e=>e.itemId===id).map(e=>e.field==='archiveText'?{...e,message:'题目内容不能为空，请补充词卡或句子。'}:e);
    if(errors.length){const node=document.querySelector('.question-card.is-editing .linked-error');if(node){node.hidden=false;node.textContent=[...new Set(errors.map(e=>e.message))].join(' ');}return;}
    replaceItem(id,{...next,contentSync:{status:'synced',baseline:item.contentSync.baseline,message:'已由教师核对题目与分类。'}});toast('已记录本题核对结果。');
  }
  const questionCountOptions=value=>QUESTION_COUNT_OPTIONS.map(count=>`<option value="${count}" ${value===count?'selected':''}>${count} 题</option>`).join('');
  const caseQuestionCount=id=>caseQuestionCounts.get(id)||QUESTION_COUNT_OPTIONS[0];
  function caseLesson(template,count=caseQuestionCount(template.id)){
    if(!QUESTION_COUNT_OPTIONS.includes(count))throw new Error('请选择总题数：10、20、30 或 50 题。');
    return G.generate({...G.defaults(template),questionCount:count},{lessonId:template.id}).lesson;
  }
  function renderCaseCard(t){
    const count=caseQuestionCount(t.id);
    return `<article class="case-card"><div class="case-cover"><img src="assets/${esc(t.id)}.jpg" alt="${esc(titleOf(t))}课堂画面" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="case-cover-fallback" hidden><div class="sample-sentence">${esc(t.items[0].sentence).replace('___','<em>___</em>')}</div><div class="cover-groups">${t.categories.map(c=>`<span>${esc(c.label)}</span>`).join('')}</div></div></div><div class="case-body"><h3>${esc(titleOf(t))}</h3><p class="case-english">${esc(t.title)}</p><div class="case-meta"><span class="case-categories">${t.categories.map(c=>esc(c.label)).join(' · ')}</span><span>${t.categories.length} 类 / <span data-case-count="${esc(t.id)}">${count}</span> 题</span></div><div class="case-actions">${btn('预览案例','example',{id:t.id,icon:'eye',variant:'primary'})}${btn('制作同款','create',{id:t.id})}</div></div></article>`;
  }
  function renderLibrary(){
    closeQuestionMenu();finishQuestionDrag(false);
    cancelGeneration();stopReading();editingItemId=null;questionFilter='all';page='library';activity=null;pending=false;saveError=null;candidate=null;pendingAdoption=false;preparationErrors=[];history.replaceState(null,'','#library');
    let activities;try{activities=repo.list();}catch(e){fatal(e);return;}
    if(cloud)libraryTab='mine';
    const cases=`<div class="case-grid">${templates.map(renderCaseCard).join('')}</div>`;
    const mine=activities.length?`<div class="activity-list">${activities.map(a=>{const release=activeRelease(a),sessions=repo.sessions(a.id),resume=sessions.filter(s=>s.status!=='ended').sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt))[0];return `<article class="activity-row"><div class="activity-copy"><h3>${esc(a.draft.lesson.title||'未命名活动')}</h3><p>${a.draft.lesson.items.length} 题 · ${esc(titleOf(templates.find(t=>t.id===a.templateId)||a.draft.lesson))} · ${formatDate(a.updatedAt)} 更新</p></div><div class="activity-actions"><span class="badge ${release&&!M.isDirty(a)?'ready':''}">${release?(M.isDirty(a)?'草稿有未确认修改':`已确认 v${release.number}`):'草稿'}</span>${btn('编辑草稿','edit',{id:a.id})}${release?btn('进入授课','choose-release',{id:a.id,variant:resume?'':'primary',icon:'play'}):''}${resume?btn(resume.status==='complete'?'查看课堂结果':'继续课堂','resume-session',{id:resume.id,variant:'primary'}):''}</div></article>`;}).join('')}</div>`:`<div class="empty">${icon('book')}<div><p>还没有自己的分类活动</p><p>点击“新建分类活动”，填写基础信息与分类即可开始。</p></div></div>`;
    app.innerHTML=Platform.homeShell(`${Platform.homeHeading(btn('新建分类活动','new-activity',{icon:'plus',variant:'primary'}))}<div class="lh-library-head"><div class="lh-tabs" role="group" aria-label="活动来源">${(cloud?[['mine','我制作的',activities.length]]:[['cases','案例库',templates.length],['mine','我制作的',activities.length]]).map(([value,label,count])=>`<button type="button" data-ui="tab" data-action="library-tab" data-value="${value}" class="${libraryTab===value?'active':''}" aria-pressed="${libraryTab===value}">${label} <span>${count}</span></button>`).join('')}</div></div><section id="library-results" aria-label="${libraryTab==='cases'?'分类游戏案例':'我制作的活动'}">${libraryTab==='cases'?cases:mine}</section><div class="library-footer">${icon('info')} ${cloud?'课堂动作模拟由页面运行。':'当前为动作模拟；案例预览不会创建课堂记录。'}</div>`);
    Platform.decorate();
  }
  function openActivity(id){if(activity&&!flush())return;cancelGeneration();stopReading();editingItemId=null;questionFilter='all';candidate=null;pendingAdoption=false;preparationErrors=[];try{activity=repo.get(id);if(!activity){toast('活动不存在');renderLibrary();return;}pending=false;saveError=null;activity.editor ||= {step:1};activity.editor.selectedItemId ||=activity.draft.lesson.items[0]?.id;page='editor';renderEditor();window.scrollTo(0,activity.editor.scrollY||0);}catch(e){fatal(e);}}
  function renderEditor(){
    closeQuestionMenu();finishQuestionDrag(false);
    const openPanels=['.optional-settings'].filter(q=>document.querySelector(q)?.open);
    const step=Number(activity.editor?.step)||1, release=activeRelease(activity), hasContent=activity.draft.lesson.items.length>0;
    history.replaceState(null,'',`#edit/${encodeURIComponent(activity.id)}`);
    app.innerHTML=Platform.editorShell(`<main id="main" class="wb-authoring mm-authoring" tabindex="-1">
      <div class="wb-authoring-heading">
        ${btn('返回活动库','home',{icon:'back',variant:'ghost'})}
        <header class="wb-authoring-header">
          <h1 class="toolbar-title wb-authoring-title">${esc(activity.draft.lesson.title||'新建分类活动')}</h1>
          <div class="wb-authoring-actions">${release?btn(`授课版 V${release.number}`,'choose-release',{id:activity.id}):''}${btn('预览','preview',{icon:'eye',disabled:!hasContent||!!candidate})}</div>
          <div class="wb-authoring-status">${release?`已确认授课版 V${release.number}${M.isDirty(activity)?' · 草稿有未确认修改':''}`:'填写分类与语言目标，生成后核对并确认授课版。'}</div>
        </header>
      </div>
      <nav class="wb-authoring-steps" aria-label="备课步骤">
        <button type="button" class="wb-authoring-step ${step===1?'active':'complete'}" data-action="step" data-value="1" ${step===1?'aria-current="step"':''}><span class="wb-step-number">${step>1?icon('check'):'1'}</span><span class="wb-step-label">基础信息与分类</span></button>
        <button type="button" class="wb-authoring-step ${step===2?'active':''}" data-action="step" data-value="2" ${step===2?'aria-current="step"':''}><span class="wb-step-number">2</span><span class="wb-step-label">生成与核对</span></button>
      </nav>
      <div class="error-banner wb-notice error" id="save-error" hidden role="alert"></div>
      <div class="wb-authoring-body">${step===1?renderPreparation():renderGenerated()}</div>
    </main>${renderEditorFooter(step,hasContent)}`);
    Platform.decorate();
    for(const q of openPanels){const node=document.querySelector(q);if(node)node.open=true;}
    updateSaveState();updateGenerationState();if(saveError)localError(saveError);
  }
  function renderEditorFooter(step,hasContent){
    const actions=step===1
      ?btn('生成分类内容','generate',{variant:'primary',icon:'arrow'})
      :candidate
        ?btn('放弃候选','discard-candidate')+btn('重新生成','generate')+btn('采用这些内容','adopt-candidate',{variant:'primary',icon:'check'})
        :btn('重新生成','generate')+(hasContent?btn('确认授课版','review',{variant:'primary',icon:'check'}):'');
    return `<footer class="wb-authoring-footer" aria-label="备课操作">
      <div class="wb-footer-meta">${step>1?btn('上一步：基础信息与分类','step',{value:1,icon:'back',variant:'ghost'}):''}<span class="save-state wb-status" id="save-status" role="status" ${saveStatus() ? '' : 'hidden'}>${saveStatus()}</span><span class="wb-status" id="generation-status" role="status" hidden></span></div>
      <div class="wb-footer-actions">${actions}</div>
    </footer>`;
  }
  function preparation(){return activity.draft.lesson.preparation||G.defaults(activity.draft.lesson);}
  function changePreparation(update){const p=clone(preparation());update(p);activity.draft.lesson.preparation=p;candidate=null;pendingAdoption=false;preparationErrors=[];cancelGeneration();queueSave();}
  function questionCountInfo(p=preparation()){
    const value=Object.prototype.hasOwnProperty.call(p,'questionCount')?p.questionCount:10;
    return {value,legacy:!QUESTION_COUNT_OPTIONS.includes(value)};
  }
  function renderQuestionCount(p){
    const info=questionCountInfo(p);
    return `<div class="field wb-field question-count-setting"><label for="prep-question-count">总题数</label><div class="question-count-input"><select id="prep-question-count" data-preparation="questionCount" data-ui="field" required aria-describedby="prep-question-count-help">${info.legacy?`<option value="" disabled selected>请选择（原 ${esc(info.value)} 题）</option>`:''}${questionCountOptions(info.value)}</select></div><small id="prep-question-count-help">自动分配到各类</small></div>`;
  }
  function updateQuestionCountUI(){
    const node=document.querySelector('#prep-question-count');if(!node)return;
    const info=questionCountInfo();node.value=info.legacy?'':String(info.value);
    node.removeAttribute('aria-invalid');
    document.querySelector('#prep-question-count-help').textContent='自动分配到各类';
  }
  function goalTags(){return preparation().languageGoals.map((g,i)=>`<span class="goal-tag">${esc(g)}<button type="button" data-action="remove-goal" data-value="${i}" aria-label="移除 ${esc(g)}">${icon('close')}</button></span>`).join('');}
  function commitGoal(){const input=document.querySelector('#prep-goal-input');if(!input?.value.trim())return;const merged=Goals.merge(preparation().languageGoals,input.value);changePreparation(p=>p.languageGoals=merged.items);input.value='';document.querySelector('#goal-tags').innerHTML=goalTags();}
  function renderPreparation(){const p=preparation();return `<section class="preparation-page"><div class="section-intro wb-panel-heading"><h2>这次想练习什么分类？</h2><p>填写基础信息和分类名称，题目、提示与解释由生成流程准备。</p></div><div class="preparation-grid"><section class="preparation-section wb-authoring-panel"><h2>基础信息</h2><div class="basic-fields"><div class="field wb-field span-all"><label for="prep-theme">活动主题 <small>选填</small></label><input id="prep-theme" data-preparation="theme" data-ui="field" maxlength="120" value="${esc(p.theme)}" placeholder="例如：动物与水果、生活中的冠词"></div><div class="field wb-field"><label for="prep-age">学生年龄</label><select id="prep-age" data-preparation="age" data-ui="field">${['4–6 岁','7–9 岁','10–12 岁'].map(age=>`<option value="${age.replace(/\s/g,'')}" ${p.age.replace(/\s/g,'')===age.replace(/\s/g,'')?'selected':''}>${age}</option>`).join('')}</select></div>${renderQuestionCount(p)}<div class="field wb-field span-all"><label for="show-question-images">默认题卡样式</label><select id="show-question-images" data-ui="field"><option value="no" ${activity.draft.lesson.showImages===false?'selected':''}>纯文字</option><option value="yes" ${activity.draft.lesson.showImages!==false?'selected':''}>图文题卡</option></select><small>用于生成内容和新增题目；每道题可单独添加或移除图片。修改默认样式不影响已有题卡。</small></div><div class="field wb-field span-all"><label for="prep-goal-input">语言目标 <small>核心词汇、句型或语法点</small></label><div class="goals-editor"><div id="goal-tags" class="goal-tags">${goalTags()}</div><div class="goal-input-row"><textarea rows="2" data-ui-embedded="true" id="prep-goal-input" aria-describedby="goal-help" placeholder="例如：cat（每行一项）&#10;或：a / an 的用法"></textarea>${btn('添加','add-goal',{small:true})}</div></div><small id="goal-help">每行一项，按回车添加；句型中的标点会保留。至少添加一个语言目标。</small></div></div></section><section class="preparation-section classification-section wb-authoring-panel"><div class="classification-heading"><h2>分类设置</h2><div class="field wb-field"><label for="prep-count">分类数量</label><select id="prep-count" data-ui="field">${[2,3,4].map(n=>`<option value="${n}" ${p.categoryNames.length===n?'selected':''}>${n} 类</option>`).join('')}</select></div></div><div class="category-fields">${p.categoryNames.map((name,i)=>`<div class="field wb-field"><label for="prep-category-${i}">分类 ${i+1}</label><input id="prep-category-${i}" data-category-index="${i}" data-ui="field" maxlength="24" value="${esc(name)}" placeholder="${['例如：动物 / Animals','例如：水果 / Fruits','输入第三个分类','输入第四个分类'][i]}"></div>`).join('')}</div><p class="field-note">支持 2–4 类，动作由系统按分类顺序安排。</p></section></div><div class="demo-examples"><span>试填示例</span>${btn('动物与水果','fill-example',{value:'words',small:true,variant:'ghost'})}${btn('a / an','fill-example',{value:'articles',small:true,variant:'ghost'})}${btn('am / is / are','fill-example',{value:'be',small:true,variant:'ghost'})}</div>${preparationErrors.length?`<div class="preparation-errors wb-notice error" role="alert">${preparationErrors.map(e=>`<p>${esc(e.message)}</p>`).join('')}</div>`:''}</section>`;}
  function updateGenerationState(){
    const busy = generationJob?.activity === activity;
    const button = document.querySelector('[data-action="generate"]');
    if (button) button.disabled = busy;
    const status = document.querySelector('#generation-status');
    if (status) {
      status.hidden = !busy;
      status.textContent = busy ? '正在通过后台生成分类题…' : '';
    }
  }
  function cancelGeneration(){
    generationJob?.controller.abort();
    generationJob = null;
    updateGenerationState();
  }
  function showPreparationErrors(errors){
    preparationErrors = errors;
    activity.editor.step = 1;
    renderEditor();
    document.querySelector('.preparation-errors')?.scrollIntoView({block:'center'});
  }
  async function generateContent(){
    if (generationJob?.activity === activity) return;
    commitGoal();
    const count = questionCountInfo();
    if (count.legacy) {
      showPreparationErrors([{field:'questionCount',message:'请选择总题数：10、20、30 或 50 题。'}]);
      const select = document.querySelector('#prep-question-count');
      select?.setAttribute('aria-invalid','true');
      select?.focus();
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(preparation(),'questionCount')) {
      changePreparation(p => p.questionCount = count.value);
    }
    const errors = M.validatePreparation(preparation());
    if (errors.length) {
      showPreparationErrors(errors);
      return;
    }
    if (!flush()) return;

    const owner = activity;
    const input = M.normalizePreparation(preparation());
    const inputSignature = M.preparationSignature(input);
    let job;
    const current = () => activity === owner && !pending && !currentLaunch && !questionEdit
      && M.preparationSignature(preparation()) === inputSignature;
    try {
      let result;
      if (!api || api.offline) {
        result = G.generate(input,{lessonId:owner.templateId,round:generationRound++});
      } else {
        job = { activity:owner, controller:new AbortController() };
        generationJob = job;
        preparationErrors = [];
        updateGenerationState();
        const { data } = await api.request('/api/ai/generate-classification',{
          method:'POST',body:input,signal:job.controller.signal,
        });
        if (generationJob !== job || !current()) return;
        if (!Array.isArray(data?.items) || data.items.length !== input.questionCount || !Array.isArray(data.unmatchedGoals)) {
          throw Error('分类生成服务返回的题数不符，请重试。');
        }
        const notes = ['分类题由后台生成，请核对题目和正确分类。'];
        const generation = { source:'backend-ai', inputSignature, notes, unmatchedGoals:data.unmatchedGoals, createdAt:new Date().toISOString() };
        const lesson = {
          id:owner.templateId,title:input.theme||input.categoryNames.join(' / ')+'分类',subtitle:input.categoryNames.join(' · '),
          mode:data.mode,categories:data.categories,items:data.items,preparation:input,generation,
        };
        result = { lesson,notes,unmatchedGoals:generation.unmatchedGoals,inputSignature };
      }
      result.lesson.showImages = activity.draft.lesson.showImages !== false;
      result.lesson.items.forEach(item => {
        item.imageEnabled = result.lesson.showImages;
        clearQuestionImage(item);
      });
      if (job && M.validate(result.lesson,activity.draft.settings).length) throw Error('分类生成服务返回了无法采用的题目，请重试。');
      preparationErrors = [];
      editingItemId = null;
      questionFilter = 'all';
      candidate = { result, activityId:activity.id, revision:activity.revision, inputSignature };
      activity.editor.step = 2;
      activity.editor.scrollY = 0;
      saveEditor();
      renderEditor();
      window.scrollTo(0,0);
      if (result.lesson.showImages) generateLessonImages(result.lesson);
    } catch (error) {
      if (!job || generationJob === job && current()) {
        showPreparationErrors([{message:error.message||'分类内容未能生成，请重试。'}]);
      }
    } finally {
      if (job && generationJob === job) {
        generationJob = null;
        updateGenerationState();
      }
    }
  }
  function renderGenerated(){const lesson=candidate?.result.lesson||activity.draft.lesson,p=preparation(),hasContent=lesson.items.length>0,stale=lesson.preparation&&(!lesson.generation||lesson.generation.inputSignature!==M.preparationSignature(p));return `<section class="generated-page"><div class="generated-heading wb-panel-heading"><div><h2>${candidate?'核对生成的内容':hasContent?'核对分类内容':'准备生成内容'}</h2><p>${candidate?'检查题目与分类，满意后采用为草稿。':hasContent?'可直接预览，或按需调整个别题目。':'先填写教学目标和分类名称，再生成内容。'}</p></div><span class="badge ${candidate?'simulation':''}">${candidate?'候选 · 尚未采用':lesson.generation?'已采用':'当前草稿'}</span></div>${candidate?`<div class="candidate-bar wb-notice"><p>${candidate.edited?'候选已调整，采用后才会保存到草稿。':`本次生成 ${lesson.items.length} 题，当前草稿与已确认授课版尚未改变。`}</p></div>`:''}${stale&&!candidate?'<p class="preparation-errors wb-notice error" role="status">基础信息或分类已修改，请重新生成并采用后再预览或确认授课版。</p>':''}<div class="generated-summary"><span>${esc(p.theme||'未指定主题')}</span><span>${esc(p.age)}</span><span>${lesson.categories.length} 类 · ${lesson.items.length} 题</span></div>${hasContent?`<div class="generated-title">${candidate?`<h2>${esc(lesson.title)}</h2>`:field('活动名称','title',lesson.title,{maxlength:100})}</div>${renderGroups(lesson)}${(candidate?.result.unmatchedGoals||lesson.generation?.unmatchedGoals||[]).length?`<div class="unmatched-goals wb-notice warning" role="status"><strong>这些语言目标未进入本次题目</strong><p>${(candidate?.result.unmatchedGoals||lesson.generation.unmatchedGoals).map(esc).join('；')}</p></div>`:''}${!candidate?`<details class="optional-settings"><summary>课堂设置 <small>${activity.draft.settings.seconds} 秒思考 · ${activity.draft.settings.seated?'坐姿':'站姿'} · 音乐与音效${activity.draft.settings.sound?'开启':'关闭'}</small></summary>${renderSettings()}</details>`:''}`:`<div class="empty">${icon('book')}<p>生成后在题卡中核对和调整，无需逐题填写。</p>${lesson.categories.length?btn('新增题目','add-item',{icon:'plus'}):''}</div>`}</section>`;}
  function renderGroups(lesson){
    if(questionFilter!=='all'&&!lesson.categories.some(c=>c.id===questionFilter))questionFilter='all';
    const visible=lesson.items.filter(i=>questionFilter==='all'||i.categoryId===questionFilter||i.id===editingItemId);
    return `<section id="generated-groups" class="question-workspace" aria-label="题目预览与调整"><div class="question-workspace-heading"><div><h2>题目预览与调整</h2><p>拖动题号旁的手柄调整出题顺序，点击“编辑题目”修改内容。</p></div><div class="question-view-actions"><div class="preview-toggle" role="group" aria-label="题卡显示状态"><button type="button" data-action="live-mode" data-value="0" aria-pressed="${!liveAnswer}" class="${liveAnswer?'':'active'}">答题前</button><button type="button" data-action="live-mode" data-value="1" aria-pressed="${liveAnswer}" class="${liveAnswer?'active':''}">答题后</button></div>${btn('新增题目','add-item',{icon:'plus',small:true})}</div></div><div class="question-filters" role="group" aria-label="按分类筛选题目">${btn(`全部 <span>${lesson.items.length}</span>`,'filter-questions',{value:'all',small:true,variant:questionFilter==='all'?'primary':'ghost'})}${lesson.categories.map(c=>btn(`${esc(c.label)} <span>${lesson.items.filter(i=>i.categoryId===c.id).length}</span>`,'filter-questions',{value:c.id,small:true,variant:questionFilter===c.id?'primary':'ghost'})).join('')}</div><p id="question-sort-help" class="question-sr-only">拖拽手柄调整顺序；也可聚焦手柄后按方向键移动，按 Escape 取消拖拽。</p><div id="question-sort-status" class="question-sr-only" role="status" aria-live="polite"></div><div class="question-card-grid">${visible.map(i=>renderQuestionCard(i,lesson,visible.length)).join('')||'<div class="empty">该分类还没有题目，可点击“新增题目”。</div>'}</div></section>`;
  }
  const imageJobs=new Map();
  function imageControls(item,lesson){
    const busy=imageJobs.has(item.id),enabled=itemUsesImage(item,lesson);
    if(!enabled)return `<div class="mm-image-editor"><div class="mm-image-heading"><strong>题目图片</strong>${btn('添加图片','add-image',{id:item.id,small:true,icon:'plus'})}</div><p class="mm-image-help">本题为纯文字，可单独添加图片。</p></div>`;
    return `<div class="mm-image-editor"><div class="mm-image-heading"><strong>题目图片</strong>${btn('移除图片','remove-image',{id:item.id,small:true,variant:'ghost'})}</div><p class="mm-image-help">本题使用图文题卡，可根据题目生成图片，或上传替换。</p><label class="field wb-field">图片描述<textarea data-image-prompt="${esc(item.id)}" rows="2" maxlength="1000" placeholder="根据题目生成，可修改画面内容">${esc(item.imagePrompt||imagePrompt(item))}</textarea></label><div class="mini-actions">${btn(busy?'图片处理中…':item.imageOrigin?'重新生成图片':'AI 生成图片','generate-image',{id:item.id,small:true,disabled:busy||!(item.word||item.sentence||'').trim()})}<label class="mm-upload">${Art.source(item)?'上传替换':'上传图片'}<input type="file" accept="image/png,image/jpeg,image/webp" data-image-upload="${esc(item.id)}" ${busy?'disabled':''}></label></div>${item.imageError?`<p role="alert" class="mm-image-error">${esc(item.imageError)}</p>`:''}</div>`;
  }
  function imagePrompt(item){return `儿童英语教学卡片，清晰简洁的彩色插画，纯净背景，无文字、无答案。表现题目内容：${item.word||item.sentence||item.keyword||''}。${item.context||''}`;}
  async function imageRequest(url,options={}){
    const signal=AbortSignal.timeout(130000);
    let data;
    if(api) {
      data=await api.request(url,{...options,signal});
    } else {
      const token=localStorage.getItem('token');
      const headers={'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})};
      const response=await fetch(url,{...options,headers,signal,body:options.body&&JSON.stringify(options.body)});
      data=await response.json();
      if(!response.ok)throw Error(data.error||'图片生成失败，请重试或上传图片。');
    }
    if(data.success===false||data.status==='error')throw Error(data.error||'图片生成失败，请重试或上传图片。');
    return data;
  }
  async function requestQuestionImage(body,valid){
    if(api?.generateImage)return api.generateImage(body);
    const data=await imageRequest('/api/ai/generate-images',{method:'POST',body});
    if(data.url)return data.url;
    const task=data.tasks?.[0];
    if(!task?.promptId)throw Error('图片服务未返回生成任务，请重试。');
    const statusUrl=task.statusUrl||('/api/ai/task-status/'+encodeURIComponent(task.promptId)+'?workflowType=image&useComfyUI=true'+(task.apiUrl?'&apiUrl='+encodeURIComponent(task.apiUrl):''));
    for(let i=0;i<90&&valid();i++){
      await new Promise(resolve=>setTimeout(resolve,2000));
      if(!valid())return;
      const result=await imageRequest(statusUrl);if(result.status==='completed')return result.url;
    }
  }
  async function generateQuestionImage(item,lesson){
    if(!itemUsesImage(item,lesson)||imageJobs.has(item.id)||!(item.word||item.sentence||'').trim())return;
    const job={},original=item.word||item.sentence,originalPrompt=item.imagePrompt;imageJobs.set(item.id,job);delete item.imageError;refreshCurrent();
    const valid=()=>activity&&(editingLesson()===lesson||baseLesson()===lesson)&&lesson.items.includes(item)&&itemUsesImage(item,lesson)&&(item.word||item.sentence)===original&&item.imagePrompt===originalPrompt&&imageJobs.get(item.id)===job;
    try{
      const url=await requestQuestionImage({workflow_type:'scene',prompt:item.imagePrompt||imagePrompt(item),width:768,height:768,count:1},valid);
      if(!valid())return;
      if(typeof url!=='string'||!(/^(https?:\/\/|\/[^/]|data:image\/(png|jpeg|webp);base64,)/i.test(url)))throw Error('图片未生成完成，请稍后重试。');
      Object.assign(item,{imageUrl:url,art:null,imageOrigin:'ai',imageAlt:item.word||item.keyword||'题目配图'});delete item.imageError;markQuestionChange(lesson);
    }catch(error){if(valid()){item.imageError=error.message||'AI 服务暂不可用，请重试或上传图片。';markQuestionChange(lesson);}}
    finally{if(imageJobs.get(item.id)===job)imageJobs.delete(item.id);if(activity&&(editingLesson()===lesson||baseLesson()===lesson))refreshCurrent();}
  }
  async function generateLessonImages(lesson){
    for(const item of lesson.items){if(!activity||(editingLesson()!==lesson&&baseLesson()!==lesson))return;if(!itemUsesImage(item,lesson))continue;await generateQuestionImage(item,lesson);if(item.imageError)break;}
  }
  async function uploadQuestionImage(input){
    const lesson=editingLesson(),item=lesson.items.find(i=>i.id===input.dataset.imageUpload),file=input.files?.[0];
    if(!item||!file||!itemUsesImage(item,lesson)||imageJobs.has(item.id))return;
    const job={},original=item.word||item.sentence;
    const valid=()=>activity&&editingLesson()===lesson&&lesson.items.includes(item)&&itemUsesImage(item,lesson)&&imageJobs.get(item.id)===job&&(item.word||item.sentence)===original;
    try{
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw Error('请上传 10 MB 以内的 PNG、JPG 或 WebP 图片。');
      imageJobs.set(item.id,job);refreshCurrent();
      const bitmap=await createImageBitmap(file);
      const scale=Math.min(1,768/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
      if(!valid())return;
      let url;
      if(api?.upload&&!api.offline){
        const image=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
        if(!image)throw Error('图片无法转换，请更换文件。');
        if(!valid())return;
        const baseName=file.name.replace(/\.[^.]*$/,'');
        const filename=`${baseName}.png`;
        url=await api.upload(image,'classification-question-images',{filename});
      }else url=canvas.toDataURL('image/png');
      if(!valid())return;
      Object.assign(item,{imageUrl:url,art:null,imageOrigin:'upload',imageAlt:item.word||item.keyword||file.name});delete item.imageError;markQuestionChange(lesson);
    }catch(error){if(!imageJobs.has(item.id)||valid())toast(error.message||'图片无法读取，请更换文件。');}
    finally{if(imageJobs.get(item.id)===job)imageJobs.delete(item.id);if(activity&&editingLesson()===lesson)refreshCurrent();}
  }

  function renderQuestionCard(item,lesson,visibleCount=lesson.items.length){
    const category=lesson.categories.find(c=>c.id===item.categoryId),number=lesson.items.indexOf(item)+1,menuId=`question-menu-${item.id}`;
    return `<article class="question-card" data-item-id="${esc(item.id)}"><div class="question-overview"><header class="question-meta"><button type="button" class="question-drag-handle" data-sort-id="${esc(item.id)}" aria-label="拖拽调整第 ${number} 题顺序" aria-describedby="question-sort-help" title="拖拽调整顺序" ${visibleCount<2?'disabled':''}>${icon('grip')}</button><span class="question-number">${String(number).padStart(2,'0')}</span><span class="badge question-category">${esc(category?.label||'未分类')}</span><div class="question-more"><button type="button" class="question-more-trigger" data-action="question-more" data-id="${esc(item.id)}" aria-haspopup="menu" aria-expanded="false" aria-controls="${esc(menuId)}" aria-label="第 ${number} 题更多操作" title="更多操作">${icon('more')}</button><div id="${esc(menuId)}" class="question-more-menu" role="menu" aria-label="第 ${number} 题操作" hidden><button type="button" role="menuitem" data-action="copy-item" data-id="${esc(item.id)}">${icon('copy')}复制</button><button type="button" role="menuitem" data-action="delete-item" data-id="${esc(item.id)}" class="is-danger">${icon('trash')}删除</button></div></div></header><div class="question-card-preview">${renderTaskPreview(item,lesson)}${item.imageError?`<p class="mm-image-error" role="alert">${esc(item.imageError)}</p>`:''}${imageJobs.has(item.id)?'<p role="status">正在生成题目图片…</p>':''}</div><div class="question-card-controls"><span class="small-label">${candidate?'候选内容':'草稿内容'} · ${esc(questionStatus(item,lesson))}</span>${btn('编辑题目','edit-item',{id:item.id,small:true})}</div></div></article>`;
  }
  function closeQuestionMenu(restore=false){
    if(!questionMenu)return;
    const {trigger,menu}=questionMenu;questionMenu=null;
    menu.hidden=true;trigger.setAttribute('aria-expanded','false');
    trigger.closest('.question-card')?.classList.remove('is-menu-open');
    if(restore&&trigger.isConnected)trigger.focus({preventScroll:true});
  }
  function openQuestionMenu(trigger,last=false){
    if(questionMenu?.trigger===trigger){closeQuestionMenu(true);return;}
    closeQuestionMenu();
    const menu=trigger.parentElement.querySelector('.question-more-menu');if(!menu)return;
    questionMenu={trigger,menu};menu.hidden=false;menu.classList.remove('opens-up');
    trigger.setAttribute('aria-expanded','true');trigger.closest('.question-card').classList.add('is-menu-open');
    if(menu.getBoundingClientRect().bottom>window.innerHeight-16)menu.classList.add('opens-up');
    const items=menu.querySelectorAll('[role="menuitem"]');items[last?items.length-1:0]?.focus({preventScroll:true});
  }
  function announceQuestionSort(message){
    const status=document.querySelector('#question-sort-status');if(status)status.textContent=message;
  }
  function moveQuestion(sourceId,targetId,after,keyboard=false){
    if(!activity||questionEdit||modal.open)return false;
    const lesson=baseLesson(),next=M.reorderItems(lesson.items,sourceId,targetId,after);
    if(next===lesson.items)return false;
    lesson.items=next;markQuestionChange(lesson);refreshCurrent();
    const handle=document.querySelector(`.question-drag-handle[data-sort-id="${CSS.escape(sourceId)}"]`);
    handle?.focus({preventScroll:true});if(keyboard)handle?.closest('.question-card').scrollIntoView({block:'nearest'});
    announceQuestionSort(`已移至第 ${next.findIndex(item=>item.id===sourceId)+1} 题。${candidate?'采用后保存题目顺序。':'题目顺序已更新。'}`);
    return true;
  }
  function clearQuestionDropTarget(drag){
    drag.target?.classList.remove('is-drop-before','is-drop-after');drag.target=null;
  }
  function updateQuestionDropTarget(){
    const drag=questionDrag;if(!drag?.started)return;
    clearQuestionDropTarget(drag);
    if(!drag.grid.isConnected){finishQuestionDrag(false);return;}
    const bounds=drag.grid.getBoundingClientRect(),x=drag.x,y=drag.y;
    if(x<bounds.left||x>bounds.right||y<bounds.top||y>bounds.bottom||y<0||y>window.innerHeight)return;
    const cards=[...drag.grid.querySelectorAll('.question-card')];
    const hit=document.elementFromPoint(x,y)?.closest('.question-card');
    if(hit===drag.card)return;
    let nearest=null,distance=Infinity;
    for(const card of cards){
      if(card===drag.card)continue;
      const r=card.getBoundingClientRect();
      const dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom),d=dx*dx+dy*dy;
      if(d<distance){distance=d;nearest=card;}
    }
    if(!nearest)return;
    const r=nearest.getBoundingClientRect(),oneColumn=r.width>bounds.width*.75;
    drag.after=oneColumn?y>r.top+r.height/2:y>r.bottom?true:y<r.top?false:x>r.left+r.width/2;
    drag.target=nearest;drag.grid.dataset.sortLayout=oneColumn?'rows':'columns';
    nearest.classList.add(drag.after?'is-drop-after':'is-drop-before');
  }
  function animateQuestionDrag(){
    const drag=questionDrag;if(!drag?.started)return;
    drag.ghost.style.transform=`translate3d(${drag.x-drag.offsetX}px,${drag.y-drag.offsetY}px,0) rotate(1deg)`;
    const edge=72,limit=window.innerHeight-72;
    const delta=drag.y<edge?-Math.min(17,(edge-drag.y)*.24):drag.y>limit?Math.min(17,(drag.y-limit)*.24):0;
    if(delta)window.scrollBy(0,delta);
    updateQuestionDropTarget();
    if(questionDrag===drag)drag.frame=requestAnimationFrame(animateQuestionDrag);
  }
  function startQuestionDrag(event){
    const handle=event.target.closest('.question-drag-handle');
    if(questionMenu&&!event.target.closest('.question-more'))closeQuestionMenu();
    if(!handle||handle.disabled||event.button!==0||event.isPrimary===false||questionDrag||questionEdit||modal.open||!activity)return;
    if(!flush())return;
    closeQuestionMenu();
    const card=handle.closest('.question-card'),rect=card.getBoundingClientRect(),lesson=baseLesson();
    questionDrag={handle,card,grid:card.closest('.question-card-grid'),id:handle.dataset.sortId,pointerId:event.pointerId,
      lesson,order:lesson.items.map(i=>i.id).join('\0'),activityId:activity.id,x:event.clientX,y:event.clientY,
      startX:event.clientX,startY:event.clientY,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top,started:false};
    handle.setPointerCapture(event.pointerId);
  }
  function trackQuestionDrag(event){
    const drag=questionDrag;if(!drag||event.pointerId!==drag.pointerId)return;
    drag.x=event.clientX;drag.y=event.clientY;
    if(!drag.started&&Math.hypot(drag.x-drag.startX,drag.y-drag.startY)<6)return;
    event.preventDefault();
    if(!drag.started){
      drag.started=true;stopReading();
      const rect=drag.card.getBoundingClientRect(),ghost=drag.card.cloneNode(true);
      ghost.className='question-card question-drag-ghost';ghost.setAttribute('aria-hidden','true');ghost.inert=true;
      ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
      ghost.style.width=`${rect.width}px`;drag.ghost=ghost;document.body.append(ghost);
      drag.card.classList.add('is-dragging');document.body.classList.add('is-sorting-questions');
      announceQuestionSort('正在拖动题目，松开调整顺序，按 Escape 取消。');
      animateQuestionDrag();
    }
  }
  function finishQuestionDrag(commit=false){
    const drag=questionDrag;if(!drag)return;questionDrag=null;
    if(drag.frame)cancelAnimationFrame(drag.frame);
    const targetId=drag.target?.dataset.itemId,valid=activity?.id===drag.activityId&&baseLesson()===drag.lesson&&drag.lesson.items.map(i=>i.id).join('\0')===drag.order;
    clearQuestionDropTarget(drag);drag.ghost?.remove();drag.card.classList.remove('is-dragging');
    document.body.classList.remove('is-sorting-questions');
    if(drag.handle.hasPointerCapture(drag.pointerId))drag.handle.releasePointerCapture(drag.pointerId);
    if(!drag.started)return;
    suppressCardClickUntil=Date.now()+250;
    if(commit&&valid&&targetId&&moveQuestion(drag.id,targetId,drag.after))return;
    if(drag.handle.isConnected)drag.handle.focus({preventScroll:true});
    announceQuestionSort('题目顺序未改变。');
  }
  function questionControlsKey(event){
    if(questionDrag&&event.key==='Escape'){event.preventDefault();finishQuestionDrag(false);return true;}
    if(questionMenu){
      const {menu,trigger}=questionMenu,items=[...menu.querySelectorAll('[role="menuitem"]')];
      if(event.key==='Escape'){event.preventDefault();closeQuestionMenu(true);return true;}
      if(event.key==='Tab'){closeQuestionMenu(true);return false;}
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();const current=items.indexOf(document.activeElement);
        const next=event.key==='Home'?0:event.key==='End'?items.length-1:(current+(event.key==='ArrowDown'?1:-1)+items.length)%items.length;
        items[next]?.focus();return true;
      }
      if(!trigger.parentElement.contains(event.target))closeQuestionMenu();
    }
    const trigger=event.target.closest('.question-more-trigger');
    if(trigger&&['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();openQuestionMenu(trigger,event.key==='ArrowUp');return true;}
    const handle=event.target.closest('.question-drag-handle');
    if(!handle||handle.disabled||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return false;
    event.preventDefault();if(questionDrag||!flush())return true;
    const visible=[...handle.closest('.question-card-grid').querySelectorAll('.question-card')],index=visible.indexOf(handle.closest('.question-card'));
    const forward=['ArrowDown','ArrowRight'].includes(event.key),target=visible[index+(forward?1:-1)];
    if(target)moveQuestion(handle.dataset.sortId,target.dataset.itemId,forward,true);
    else announceQuestionSort(forward?'已是当前列表最后一题。':'已是当前列表第一题。');
    return true;
  }
  function taskSentence(item,lesson){
    if(lesson.mode==='word-sort')return esc(item.word||'待填写词卡');
    const parts=(item.sentence||'').split('___');if(parts.length<2)return esc(item.sentence||'待填写句子');
    let answer=item.answerText||'';if(!parts[0].trim()&&answer)answer=answer[0].toUpperCase()+answer.slice(1);
    return esc(parts[0])+(liveAnswer&&!questionEdit&&!needsLinkReview(item)?(answer?`<mark class="question-inserted">${esc(answer)}</mark>`:''):'<span class="question-blank" aria-label="blank">?</span>')+esc(parts.slice(1).join('___'));
  }
  function renderTaskPreview(item,lesson){
    // A removed picture must not inherit the old baseline's pending state.
    const enabled=itemUsesImage(item,lesson),currentSource=enabled?Art.source(item):'',stale=!!currentSource&&stalePicture(item,lesson),src=stale?'':currentSource,placeholder=enabled&&!currentSource,unresolved=needsLinkReview(item),context=unresolved?'':Context.text(item,lesson);
    return `<div class="question-task ${src||stale||placeholder?'':'is-text-only'} ${liveAnswer&&!questionEdit&&!unresolved?'is-resolved':''}">${stale?'<div class="question-picture picture-pending"><span>配图待同步</span></div>':src?`<div class="question-picture"><img class="question-art" src="${esc(src)}" alt="${esc(item.imageAlt||item.keyword||item.word||'题目配图')}" onerror="this.hidden=true;this.parentElement.classList.add('image-unavailable')"><span class="image-fallback">图片暂时无法显示</span></div>`:placeholder?`<div class="question-picture picture-placeholder" role="img" aria-label="图片占位，生成或上传图片后显示">${icon('image')}<span>${imageJobs.has(item.id)?'图片处理中…':'图片占位'}</span><small>生成或上传图片后显示</small></div>`:''}<div class="question-task-copy">${context?`<p class="question-context">${esc(context)}</p>`:''}<p class="question-sentence">${taskSentence(item,lesson)}</p>${liveAnswer&&!questionEdit&&!unresolved&&item.explanation?`<p class="question-feedback">${esc(item.explanation)}</p>`:''}</div>${btn('','read-item',{id:item.id,icon:'sound',small:true,title:readingItemId===item.id?'停止朗读':'朗读题目'})}</div>`;
  }
  function stopReading(){if(readingItemId&&window.speechSynthesis)window.speechSynthesis.cancel();readingItemId=null;}
  function readQuestion(id){
    if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){toast('当前浏览器不支持朗读。');return;}
    if(readingItemId===id){stopReading();updateLive();return;}
    const lesson=editingLesson(),item=lesson.items.find(i=>i.id===id);if(!item)return;
    stopReading();const context=needsLinkReview(item)?'':Context.text(item,lesson),text=lesson.mode==='word-sort'?item.word:liveAnswer&&!questionEdit&&!needsLinkReview(item)?complete(item):(context?context+' ':'')+(item.sentence||'').replace('___','blank');
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.rate=.85;readingItemId=id;
    const finish=()=>{if(readingItemId===id){readingItemId=null;if(page==='editor'&&!currentLaunch)updateLive();}};utterance.onend=finish;utterance.onerror=finish;window.speechSynthesis.speak(utterance);updateLive();
  }
  function adoptCandidate(){
    if(!candidate)return;if(!pendingAdoption&&!flush())return;
    if(candidate.activityId!==activity.id||candidate.revision!==activity.revision||candidate.inputSignature!==M.preparationSignature(preparation())){candidate=null;pendingAdoption=false;toast('生成条件或草稿已变化，请重新生成后采用。');renderEditor();return;}
    const errors=validationErrors(candidate.result.lesson,activity.draft.settings);if(errors.length){dialog('先补齐候选题目',`<ul class="validation-list">${errors.map(e=>`<li>${btn(esc(e.message),'locate-error',{id:e.itemId||'',value:e.field})}</li>`).join('')}</ul>`);return;}
    const proposed={lesson:clone(candidate.result.lesson),settings:clone(activity.draft.settings)},editor={...editorState(),selectedItemId:proposed.lesson.items[0]?.id};
    try{activity=repo.saveDraft(activity.id,proposed,editor,candidate.revision);candidate=null;pendingAdoption=false;pending=false;saveError=null;renderEditor();toast('已采用为草稿，可预览或确认授课版。');}
    catch(e){pendingAdoption=true;localError(e);}
  }


  function renderQuestionFields(){
    const item=currentItem(),lesson=editingLesson();if(!item)return '';
    return `<div class="question-fields">${lesson.mode==='word-sort'?field('题目词卡','word',item.word,{maxlength:100,hint:'必填，例如 cat。'}):field('题目句子','sentence',item.sentence,{textarea:true,hint:'必填，用一个 ___ 表示填空。'})}<div class="field wb-field"><label for="f-categoryId">正确分类</label><select id="f-categoryId" data-field="categoryId" data-ui="field"><option value="">请选择分类</option>${lesson.categories.map(c=>`<option value="${esc(c.id)}" ${c.id===item.categoryId?'selected':''}>${esc(c.label)}</option>`).join('')}</select></div>${imageControls(item,lesson)}</div>`;
  }
  function complete(item){if(item.type==='word-sort')return item.word||'';let text=(item.sentence||'').replace('___',item.answerText||'').replace(/ {2,}/g,' ').trim();return text?text[0].toUpperCase()+text.slice(1):'填写句子后，这里会显示补全结果。';}

  function pose(action,seated){const arms={left:'M28 23 14 11 9 2M28 23 41 34',right:'M28 23 41 11 47 2M28 23 14 34',both:'M28 23 14 11 9 2M28 23 41 11 47 2',squat:seated?'M28 23 16 34 17 45M28 23 40 34 39 45':'M28 23 15 31 12 25M28 23 41 31 44 25'};return `<svg class="pose-drawing" viewBox="0 0 56 65" aria-hidden="true"><circle cx="28" cy="12" r="6"/><path d="M28 18v24${action==='squat'?'m0 0-12 7 6 12M28 42l12 7-6 12':'m0 0-11 18M28 42l11 18'}${arms[action]||arms.both}"/></svg>`;}
  function renderSettings(){const settings=activity.draft.settings;return `<div class="settings-layout"><section class="settings-panel"><h2>课堂节奏</h2><div class="setting-section"><div class="range-heading"><label for="f-seconds">每题思考时间</label><output id="seconds-output">${settings.seconds} 秒</output></div><input type="range" data-ui="range" data-field="seconds" id="f-seconds" min="3" max="12" step="1" value="${settings.seconds}"><div class="range-labels"><span>3 秒</span><span>12 秒</span></div><p>倒计时内可纠正动作，答对立即归类并标记成功；到时间仍未答对，会自动归类并标记未成功。</p></div><div class="setting-section"><h3>动作方式</h3><div class="choice-pair">${btn('站姿','seated',{value:'false',variant:settings.seated?'':'primary'})}${btn('坐姿','seated',{value:'true',variant:settings.seated?'primary':''})}</div><p>一轮内保持分类与动作对应一致。</p></div><div class="setting-section"><label class="check-label"><input data-ui="check" type="checkbox" id="f-sound" data-field="sound" ${settings.sound?'checked':''}>进入课堂时开启背景音乐与音效</label><p>点击开始后播放预设游戏音乐，随答题速度变化；卡片落框和答错时播放提示音。朗读或暂停时音乐暂停，课堂中可随时静音。</p></div><div class="setting-section"><h3>沿用现有课堂玩法</h3><div class="classroom-flow"><span>读题</span><span>→</span><span>动作选分类</span><span>→</span><span>结果与归类</span><span>→</span><span>完成后复习</span></div><p>答错后可在剩余时间内纠正；超时仍未答对则自动归入正确分类，标记未成功。支持暂停、重开、全屏与分类复习。</p></div></section><section class="settings-panel"><h2>分类与动作</h2><div class="moves-list">${activity.draft.lesson.categories.map(c=>`<div class="move-row">${pose(c.action,settings.seated)}<div><div class="pose-label"><strong>${esc(c.label)}</strong><span>${esc(actionName(c.action,settings.seated))}</span></div><p class="move-rule">${esc(c.rule)}</p></div></div>`).join('')}</div><div class="simulation-info">${icon('info')}<span>当前为动作模拟，未使用摄像头。预览中的“模拟演示”可检查纠错、离开后返回与超时归类。</span></div><div style="margin-top:18px">${btn('预览课堂与模拟演示','preview',{icon:'play'})}</div></section></div>`;}
  function refreshCurrent(focus=false){
    closeQuestionMenu();finishQuestionDrag(false);
    if(questionEdit){renderQuestionDialog();return;}
    const group=document.querySelector('#generated-groups');if(group)group.outerHTML=renderGroups(editingLesson());else renderEditor();
    if(focus){const input=document.querySelector(editingLesson().mode==='word-sort'?'#f-word':'#f-sentence');input?.focus({preventScroll:true});document.querySelector('.question-card.is-editing')?.scrollIntoView({block:'nearest'});}
  }
  function updateLive(){
    if(!activity||page!=='editor')return;const lesson=editingLesson();
    if(questionEdit){const preview=document.querySelector('#question-edit-preview');if(preview)preview.innerHTML=renderTaskPreview(currentItem(),lesson);const label=document.querySelector('#question-edit-category');if(label)label.textContent='正确分类：'+(lesson.categories.find(c=>c.id===currentItem().categoryId)?.label||'未选择');const status=document.querySelector('.mm-editor-status');if(status)status.textContent=imageJobs.has(questionEdit.id)?'图片正在处理，请稍候':'有未保存的修改';const save=document.querySelector('[data-action="save-question"]');if(save)save.disabled=imageJobs.has(questionEdit.id);const generate=document.querySelector('[data-action="generate-image"]');if(generate){generate.disabled=imageJobs.has(questionEdit.id)||!(currentItem().word||currentItem().sentence||'').trim();generate.textContent=imageJobs.has(questionEdit.id)?'图片处理中…':currentItem().imageOrigin?'重新生成图片':'AI 生成图片';}const prompt=document.querySelector('[data-image-prompt]');if(prompt&&!currentItem().imagePrompt)prompt.value=imagePrompt(currentItem());const errors=document.querySelector('#question-edit-errors');if(errors)errors.hidden=true;document.querySelectorAll('.mm-question-form [aria-invalid]').forEach(node=>node.removeAttribute('aria-invalid'));return;}
    document.querySelectorAll('.question-card').forEach(card=>{const item=lesson.items.find(i=>i.id===card.dataset.itemId);if(!item)return;const area=card.querySelector('.question-card-preview');if(area)area.innerHTML=renderTaskPreview(item,lesson);const category=lesson.categories.find(c=>c.id===item.categoryId);card.querySelector('.question-category').textContent=category?.label||'未分类';card.querySelector('.question-card-controls>.small-label').textContent=`${candidate?'候选内容':'草稿内容'} · ${questionStatus(item,lesson)}`;const slot=card.querySelector('.linked-status-slot');if(slot){const html=renderLinkedStatus(item,lesson);if(slot.dataset.rendered!==html){slot.innerHTML=html;slot.dataset.rendered=html;}}const finish=card.querySelector('[data-action=finish-item]');if(finish)finish.disabled=linkState(item)==='review';});
    document.querySelectorAll('[data-action="live-mode"]').forEach(button=>{const selected=(button.dataset.value==='1')===liveAnswer;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));});
    document.querySelectorAll('[data-action="filter-questions"]').forEach(button=>{const count=button.querySelector('span');if(count)count.textContent=button.dataset.value==='all'?lesson.items.length:lesson.items.filter(i=>i.categoryId===button.dataset.value).length;});
  }
  function dialog(title,body,footer){modal.classList.add('wb-dialog');if(!modal.open)restoreFocus=document.activeElement;modal.innerHTML=`<header class="dialog-header wb-dialog-heading"><h2 id="dialog-title">${title}</h2>${btn('','close-modal',{icon:'close',variant:'ghost',title:'关闭弹窗'})}</header><div class="dialog-body">${body}</div><footer class="dialog-footer wb-dialog-actions">${footer||btn('知道了','close-modal')}</footer>`;if(!modal.open)modal.showModal();}
  function closeDialog(){if(questionEdit){requestQuestionClose();return;}modal.close();restoreFocus?.isConnected&&restoreFocus.focus();}
  function validateForRun(){const errors=validationErrors(activity.draft.lesson,activity.draft.settings);if(!errors.length)return true;dialog('先补齐这些内容',`<p>草稿可以继续保存，整课预览和确认授课版需要完整题目。</p><ul class="validation-list">${errors.map(e=>`<li>${btn(esc(e.message),'locate-error',{id:e.itemId||'',value:e.field,icon:'arrow'})}</li>`).join('')}</ul>`);return false;}
  function showReview(){if(!flush()||!validateForRun())return;const lesson=activity.draft.lesson,settings=activity.draft.settings;const emptyGroups=lesson.categories.filter(c=>!lesson.items.some(i=>i.categoryId===c.id));dialog('核对并确认授课版',`<p>确认后保存独立授课内容。之后修改草稿，不会改变这份授课版。</p><h3 style="margin-bottom:14px">${esc(lesson.title)}</h3><div class="review-summary"><span class="badge">${lesson.items.length} 题</span><span class="badge">思考 ${settings.seconds} 秒</span><span class="badge">${settings.seated?'坐姿':'站姿'}</span><span class="badge">音乐与音效${settings.sound?'开启':'关闭'}</span><span class="badge simulation">动作模拟</span></div><div class="review-summary">${lesson.categories.map(c=>`<span>${esc(c.label)}：${esc(actionName(c.action,settings.seated))}</span>`).join(' / ')}</div>${emptyGroups.length?`<p class="small-label">${emptyGroups.map(c=>esc(c.label)).join("、")} 暂无题目，可返回补充，也可按现有题目授课。</p>`:""}<table class="review-table"><thead><tr><th>题目内容 / 语境</th><th>分类</th><th>收集卡</th><th></th></tr></thead><tbody>${lesson.items.map((i,n)=>`<tr><td>${n+1}. ${esc(complete(i))}${Context.text(i,lesson)?`<small>${esc(Context.text(i,lesson))}</small>`:''}</td><td>${esc(lesson.categories.find(c=>c.id===i.categoryId)?.label)}</td><td>${esc(i.archiveText)}</td><td>${btn('修改','review-edit',{id:i.id,small:true,variant:'ghost'})}</td></tr>`).join('')}</tbody></table>`,`${btn('返回编辑','close-modal')}${btn('确认授课版','confirm',{variant:'primary',icon:'check'})}`);}
  function confirmRelease(){try{activity=repo.confirm(activity.id,activity.revision);const r=activeRelease(activity);renderEditor();dialog('授课版已确认',`<div class="confirmed-message"><div class="success-mark">${icon('check')}</div><h3>${esc(r.lesson.title)} · v${r.number}</h3><p>内容和课堂设置已独立保存，可以进入课堂待开始画面。</p><p class="small-label">当前仍为动作模拟，未使用摄像头。</p></div>`,`${btn('返回编辑','close-modal')}${btn('进入授课','start-release',{id:activity.id,value:r.id,variant:'primary',icon:'play'})}`);}catch(e){closeDialog();localError(e);}}
  function chooseRelease(id){if(activity&&!flush())return;const a=repo.get(id);if(!a?.releases.length)return;dialog('选择授课版',`${M.isDirty(a)?'<p>草稿有未确认修改。下面的授课版保持各自确认时的内容。</p>':'<p>选择一个已确认版本，开始一轮新的课堂。</p>'}<div class="version-list">${[...a.releases].reverse().map(r=>`<div class="version-row"><div><strong>v${r.number} · ${esc(r.lesson.title)}</strong><p>${r.lesson.items.length} 题 · ${formatDate(r.createdAt)} 确认</p></div>${btn('开始新课堂','start-release',{id:a.id,value:r.id,variant:r.id===a.activeReleaseId?'primary':'',icon:'play'})}</div>`).join('')}</div>`,`${btn('返回','close-modal')}${M.isDirty(a)?btn('核对修改并更新授课版','review-activity',{id:a.id,variant:'primary'}):''}`);}
  function sendStage(type){if(currentLaunch)document.querySelector('#classroom-frame')?.contentWindow?.postMessage({type,token:currentLaunch.token},location.origin);}
  function launch(mode,lesson,settings,session=null,templateId=null){
    if(activity&&!flush())return false;stopReading();if(!saveEditor())return false;if(modal.open)closeDialog();
    const launchLesson=clone(lesson);launchLesson.items.forEach(item=>{if(!itemUsesImage(item,launchLesson))clearQuestionImage(item);});
    const pack={schemaVersion:1,token:uid(),mode,lesson:launchLesson,settings:clone(settings),progress:session?.progress?clone(session.progress):null};
    const context={...pack,sessionId:session?.id||null,sessionRevision:session?.revision||1,templateId,scrollY:window.scrollY,ready:false,pauseRequested:!platformVisible||document.hidden};
    try{sessionStorage.setItem(('wellbeing-web-three-v1-'+window.WB_WEB_SCOPE+'-external-move-match-'+"move-match-v1:launch:")+pack.token,JSON.stringify(pack));}catch(e){toast('无法建立临时预览，请检查浏览器存储空间。');return false;}
    currentLaunch=context;renderStage();return true;
  }
  function renderStage(){
    const r=currentLaunch;r.ready=false;app.inert=true;document.body.style.overflow='hidden';stage.hidden=false;
    const modeName=r.mode==='classroom'?'授课':r.mode==='preview'?'备课预览':'案例预览';
    stage.innerHTML=`<header class="stage-header"><div class="stage-heading"><span class="badge">${modeName}</span><strong>${esc(r.lesson.title)}</strong><span class="stage-card-count">共 ${r.lesson.items.length} 张卡片</span><span class="badge simulation">动作判定：模拟</span></div><div class="stage-header-actions">${r.mode==='example'?`<label class="stage-question-count" for="preview-question-count"><span>总题数</span><select id="preview-question-count" data-ui="field" title="切换题数后重新开始案例预览">${questionCountOptions(r.lesson.items.length)}</select></label>`:''}${r.mode==='example'&&!suspendedLaunch?btn('制作同款','create-from-preview',{id:r.templateId,variant:'primary'}):''}${r.mode==='classroom'?btn('结束本次课堂','end-class',{variant:'ghost'}):''}${btn(suspendedLaunch?'返回原课堂':r.mode==='classroom'?'退出并保存进度':page==='editor'?'返回编辑':'返回案例库','exit-stage',{icon:'back'})}</div></header><div class="error-banner" id="stage-save-error" hidden role="alert"></div><div class="stage-frame-wrap"><div class="stage-loading" id="stage-loading">正在载入课堂…</div><iframe class="stage-frame" id="classroom-frame" title="${modeName}：${esc(r.lesson.title)}" src="classroom/index.html?launch=${encodeURIComponent(r.token)}" allow="camera; fullscreen" allowfullscreen></iframe></div>`;
    clearTimeout(launchTimer);launchTimer=setTimeout(()=>{const n=document.querySelector('#stage-loading');if(n)n.innerHTML=`<div><p>课堂尚未准备好，请重试加载。</p>${btn('重新加载课堂','reload-stage')}${btn('返回','exit-stage')}</div>`;},15000);
    if(r.saveError)showStageSaveError(r.saveError);
  }
  function showStageSaveError(error){
    const area=document.querySelector('#stage-save-error');if(!area)return;
    area.hidden=false;const signature=`${error.code}:${error.message}`;if(area.dataset.errorSignature===signature)return;area.dataset.errorSignature=signature;
    area.innerHTML=`<div><strong>${error.code==='CONFLICT'?'这轮课堂已在另一页更新':'课堂进度尚未保存'}</strong><p>${esc(error.message||'请保留页面，重试或导出当前进度。')}</p></div><div class="error-actions">${error.code==='CONFLICT'?btn('载入已保存进度','reload-session'):btn('重试保存进度','retry-progress')}${btn('导出当前进度','export-progress')}</div>`;
  }
  function saveLaunchProgress(run){
    try{
      const pack={schemaVersion:1,token:run.token,mode:run.mode,lesson:clone(run.lesson),settings:clone(run.settings),progress:run.progress?clone(run.progress):null};
      sessionStorage.setItem(('wellbeing-web-three-v1-'+window.WB_WEB_SCOPE+'-external-move-match-'+"move-match-v1:launch:")+run.token,JSON.stringify(pack));run.tempError=null;return true;
    }catch(error){run.tempError=error;return false;}
  }
  function persistProgress(run,progress){
    run.progress=clone(progress);
    if(run.mode==='classroom'){
      try{const saved=repo.saveProgress(run.sessionId,progress,run.sessionRevision);run.sessionRevision=saved.revision;run.saveError=null;if(run===currentLaunch){const area=document.querySelector('#stage-save-error');if(area)area.hidden=true;}}
      catch(e){const first=!run.saveError;run.saveError=e;if(run===currentLaunch)showStageSaveError(e);if(first){toast(run===currentLaunch?'课堂进度未保存，当前画面已保留。':'原课堂进度未保存，请返回原课堂处理。');sendStage('move-match:pause');}}
    }
    if(!saveLaunchProgress(run))toast('临时进度未能保存，请保留当前页面后重试。');
    return !run.saveError&&!run.tempError;
  }
  function capturePausedProgress(){
    const run=currentLaunch;if(!run)return Promise.resolve(true);
    run.pauseRequested=true;if(!run.ready)return Promise.resolve(true);
    if(run.pauseCapture)return run.pauseCapture;
    run.pauseCapture=new Promise(resolve=>{const timer=setTimeout(()=>{progressWaiters.delete(run.token);resolve(false);},2500);progressWaiters.set(run.token,()=>{clearTimeout(timer);progressWaiters.delete(run.token);resolve(true);});sendStage('move-match:pause');sendStage('move-match:request-progress');}).finally(()=>{run.pauseCapture=null;});
    return run.pauseCapture;
  }
  function pauseForPlatform(){
    stopReading();
    if(currentLaunch){currentLaunch.pauseRequested=true;sendStage('move-match:pause');sendStage('move-match:request-progress');}
  }
  function prepareModuleSwitch(){
    if(questionEdit){toast('请先保存或取消当前题目的编辑。');return Promise.resolve(false);}
    if(switchPreparation)return switchPreparation;
    switchPreparation=Promise.resolve().then(async()=>{
      if(!repo)return !activity&&!currentLaunch&&!candidate&&!pending;
      if(closingStage)return false;
      commitGoal();
      if(!flush())return false;
      if(activity){
        const fresh=repo.get(activity.id);
        if(!fresh||fresh.revision!==activity.revision){const error=new Error('另一页保存了新内容，请先处理保存冲突。');error.code='CONFLICT';localError(error);return false;}
      }
      if(!saveEditor())return false;
      stopReading();
      const run=currentLaunch;
      if(run){
        const captured=await capturePausedProgress();
        if(currentLaunch!==run)return false;
        if(!captured){toast('还未收到最新课堂进度，请稍后重试切换。');return false;}
        if(run.saveError||run.tempError){toast('课堂进度尚未保存，请重试或返回处理。');return false;}
      }
      if(suspendedLaunch?.progress&&!persistProgress(suspendedLaunch,{...suspendedLaunch.progress,paused:true}))return false;
      return !saveError && (!cloud || await cloud.flush());
    }).catch(error=>{if(activity)localError(error);else toast(error.message||'离开检查未完成，请重试。');return false;}).finally(()=>{switchPreparation=null;});
    return switchPreparation;
  }
  window.WBPrepareModuleSwitch=prepareModuleSwitch;
  window.WBPauseForModuleSwitch=pauseForPlatform;
  async function exitStage(end=false){
    if(!currentLaunch||closingStage)return;closingStage=true;
    const captured=await capturePausedProgress();closingStage=false;
    if(!captured&&currentLaunch?.mode==='classroom'){toast('还未收到最新课堂进度，请稍后重试退出。');return;}
    if(currentLaunch.mode==='classroom'&&currentLaunch.progress&&!persistProgress(currentLaunch,currentLaunch.progress))return;
    if(currentLaunch.mode==='classroom'&&end){try{const saved=repo.endSession(currentLaunch.sessionId,currentLaunch.sessionRevision);currentLaunch.sessionRevision=saved.revision;}catch(e){currentLaunch.saveError=e;showStageSaveError(e);return;}}
    if(suspendedLaunch&&!saveLaunchProgress(suspendedLaunch)){toast('原课堂的临时进度尚未保存，请重试返回。');return;}
    const old=currentLaunch;clearTimeout(launchTimer);currentLaunch=null;stage.replaceChildren();stage.hidden=true;app.inert=false;document.body.style.overflow='';try{sessionStorage.removeItem(('wellbeing-web-three-v1-'+window.WB_WEB_SCOPE+'-external-move-match-'+"move-match-v1:launch:")+old.token);}catch{}
    if(suspendedLaunch){currentLaunch=suspendedLaunch;suspendedLaunch=null;renderStage();return;}
    if(page==='library')renderLibrary();else if(activity){activity=repo.get(activity.id)||activity;renderEditor();}
    window.scrollTo(0,old.scrollY||0);
  }
  function handleCaseRequest(lessonId){if(!currentLaunch)return;const template=templates.find(t=>t.id===lessonId);if(!template)return;sendStage('move-match:pause');dialog('打开其他案例预览？','<p>当前轮次已暂停。新案例将在独立试玩中打开，不会改写当前活动或授课版。关闭试玩后可返回原轮次。</p>',`${btn('留在当前课堂','cancel-case')}${btn('打开案例预览','switch-case',{id:lessonId,variant:'primary'})}`);}
  function exportJSON(value,name){const blob=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function action(name,node){
    const id=node?.dataset.id,value=node?.dataset.value;
    if(questionEdit&&!['save-question','cancel-item','close-modal','continue-question','add-image','remove-image','generate-image','read-item','live-mode'].includes(name)){toast('请先保存或取消当前题目。');return;}
    if(candidate?.edited&&(['home','generate','reload-activity','new-activity','reload-page','review-activity'].includes(name)||name==='step'&&value==='1')){
      deferredAction={name,dataset:{...(node?.dataset||{})}};
      dialog('放弃候选中的修改？','<p>这些逐题调整还没有采用。可以继续核对并采用，或放弃后继续。</p>',btn('继续核对','close-modal')+btn('放弃并继续','discard-and-continue',{variant:'primary'}));return;
    }
    try{switch(name){
      case 'module':await Platform.requestModule(node.dataset.module);break;
      case 'platform-return':await Platform.returnToPlatform();break;
      case 'nav':Platform.toggleNav();break;
      case 'library-tab':if(['cases','mine'].includes(value)){libraryTab=value;renderLibrary();document.querySelector(`[data-action="library-tab"][data-value="${value}"]`)?.focus({preventScroll:true});}break;
      case 'home':commitGoal();if(!flush()||!saveEditor())break;renderLibrary();window.scrollTo(0,0);break;
      case 'create':{const template=templates.find(t=>t.id===id);if(template){const a=repo.create(caseLesson(template));openActivity(a.id);toast('已创建独立草稿，原案例保持不变。');}break;}
      case 'edit':openActivity(id);break;
      case 'example':{const t=templates.find(t=>t.id===id);if(t)launch('example',caseLesson(t),M.DEFAULT_SETTINGS,null,id);break;}
      case 'preview-question-count':{const run=currentLaunch,count=Number(value),template=templates.find(t=>t.id===run?.templateId);if(run?.mode!=='example'||!template||!QUESTION_COUNT_OPTIONS.includes(count))break;if(launch('example',caseLesson(template,count),run.settings,null,template.id)){caseQuestionCounts.set(template.id,count);try{sessionStorage.removeItem(('wellbeing-web-three-v1-'+window.WB_WEB_SCOPE+'-external-move-match-'+"move-match-v1:launch:")+run.token);}catch{}document.querySelector('#preview-question-count')?.focus();}break;}
      case 'preview':if(flush()&&validateForRun())launch('preview',activity.draft.lesson,activity.draft.settings);break;
      case 'step':commitGoal();if(!flush())break;activity.editor.step=Number(value);activity.editor.scrollY=0;window.scrollTo(0,0);saveEditor();renderEditor();break;
      case 'select-item':case 'edit-item':openQuestionEditor(id);break;
      case 'save-question':saveQuestion();break;
      case 'continue-question':if(questionEdit){questionEdit.closing=false;renderQuestionDialog();}break;
      case 'filter-questions':questionFilter=value;refreshCurrent();break;
      case 'live-mode':stopReading();liveAnswer=value==='1';updateLive();break;
      case 'read-item':readQuestion(id);break;
      case 'cancel-item':cancelQuestion(id);break;
      case 'finish-item':saveQuestion();break;
      case 'apply-linked':{const item=editingLesson().items.find(i=>i.id===id),sync=item?.contentSync;if(sync?.status==='review'&&sync.kind==='review'&&sync.proposal){replaceItem(id,{...Linked.clean(sync.proposal),contentSync:{status:'synced',baseline:sync.baseline,message:'已核对并应用分类、配图与教学说明。'}});toast('已应用核对后的内容，可撤销。');}break;}
      case 'review-item':completeManualReview(id);break;
      case 'undo-item':{const item=editingLesson().items.find(i=>i.id===id);if(item?.contentSync?.baseline){replaceItem(id,Linked.clean(item.contentSync.baseline));toast('已撤销这次题目修改。');}break;}
      case 'seated':activity.draft.settings.seated=value==='true';queueSave();renderEditor();break;
      case 'add-image':setQuestionImage(true);break;
      case 'remove-image':setQuestionImage(false);break;
      case 'generate-image':{const lesson=editingLesson(),item=lesson.items.find(i=>i.id===id);if(item)generateQuestionImage(item,lesson);break;}
      case 'add-item':openQuestionEditor(null,'new');break;
      case 'copy-item':openQuestionEditor(id,'copy');break;
      case 'delete-item':{const item=editingLesson().items.find(i=>i.id===id)||currentItem();dialog('删除这道题？',`<p>${esc(editingLesson().mode==='word-sort'?item.word:item.sentence)}</p><p>${candidate?'仅从本次候选中删除。':'删除只影响草稿，已确认授课版保持不变。'}</p>`,`${btn('保留题目','close-modal')}${btn('删除题目','delete-item-confirm',{id:item.id,variant:'danger'})}`);break;}
      case 'delete-item-confirm':{const lesson=editingLesson(),n=lesson.items.findIndex(i=>i.id===id);if(n<0)break;lesson.items.splice(n,1);editingItemId=null;if(!candidate)activity.editor.selectedItemId=lesson.items[Math.min(n,lesson.items.length-1)]?.id;closeDialog();markQuestionChange();refreshCurrent();break;}

      case 'review':showReview();break;
      case 'confirm':confirmRelease();break;
      case 'close-modal':closeDialog();break;
      case 'locate-error':case 'review-edit':closeDialog();activity.editor.step=id||['title','seconds','settings','items'].includes(value)?2:1;if(id){questionFilter='all';if(!candidate)activity.editor.selectedItemId=id;}renderEditor();if(id){openQuestionEditor(id);setTimeout(()=>document.querySelector(value==='contentSync'?'.linked-status button,.question-card.is-editing [data-action=finish-item]':`#f-${CSS.escape(value|| (editingLesson().mode==='word-sort'?'word':'sentence'))}`)?.focus(),0);}else if(value==='seconds'||value==='settings'){const panel=document.querySelector('.optional-settings');if(panel)panel.open=true;document.querySelector('#f-seconds')?.focus();}else if(value==='title'){document.querySelector('#f-title')?.focus();}break;
      case 'choose-release':chooseRelease(id);break;
      case 'review-activity':closeDialog();openActivity(id);showReview();break;
      case 'start-release':{if(activity&&!flush())break;const session=repo.startSession(id,value);launch('classroom',session.lesson,session.settings,session);break;}
      case 'resume-session':{const session=repo.getSession(id);if(session)launch('classroom',session.lesson,session.settings,session);break;}
      case 'exit-stage':await exitStage();break;
      case 'reload-stage':if(currentLaunch&&saveLaunchProgress(currentLaunch))renderStage();else toast('临时进度尚未保存，请保留当前页面后重试。');break;
      case 'end-class':sendStage('move-match:pause');dialog('结束本次课堂？','<p>本次模拟课堂将结束，已保存内容不变。之后仍可选择授课版开始新的一轮。</p>',`${btn('继续当前课堂','cancel-case')}${btn('结束课堂','end-class-confirm',{variant:'primary'})}`);break;
      case 'end-class-confirm':closeDialog();await exitStage(true);break;
      case 'cancel-case':closeDialog();sendStage('move-match:resume');break;
      case 'switch-case':{const template=templates.find(t=>t.id===id);if(!template)break;const lesson=caseLesson(template);closeDialog();if(!await capturePausedProgress()){toast('当前课堂进度尚未准备好，请重试。');break;}if(currentLaunch.saveError||currentLaunch.tempError){if(currentLaunch.saveError)showStageSaveError(currentLaunch.saveError);else toast('临时进度尚未保存，请重试后再切换案例。');break;}const prior=currentLaunch,root=suspendedLaunch;suspendedLaunch=root||prior;if(launch('example',lesson,M.DEFAULT_SETTINGS,null,id)){if(root)sessionStorage.removeItem(('wellbeing-web-three-v1-'+window.WB_WEB_SCOPE+'-external-move-match-'+"move-match-v1:launch:")+prior.token);}else suspendedLaunch=root;break;}
      case 'retry-progress':if(currentLaunch?.progress)persistProgress(currentLaunch,currentLaunch.progress);break;
      case 'export-progress':if(currentLaunch)exportJSON({lesson:currentLaunch.lesson,settings:currentLaunch.settings,progress:currentLaunch.progress},'分类游戏-未保存课堂进度.json');break;
      case 'reload-session':{const old=currentLaunch,session=repo.getSession(old.sessionId);if(session&&launch('classroom',session.lesson,session.settings,session))sessionStorage.removeItem(('wellbeing-web-three-v1-'+window.WB_WEB_SCOPE+'-external-move-match-'+"move-match-v1:launch:")+old.token);break;}
      case 'create-from-preview':{if(currentLaunch?.mode!=='example'||currentLaunch.templateId!==id||suspendedLaunch)break;const lesson=clone(currentLaunch.lesson);await exitStage();if(currentLaunch)break;const a=repo.create(lesson);openActivity(a.id);break;}
      case 'retry-save':saveError=null;if(pending)flush();else {saveEditor();if(!saveError){updateSaveState();const area=document.querySelector('#save-error');if(area)area.hidden=true;}}break;
      case 'reload-activity':{const id=activity.id;pending=false;saveError=null;clearTimeout(saveTimer);activity=null;openActivity(id);break;}
      case 'fork-current':{const a=repo.fork(activity.id,candidate?{lesson:candidate.result.lesson,settings:activity.draft.settings}:activity.draft);pending=false;saveError=null;activity=null;openActivity(a.id);toast('已另存为新活动，旧活动保持不变。');break;}
      case 'export-draft':exportJSON(candidate?{lesson:candidate.result.lesson,settings:activity.draft.settings}:activity.draft,'分类游戏-未保存草稿.json');break;
      case 'export-raw':exportJSON((cloud?.storage||localStorage).getItem(M.STORAGE_KEY||('wellbeing-web-three-v1-'+window.WB_WEB_SCOPE+'-external-move-match-'+"wellbeing-move-match-v1-data"))||'','分类游戏-原始保存数据.json');break;
      case 'reload-page':location.reload();break;
      case 'new-activity':{const lesson={id:'custom',title:'新建分类活动',subtitle:'',mode:'word-sort',showImages:false,categories:[],items:[],preparation:{...G.defaults(null),questionCount:10}};const a=repo.create(lesson);openActivity(a.id);break;}
      case 'add-goal':commitGoal();document.querySelector('#prep-goal-input')?.focus();break;
      case 'remove-goal':changePreparation(p=>p.languageGoals.splice(Number(value),1));document.querySelector('#goal-tags').innerHTML=goalTags();break;
      case 'fill-example':{const count=questionCountInfo();const p=value==='articles'?G.defaults(templates.find(t=>t.id==='articles-two')):value==='be'?G.defaults(templates.find(t=>t.id==='be-three')):{theme:'动物与水果',age:'4–6 岁',languageGoals:['cat','dog','apple','banana'],categoryNames:['动物','水果']};p.questionCount=count.legacy?10:count.value;changePreparation(current=>Object.assign(current,p));renderEditor();break;}
      case 'generate':await generateContent();break;
      case 'adopt-candidate':adoptCandidate();break;
      case 'discard-and-continue':{const next=deferredAction;deferredAction=null;candidate=null;editingItemId=null;if(pendingAdoption){pendingAdoption=false;saveError=null;}closeDialog();if(next)await action(next.name,{dataset:next.dataset});break;}
      case 'discard-candidate':editingItemId=null;candidate=null;if(pendingAdoption){pendingAdoption=false;saveError=null;}renderEditor();toast('已放弃候选，当前草稿保持不变。');break;
    }}catch(e){if(activity)localError(e);else{toast(e.message||'操作未完成');if(e.code==='CORRUPT_STORAGE')fatal(e);}}
  }
  document.addEventListener('pointerdown',startQuestionDrag);
  document.addEventListener('pointermove',trackQuestionDrag,{passive:false});
  document.addEventListener('pointerup',event=>{if(event.pointerId===questionDrag?.pointerId){if(questionDrag.started){questionDrag.x=event.clientX;questionDrag.y=event.clientY;updateQuestionDropTarget();}finishQuestionDrag(true);}});
  document.addEventListener('pointercancel',event=>{if(event.pointerId===questionDrag?.pointerId)finishQuestionDrag(false);});
  document.addEventListener('lostpointercapture',event=>{if(event.pointerId===questionDrag?.pointerId)finishQuestionDrag(false);});
  window.addEventListener('blur',()=>{closeQuestionMenu();finishQuestionDrag(false);});
  document.addEventListener('click',event=>{
    if(Date.now()<suppressCardClickUntil){event.preventDefault();return;}
    const node=event.target.closest('[data-action]');
    if(node?.dataset.action==='question-more'){openQuestionMenu(node);return;}
    closeQuestionMenu(!!node?.closest?.('.question-more-menu'));
    if(node&&!node.disabled)action(node.dataset.action,node);
  });
  document.addEventListener('change',event=>{if(event.target.dataset.imageUpload&&activity)uploadQuestionImage(event.target);});
  document.addEventListener('input',event=>{
    if(activity&&event.target.dataset.imagePrompt){const item=editingLesson().items.find(i=>i.id===event.target.dataset.imagePrompt);if(item){item.imagePrompt=event.target.value;markQuestionChange();updateLive();}return;}
    if(activity&&event.target.id==='show-question-images'){changeDefaultCardStyle(event.target.value==='yes');return;}
    if(event.target.dataset.caseQuestionCount){const id=event.target.dataset.caseQuestionCount,count=Number(event.target.value);if(!templates.some(t=>t.id===id)||!QUESTION_COUNT_OPTIONS.includes(count)){event.target.value=String(caseQuestionCount(id));return;}caseQuestionCounts.set(id,count);const label=event.target.closest('.case-card')?.querySelector('[data-case-count]');if(label)label.textContent=String(count);return;}
    if(event.target.id==='preview-question-count'){action('preview-question-count',{dataset:{value:event.target.value}});return;}
    if(activity&&event.target.dataset.preparation){const key=event.target.dataset.preparation;if(key==='questionCount'&&!QUESTION_COUNT_OPTIONS.includes(Number(event.target.value))){updateQuestionCountUI();return;}changePreparation(p=>p[key]=key==='questionCount'?Number(event.target.value):event.target.value);updateQuestionCountUI();return;}
    if(activity&&event.target.dataset.categoryIndex!==undefined){changePreparation(p=>p.categoryNames[Number(event.target.dataset.categoryIndex)]=event.target.value);updateQuestionCountUI();return;}
    if(activity&&event.target.id==='prep-count'){commitGoal();changePreparation(p=>p.categoryNames=Array.from({length:Number(event.target.value)},(_,i)=>p.categoryNames[i]||''));renderEditor();document.querySelector('#prep-count')?.focus();return;}
    const fieldName=event.target.dataset.field;if(!fieldName||!activity)return;
    const value=event.target.type==='checkbox'?event.target.checked:event.target.value,card=event.target.closest('[data-item-id]'),lesson=editingLesson(),item=card?lesson.items.find(i=>i.id===card.dataset.itemId):null;
    if(['title','subtitle'].includes(fieldName)){activity.draft.lesson[fieldName]=value;queueSave();}
    else if(fieldName==='seconds'){activity.draft.settings.seconds=Number(value);const output=document.querySelector('#seconds-output');if(output)output.textContent=`${value} 秒`;queueSave();}
    else if(fieldName==='sound'){activity.draft.settings.sound=value;queueSave();}
    else if(item){
      if(item[fieldName]===value)return;
      if(!questionEdit&&['sentence','word','categoryId',...teachingFields].includes(fieldName)&&!(item.contentSync?.kind==='manual'&&fieldName!=='sentence'&&fieldName!=='word')){
        const editedFields=needsLinkReview(item)?item.contentSync.editedFields:[];
        Object.assign(item,Linked.begin(item));
        if(editedFields)item.contentSync.editedFields=editedFields;
        if(teachingFields.includes(fieldName))item.contentSync.editedFields=[...new Set([...(item.contentSync.editedFields||[]),fieldName])];
      }
      if(fieldName==='categoryId'){item.categoryId=value;const label=lesson.categories.find(c=>c.id===value)?.label||'';item.answerText=lesson.mode==='sentence-gap'?(label.toLowerCase()==='ø'?'':label.toLowerCase()):label;}
      else if(['sentence','word',...teachingFields].includes(fieldName))item[fieldName]=value;
      if(questionEdit&&['word','sentence'].includes(fieldName)){clearQuestionImage(item);imageJobs.delete(item.id);}
      markQuestionChange();
    }
    updateLive();
  });
  document.addEventListener('keydown',event=>{if(questionControlsKey(event))return;if(questionEdit&&(event.ctrlKey||event.metaKey)&&event.key==='Enter'&&!event.isComposing){event.preventDefault();saveQuestion();return;}if(event.target.id==='prep-goal-input'&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();commitGoal();}});
  document.addEventListener('focusout',event=>{if(questionMenu&&event.relatedTarget&&!questionMenu.trigger.parentElement.contains(event.relatedTarget))closeQuestionMenu();if(event.target.id==='prep-goal-input')commitGoal();});
  modal.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});
  window.addEventListener('message',event=>{
    if(window.parent!==window&&event.source===window.parent&&event.origin===location.origin&&event.data?.type==='wellbeing:visibility'){
      if(typeof event.data.visible!=='boolean')return;
      platformVisible=event.data.visible;
      if(!platformVisible)pauseForPlatform();
      return;
    }
    if(!currentLaunch||event.origin!==location.origin||event.source!==document.querySelector('#classroom-frame')?.contentWindow)return;
    const data=event.data;if(!data||data.token!==currentLaunch.token)return;
    if(data.type==='move-match:ready'){currentLaunch.ready=true;clearTimeout(launchTimer);document.querySelector('#stage-loading')?.remove();if(currentLaunch.pauseRequested||!platformVisible||document.hidden)pauseForPlatform();}
    else if(data.type==='move-match:progress'&&data.progress){
      persistProgress(currentLaunch,data.progress);
      if(data.progress.paused||['ready','complete'].includes(data.progress.game?.phase))progressWaiters.get(currentLaunch.token)?.();
    }else if(data.type==='move-match:case-request')handleCaseRequest(data.lessonId);
    else if(data.type==='move-match:error'){clearTimeout(launchTimer);const n=document.querySelector('#stage-loading');if(n)n.innerHTML=`<div><p>${esc(data.message||'课堂未能载入')}</p>${btn('返回','exit-stage')}</div>`;else toast(data.message);}
  });
  window.addEventListener('storage',event=>{if(cloud||event.key!==(M.STORAGE_KEY||('wellbeing-web-three-v1-'+window.WB_WEB_SCOPE+'-external-move-match-'+"wellbeing-move-match-v1-data")))return;if(page==='library'&&!currentLaunch)renderLibrary();else if(activity){try{const fresh=repo.get(activity.id);if(fresh&&fresh.revision!==activity.revision){const e=new Error('另一页保存了新内容。当前输入未被替换，可以载入最新内容或另存副本。');e.code='CONFLICT';saveError=e;localError(e);}}catch(e){localError(e);}}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseForPlatform();});
  window.addEventListener('beforeunload',event=>{commitGoal();flush();sendStage('move-match:request-progress');if(questionIsDirty()||pending||saveError||cloud?.dirty||currentLaunch?.saveError||suspendedLaunch?.saveError||candidate?.edited){event.preventDefault();event.returnValue='';}});
  window.addEventListener('pagehide',()=>{flush();if(currentLaunch?.mode==='classroom'&&currentLaunch.progress){try{const saved=repo.saveProgress(currentLaunch.sessionId,{...currentLaunch.progress,paused:true},currentLaunch.sessionRevision);currentLaunch.sessionRevision=saved.revision;}catch{}}});
  function initialize(){
    try{
      repo=new M.Repository(cloud?.storage||localStorage);
      cloud?.importLocal();
      const id=location.hash.startsWith('#edit/')?decodeURIComponent(location.hash.slice(6)):null;
      if(id)openActivity(id);else renderLibrary();
    }catch(e){fatal(e);}
  }
  function backendLoadError(e){
    app.innerHTML=`<main class="fatal" id="main" data-workbench-load-error><h1>暂时无法读取分类活动</h1><p role="alert">${esc(e.message)}</p>${btn('重试','reload-page')}</main>`;
  }
  try{
    cloud=window.WBWorkbenchApi?.activityStore('move-match',M.STORAGE_KEY,updateSaveState);
    if(cloud)cloud.load().then(initialize,backendLoadError);else initialize();
  }catch(e){backendLoadError(e);}
})();
