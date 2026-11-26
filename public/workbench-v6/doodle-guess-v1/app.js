(function () {
  'use strict';
  const M = window.DoodleModel, W = window.DoodleWordTools, I = window.DoodleWordImages;
  const app = document.getElementById('app'), dialog = document.getElementById('dialog');
  const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => window.WBUI?.icon?.(name) || '';
  const B = (label, action, variant = 'secondary', attrs = '') => {
    const classes = attrs.match(/class="([^"]*)"/)?.[1] || '';
    const kind = attrs.match(/data-ui="([^"]*)"/)?.[1] || 'button';
    attrs = attrs.replace(/\b(?:class|data-ui)="[^"]*"/g,'');
    return `<button type="button" class="${kind==='button'?'wb-button ':''}${variant} ${classes}" data-ui="${kind}" data-ui-variant="${variant==='quiet'?'ghost':variant}" data-action="${action}" ${attrs}>${label}</button>`;
  };
  const api = window.WBWorkbenchApi;
  const live = !!api && !api.offline;
  const caseLibrary=api?.caseLibrary?.('doodle');
  const casesList=()=>caseLibrary?.items??M.CASES;
  let storage, cloud, loadError = '';
  try { storage = window.localStorage; } catch (_) { /* read() reports blocked storage without discarding input. */ }
  let items = [], baseline, storageError = '', conflict = false;
  let draft = null, dirty = false, saveTimer, toastTimer, modalReturn, session = null, pendingHomeRefresh = false, platformVisible = true, speech = null;
  const imageJobs = new Map(), imageErrors = new Map();
  const ui = {page:'home', tab:'cases', query:'', filter:'all', errors:{},  wordAdd:'', wordFeedback:'', wordUndo:null};
  const modeName = mode => mode === 'pk' ? '双人 PK' : '单人 Solo';
  const timeName = value => value ? new Date(value).toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}) : '';
  function toast(message) {
    const node = document.getElementById('toast'); node.textContent = message; node.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('visible'), 2800);
  }
  function decorate() { window.WBUI?.decorate?.(document); }
  function storageAlert() {
    return storageError ? `<div class="doodle-storage-alert" role="alert"><p>${E(storageError)}</p><div class="row">${B('重试保存','retry-save')}${draft ? B('另存为新活动','save-copy') : ''}${B('导出当前内容','export')}${B('重新载入','reload','quiet')}</div></div>` : '';
  }
  function statusText() {
    if (storageError) return '尚未保存，请处理上方提示';
    if (dirty) return '正在保存草稿…';
    if (cloud?.status === 'pending') return '正在同步后台…';
    if (cloud?.dirty) return '待同步后台';
    return cloud?.readOnly ? '' : cloud ? '草稿已同步后台' : '草稿已保存';
  }
  function updateSaveUI() {
    const status = document.getElementById('save-status');
    if (status) {status.textContent = statusText(); status.hidden = !status.textContent; status.dataset.state = storageError ? 'error' : 'saved'; status.classList.toggle('is-error',!!storageError);}
    const title = document.getElementById('doodle-draft-title'); if (title && draft) title.textContent = draft.title || '新建涂鸦活动';
    const alert = document.getElementById('storage-alert'); if (alert) alert.innerHTML = storageAlert();
    decorate();
  }
  function persist(next) {
    const result = M.write(storage, next, baseline);
    storageError = result.error || ''; conflict = !!result.conflict;
    if (result.ok) { items = next.map(M.normalize); baseline = result.baseline; }
    updateSaveUI();
    return result.ok;
  }
  function save(commitWords=true) {
    if(commitWords&&imageJobs.size){toast('图片正在准备中，请稍候。');return false;}
    if(commitWords && draft && !flushWordEditor())return false;
    if(commitWords&&imageJobs.size){toast('图片正在准备中，请稍候。');return false;}
    clearTimeout(saveTimer);
    if (!dirty && !storageError) return true;
    if (!draft) return persist(items);
    const normalized = M.normalize({...draft, updatedAt:new Date().toISOString()});
    const next = items.some(item => item.id === normalized.id)
      ? items.map(item => item.id === normalized.id ? normalized : item) : [normalized, ...items];
    if (!persist(next)) return false;
    draft = M.clone(normalized); dirty = false; updateSaveUI(); return true;
  }
  function scheduleSave() { dirty = true; updateSaveUI(); clearTimeout(saveTimer); saveTimer = setTimeout(()=>save(false), 500); }
  function shell(content, home = false) {
    const navigation = window.WBPlatform?.navigation?.('doodle') || '';
    return `<div class="shell doodle-shell expanded ${home ? 'library-mode' : 'editor-mode'}">${navigation}<div class="workspace"><header class="topbar"><div class="row">${B(icon('menu'), 'nav', 'quiet', 'class="doodle-menu-button" aria-label="打开导航" aria-controls="doodle-navigation" aria-expanded="false"')}${window.parent!==window?B(icon('arrow-left'),'platform-return','quiet','aria-label="返回上个模块" title="返回上个模块"'):''}<strong>创作工坊 / 涂鸦游戏</strong></div><div class="row">${B(icon('help'), 'help', 'quiet', 'aria-label="使用说明"')}<span class="avatar">教师</span></div></header><div id="storage-alert">${storageAlert()}</div>${content}</div></div>`;
  }
  function card(config, isCase) {
    const id = E(config.id), published = config._publication, changed = published && M.hasChanges(config);
    const attrs = `data-id="${id}"`;
    let actions;
    if (isCase) actions = B('预览案例','case-preview','primary',attrs+' data-wb-button="primary"')
      + B('制作同款','copy-case','secondary',attrs+' data-wb-button="secondary"');
    else actions = (published && !changed ? B(`开始授课 · V${published.version}`,'teach','primary',attrs) : B(published ? '更新授课版' : '确认授课版','review-saved','primary',attrs))
      + B('继续备课','edit','secondary',attrs) + (published&&caseLibrary?.canPublish?B('发布为案例','publish-case','secondary',attrs):'') + B(icon('more'),'more','quiet',`${attrs} class="lh-more" aria-label="${E(config.title || '未命名活动')}的更多操作"`);
    return `<article class="lh-card${isCase?' wb-case-card':''}" aria-label="${E(config.title || '未命名活动')}"><button type="button" class="lh-cover${isCase?' wb-case-cover':''}" data-action="${isCase ? 'case-preview' : 'edit'}" ${attrs} aria-label="${isCase ? '预览案例' : '编辑'}：${E(config.title || '未命名活动')}">${isCase&&M.CASES.some(item=>item.id===config.id)?`<img src="assets/case-${config.id}.jpg" alt="${modeName(config.mode)}画板界面" loading="lazy">`:`<div class="doodle-word-cover">${config.words.slice(0,3).map(word=>`<span>${E(word)}</span>`).join('')||'<span>添加目标词</span>'}</div>`}</button><div class="lh-card-body${isCase?' wb-case-body':''}">${!isCase ? `<div class="lh-card-state"><span class="lh-status ${published ? 'ready' : 'draft'}">${published ? `授课版 V${published.version}` : '修改草稿'}</span><small>${changed ? '有修改未更新' : timeName(config.updatedAt)}</small></div>` : ''}<h2 class="lh-card-heading${isCase?' wb-case-title':''}"><button type="button" class="lh-card-title" data-action="${isCase ? 'case-preview' : 'edit'}" ${attrs}>${E(config.title || '未命名活动')}</button></h2><div class="lh-metadata">${isCase?`<span>${E(config.age)}</span>`:''}<span>${config.words.length} 个目标词</span></div><div class="lh-word-tags">${config.words.slice(0,5).map(word=>`<span>${E(word)}</span>`).join('')}${config.words.length>5?`<span>+${config.words.length-5}</span>`:''}</div><div class="lh-card-actions${isCase?' wb-case-actions':''}">${actions}</div></div></article>`;
  }
  function results() {
    const cases = ui.tab === 'cases', query = ui.query.trim().toLowerCase();
    if(cases&&caseLibrary?.message)return `<div class="wb-library-empty" role="status">${E(caseLibrary.message)}</div>`;
    const source = cases ? casesList() : items;
    const visible = source.filter(item => (!query || [item.title,item.theme,item.requirements,item.description,...(item.languageGoals||[]),...item.words].join(' ').toLowerCase().includes(query))
      && (cases || ui.filter === 'all' || (ui.filter === 'ready' ? !!item._publication : M.hasChanges(item))));
    if(visible.length)return `<div class="lh-grid ${cases?'wb-case-grid':'wb-work-grid'}">${visible.map(item=>card(item,cases)).join('')}</div>`;
    const filtered=source.length&&(query||ui.filter!=='all');
    return `<div class="wb-library-empty"><p role="status">${filtered?'未找到匹配的活动。':cases?'暂无已发布的案例。':'暂无我制作的活动。'}</p>${filtered?B(query&&ui.filter==='all'?'清除搜索':'清除筛选','clear-filter','secondary'):''}</div>`;
  }
  function home() {
    const sources=[['cases','案例库',casesList().length],['mine','我制作的',items.length]];
    return `<main class="library-home doodle-library"><header class="lh-header wb-library-header"><h1>涂鸦游戏</h1><div class="lh-header-actions">${B(icon('plus')+'新建活动','new','primary','data-wb-create')}</div></header>
      <div class="lh-library-head wb-library-tools"><div class="lh-tabs wb-library-tabs" role="tablist" aria-label="活动来源">${sources.map(([id,label,count])=>`<button type="button" data-ui="tab" id="wb-${id}-tab" role="tab" aria-selected="${ui.tab===id}" aria-controls="results" tabindex="${ui.tab===id?0:-1}" data-action="tab" data-tab="${id}">${label} <span>${count}</span></button>`).join('')}</div>
      <label class="lh-search wb-library-search"><input type="search" id="search" aria-label="搜索活动" placeholder="搜索活动" value="${E(ui.query)}"></label></div>${ui.tab==='mine'?`<div class="lh-filterbar"><div class="lh-filters" role="group" aria-label="备课状态">${[['all','全部'],['draft','草稿'],['ready','可授课']].map(([id,label])=>B(label,'filter','secondary',`data-wb-filter data-filter="${id}" aria-pressed="${ui.filter===id}" class="${ui.filter===id?'active':''}"`)).join('')}</div></div>`:''}<section id="results" role="tabpanel" aria-labelledby="wb-${ui.tab}-tab">${results()}</section></main>`;
  }
  function fieldError(name) { return `<span class="field-error" id="error-${name}" role="alert">${E(ui.errors[name] || '')}</span>`; }
  function options(values, current) { return values.map(([value,label])=>`<option value="${value}" ${String(value)===String(current)?'selected':''}>${label}</option>`).join(''); }
  function wordArt(word) {
    const asset=draft.wordImages?.[word], busy=imageJobs.get(word), error=imageErrors.get(word);
    if(busy)return `<div class="word-card-art image-pending" role="status"><div class="loading-line"></div><small>${busy.kind==='upload'?'处理中…':'生成中…'}</small></div>`;
    if(asset?.kind==='upload'||asset?.kind==='ai')return `<div class="word-card-art"><img src="${E(asset.src)}" referrerpolicy="no-referrer" alt="${E(word)}配图"></div>`;
    if(asset?.kind==='demo'&&W.picture(word))return `<div class="word-card-art demo-art demo-${asset.variant}" role="img" aria-label="${E(word)}的图示">${E(W.picture(word))}</div>`;
    return `<div class="word-card-art no-picture">${icon('image')}<small>${error?'暂无图片':'待配图'}</small></div>`;
  }
  function wordSummary() {
    const parsed=M.parseWords(draft.rawWords), ready=parsed.words.filter(word=>draft.wordImages?.[word]).length;
    const missing=parsed.words.filter(word=>!draft.wordImages?.[word]);
    return `<div class="word-summary"><span>${parsed.words.length} 个单词 · ${ready} 张配图</span>${B('补齐配图','images-generate','quiet',`class="small" ${missing.length&&!imageJobs.size?'':'disabled'}`)}</div>
      <div class="word-card-grid">${parsed.words.map((word,index)=>{
        const asset=draft.wordImages?.[word], busy=imageJobs.has(word), error=imageErrors.get(word);
        return `<article class="word-card ${parsed.invalid.includes(word)?'invalid':''}" data-word="${E(word)}" aria-busy="${busy}">
          ${wordArt(word)}
          <div class="word-card-heading"><strong lang="en">${E(word)}</strong><div class="word-card-utilities">
            ${B(icon('volume'),'word-say','quiet',`class="small" data-index="${index}" aria-label="试听 ${E(word)}" title="试听 ${E(word)}"`)}
            ${B(icon('trash'),'word-remove','quiet',`class="small" data-index="${index}" aria-label="删除 ${E(word)}" title="删除 ${E(word)}"`)}
          </div></div>
          <p class="image-caption ${error?'image-error':''}" role="status">${E(error||(busy?'':asset?.kind==='upload'?'已上传':asset?.kind==='ai'?'已生成':asset?.kind==='demo'?'':'待配图'))}</p>
          <div class="word-card-actions">
            ${B(asset?'重新生成':'生成图片','image-generate','quiet',`class="small" data-word="${E(word)}" ${busy?'disabled':''}`)}
            ${B('上传替换','image-upload','secondary',`class="small" data-word="${E(word)}" ${busy?'disabled':''} aria-label="上传 ${E(word)} 的替换图片"`)}
          </div>
        </article>`;
      }).join('')||'<div class="word-card-empty">'+icon('image')+'<strong>添加单词开始</strong></div>'}</div>`;
  }
  function generateMissingImages() {
    if(!draft)return;
    draft.words.filter(word=>!draft.wordImages?.[word]&&!imageJobs.has(word)).forEach(generateImage);
  }
  function currentImageJob(word,job) {
    return imageJobs.get(word)===job&&draft?.id===job.id&&draft.words.includes(word)&&ui.page==='editor';
  }
  function cancelImage(word) {
    imageJobs.get(word)?.controller?.abort();
    imageJobs.delete(word);
  }
  function clearImages() {
    for (const word of imageJobs.keys()) cancelImage(word);
    imageErrors.clear();
  }
  let runningImages=0;
  function drainImages() {
    for (const [word,job] of imageJobs) {
      if (runningImages>=3) break;
      if (job.kind!=='queued') continue;
      job.kind='ai';
      runningImages++;
      void generateLiveImage(word,job).finally(()=>{runningImages--;drainImages();});
    }
  }
  function remoteImage(word,kind,src) {
    const asset=I.normalize({[word]:{kind,src}},[word])[word];
    if(!asset)throw Error('后台返回的图片地址无效，请重试。');
    return asset;
  }
  async function generateLiveImage(word,job) {
    try {
      const src=await api.generateImage({prompt:`A single child-friendly English flashcard illustration of ${word}, centered subject, uncluttered light background, no text, no letters, no logo.`,width:512,height:512},{signal:job.controller.signal});
      if(!currentImageJob(word,job))return;
      draft.wordImages={...draft.wordImages,[word]:remoteImage(word,'ai',src)};
      scheduleSave();
    } catch(error) {
      if(currentImageJob(word,job))imageErrors.set(word,error.message||'生成失败，请重试或上传图片。');
    } finally {
      if(currentImageJob(word,job)){imageJobs.delete(word);refreshWords();}
    }
  }
  async function generateImage(word) {
    if(!draft?.words.includes(word)||imageJobs.has(word))return;
    const job=live?{id:draft.id,kind:'queued',controller:new AbortController()}:{id:draft.id,kind:'demo'}, previous=draft.wordImages?.[word];
    imageJobs.set(word,job);imageErrors.delete(word);refreshWords();
    if(live){drainImages();return;}
    await new Promise(resolve=>setTimeout(resolve,550));
    if(!currentImageJob(word,job))return;
    imageJobs.delete(word);
    if(W.picture(word)){
      draft.wordImages={...draft.wordImages,[word]:{kind:'demo',variant:previous?.kind==='demo'?(previous.variant+1)%3:0}};
      scheduleSave();
    }else imageErrors.set(word,'暂无图片，请上传。');
    refreshWords();
  }
  function uploadImage(word) {
    if(!draft?.words.includes(word))return;
    const activityId=draft.id, input=document.createElement('input');
    input.type='file';input.accept='image/png,image/jpeg,image/webp';
    input.addEventListener('change',async()=>{
      const file=input.files?.[0];if(!file||draft?.id!==activityId||!draft.words.includes(word))return;
      const job={id:activityId,kind:'upload',controller:live?new AbortController():null};imageJobs.set(word,job);imageErrors.delete(word);refreshWords();
      try{
        let asset;
        if(live){
          I.validateFile(file);
          const src=await api.upload(file,'doodle-word-images',{signal:job.controller.signal});
          asset=remoteImage(word,'upload',src);
        }else asset=await I.fromFile(file);
        if(!currentImageJob(word,job))return;
        draft.wordImages={...draft.wordImages,[word]:asset};scheduleSave();
      }catch(error){if(currentImageJob(word,job))imageErrors.set(word,error.message||'图片未能读取，请换一张重试。');}
      finally{if(currentImageJob(word,job)){imageJobs.delete(word);refreshWords();}}
    },{once:true});
    input.click();
  }
  function wordFeedback() {
    return `${E(ui.wordFeedback)}${ui.wordUndo?B('撤销删除','word-undo','quiet'):''}`;
  }
  function refreshWords() {
    const summary=document.getElementById('word-summary');if(summary)summary.innerHTML=wordSummary();
    const feedback=document.getElementById('word-editor-feedback');if(feedback)feedback.innerHTML=wordFeedback();
    const input=document.getElementById('word-add-input');if(input)input.value=ui.wordAdd;
    const error=document.getElementById('error-words');if(error)error.textContent=ui.errors.words||'';
    decorate();
  }
  function setWords(words, message='', undo=null) {
    draft=M.normalize({...draft,rawWords:words.join('\n')});ui.wordFeedback=message;ui.wordUndo=undo;delete ui.errors.words;
    refreshWords();scheduleSave();
  }
  function addWord(focus=true) {
    const parsed=M.parseWords(ui.wordAdd);
    if(!parsed.words.length||parsed.invalid.length){ui.wordFeedback=parsed.invalid.length?'请检查这些单词：'+parsed.invalid.join('、'):'请先填写英文单词。';refreshWords();document.getElementById('word-add-input')?.focus();return false;}
    const added=parsed.words.filter(word=>!draft.words.includes(word));
    ui.wordAdd='';setWords([...draft.words,...added],added.length?(added.length<parsed.words.length||parsed.duplicates?'已合并重复单词':''):'单词已存在');
    added.forEach(generateImage);
    if(focus)document.getElementById('word-add-input')?.focus();return true;
  }
  function flushWordEditor() { return !ui.wordAdd.trim()||addWord(false); }
  function stopWordSpeech() {if(speech){window.speechSynthesis?.cancel();speech=null;}}
  function sayWord(word) {
    stopWordSpeech();
    if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){toast('当前浏览器不支持英语朗读。');return;}
    const utterance=new window.SpeechSynthesisUtterance(word);utterance.lang='en-US';utterance.rate=.85;speech=utterance;
    utterance.onerror=event=>{if(speech!==utterance)return;speech=null;if(event.error!=='canceled'&&event.error!=='interrupted')toast('未能朗读，请检查设备语音设置后重试。');};
    utterance.onend=()=>{if(speech===utterance)speech=null;};
    window.speechSynthesis.speak(utterance);
  }
  function editor() {
    const pub = draft._publication;
    return `<main class="doodle-main wb-authoring">
      <div class="wb-authoring-heading">
        ${B(icon('arrow-left')+'返回活动库','home','quiet')}
        <header class="wb-authoring-header">
          <h1 class="wb-authoring-title" id="doodle-draft-title">${E(draft.title||'新建涂鸦活动')}</h1>
          <div class="wb-authoring-actions">${B(icon('eye')+'预览','preview','secondary')}</div>
          <div class="wb-authoring-status">${pub?`已确认授课版 V${pub.version} · 修改后可重新核对更新`:'填写单词，为课堂准备图片示意。'}</div>
        </header>
      </div>
      <div class="doodle-editor-grid wb-authoring-body">
        <section class="doodle-fields wb-authoring-panel" aria-labelledby="content-heading">
          <div class="wb-panel-heading"><h2 id="content-heading">活动内容</h2></div>
          <label class="field wb-field" for="activity-title"><span>活动名称</span><input data-ui="field" id="activity-title" data-field="title" value="${E(draft.title)}" placeholder="例如：小动物猜猜看" maxlength="80" aria-describedby="error-title">${fieldError('title')}</label>
          <details class="doodle-extra-settings"><summary>更多课堂设置</summary>
            <label class="field wb-field" for="language-level"><span>语言提示</span><select data-ui="field" id="language-level" data-field="level">${options([['word','单词'],['sentence','简单句'],['describe','描述事物']],draft.level)}</select></label>
            <label class="quiet-setting"><input type="checkbox" data-field="quiet" ${draft.quiet?'checked':''}><span>安静模式<small>减少动画和提示音</small></span></label>
          </details>
        </section>
        <section class="doodle-settings wb-authoring-panel" aria-labelledby="words-heading">
          <div class="wb-panel-heading"><div class="word-library-heading"><h2 id="words-heading">单词配图</h2>${live?'':'<span class="image-demo-badge">配图演示</span>'}</div></div>
          <div class="word-add-row"><label class="doodle-sr-only" for="word-add-input">添加英文单词</label><input data-ui="field" id="word-add-input" value="${E(ui.wordAdd)}" placeholder="输入英文单词，如 apple" spellcheck="false" aria-describedby="words-help word-editor-feedback error-words">${B('添加','word-add','secondary')}</div>
          <p id="words-help" class="word-add-help">按回车或点击添加，支持粘贴多个单词。</p>
          <div id="word-editor-feedback" class="word-editor-feedback" role="status">${wordFeedback()}</div>${fieldError('words')}
          <div id="word-summary">${wordSummary()}</div>
        </section>
      </div>
    </main>
    <footer class="wb-authoring-footer" aria-label="备课操作">
      <div class="wb-footer-meta"><span id="save-status" class="doodle-save-status wb-status" role="status" data-state="${storageError?'error':'saved'}" ${statusText() ? '' : 'hidden'}>${statusText()}</span></div>
      <div class="wb-footer-actions">${B('保存草稿','save')}${B(pub?'核对并更新授课版':'核对并确认授课版','review','primary')}</div>
    </footer>`;
  }
  function render() { app.innerHTML = shell(ui.page === 'home' ? home() : editor(), ui.page==='home'); decorate(); }
  function closeDialog() { dialog.close(); modalReturn?.focus?.({preventScroll:true}); }
  function showDialog(title, body, footer) {
    dialog.classList.add('wb-dialog');
    if (!dialog.open) modalReturn = document.activeElement;
    dialog.innerHTML = `<header class="dialoghead wb-dialog-heading"><h2 id="dialog-title">${title}</h2>${B(icon('close'),'close','quiet','aria-label="关闭"')}</header><div class="dialogbody">${body}</div><footer class="dialogfoot wb-dialog-actions">${footer || B('返回','close')}</footer>`;
    decorate(); if (!dialog.open) dialog.showModal();
  }
  function edit(item, isNew=false) {
    closeDialog();stopWordSpeech();clearImages(); draft=M.clone(item); dirty=isNew; ui.page='editor'; ui.errors={};ui.wordAdd='';ui.wordFeedback='';ui.wordUndo=null;
    render(); window.scrollTo(0,0); if(isNew)save(); document.getElementById('activity-title')?.focus();
  }
  function checkDraft() {
    ui.errors=M.validate(draft);
    for (const field of ['title','words']) {
      const error=document.getElementById('error-'+field); if(error)error.textContent=ui.errors[field]||'';
      const input=document.getElementById({title:'activity-title',words:'word-add-input'}[field]);
      if(input){input.setAttribute('aria-invalid',String(!!ui.errors[field]));if(ui.errors[field])input.setAttribute('aria-describedby','error-'+field);}
    }
    const first=Object.keys(ui.errors)[0];
    if(first){document.getElementById({title:'activity-title',words:'word-add-input'}[first])?.focus();return false;}
    return true;
  }
  function review() {
    if(!flushWordEditor())return;
    if (!checkDraft() || !save()) return;
    const d=M.normalize(draft), previous=d._publication;
    showDialog(previous?'更新授课版':'确认授课版',`<dl class="doodle-review"><dt>活动名称</dt><dd>${E(d.title)}</dd><dt>目标词库</dt><dd><div class="word-preview">${d.words.map(w=>`<span>${E(w)}</span>`).join('')}</div></dd></dl><p class="review-note">确认后保存独立授课版。之后修改草稿，课堂仍使用已确认的内容。</p>`,B('返回修改','close')+B('预览当前草稿','preview')+B(previous?'确认更新授课版':'确认授课版','publish','primary'));
  }
  async function publish() {
    if(!checkDraft()||!save())return;
    const published=M.publish(draft), next=items.map(item=>item.id===published.id?published:item);
    if(!persist(next)){
      storageError='授课版未保存。'+storageError;
      closeDialog();updateSaveUI();toast('草稿已保留。重试保存后，请重新核对并确认授课版。');return;
    }
    draft=M.clone(published);dirty=false;closeDialog();render();
    if(cloud && !await cloud.flush()){toast('授课版仍待同步后台，请处理页面提示。');return;}
    if(draft?.id!==published.id||draft._publication?.version!==published._publication.version)return;
    showDialog('授课版已确认',`<p><strong>${E(draft.title)}</strong> · V${draft._publication.version}</p><p>可以开始授课，也可以稍后从“我制作的”进入。</p>`,B('返回备课','close')+B('开始授课','teach-current','primary'));
  }
  function leaveEditor() {
    if(!save()){toast('当前修改尚未保存，请先重试、导出或另存副本。');return;}
    stopWordSpeech();clearImages();draft=null;ui.page='home';ui.tab='mine';ui.query='';ui.filter='all';ui.errors={};render();window.scrollTo(0,0);
  }
  function startSession(config, kind) {
    if(session)return;
    if(kind==='preview'){
      if(!flushWordEditor() || !checkDraft() || !save())return;
      config=draft;
    }
    stopWordSpeech();
    closeDialog();
    clearTimeout(toastTimer);document.getElementById('toast').classList.remove('visible');
    const returnFocus=document.activeElement, scrollY=window.scrollY, overflow=document.body.style.overflow;
    const root=document.createElement('section');root.className='doodle-session';root.setAttribute('aria-label',kind==='classroom'?'涂鸦课堂':'涂鸦预览');
    const label=kind==='case'?'预览 · 案例':kind==='classroom'?'授课 · 已确认版本':'预览 · 当前草稿';
    root.innerHTML=`<header class="doodle-session-header unified-experience-header"><div><h1>${E(config.title)}</h1><p>${label} · 玩法可在课堂切换</p></div><div class="row">${kind==='case'?B('制作同款','session-copy','secondary',`data-id="${E(config.id)}"`):''}${B(icon('arrow-left')+(kind==='case'?'返回案例库':ui.page==='editor'?'返回备课':'返回活动库'),'session-exit','primary')}</div></header><div class="doodle-session-stage"><div class="doodle-game-host" style="position:absolute;inset:0"></div><div class="session-feedback" role="status"><div class="loading-line"></div><p>正在打开画板…</p></div></div>`;
    app.inert=true;document.body.style.overflow='hidden';document.body.appendChild(root);decorate();
    session={root,config:M.clone(config),kind,returnFocus,scrollY,overflow,handle:null};
    mountSession(); root.querySelector('[data-action="session-exit"]').focus();
  }
  function mountSession() {
    const current=session;if(!current)return;
    current.handle?.destroy();
    const feedback=current.root.querySelector('.session-feedback');feedback.hidden=false;
    feedback.innerHTML='<div class="loading-line"></div><p>正在打开画板…</p>';
    current.handle=window.DoodleRuntime.open({host:current.root.querySelector('.doodle-game-host'),config:current.config,kind:current.kind,
      onReady(){if(session===current)feedback.hidden=true;},
      onError(error){if(session!==current)return;feedback.hidden=false;feedback.innerHTML=`<h2>画板未能打开</h2><p>${E(error?.message||String(error))}</p>${B('重新加载画板','session-retry','primary')}`;decorate();}});
  }
  function exitSession() {
    if(!session)return;const old=session;session=null;old.handle?.destroy();old.root.remove();app.inert=false;
    document.body.style.overflow=old.overflow;
    if(pendingHomeRefresh&&ui.page==='home'){render();pendingHomeRefresh=false;}
    window.scrollTo(0,old.scrollY);old.returnFocus?.focus?.({preventScroll:true});
  }
  function more(id) {
    const item=items.find(item=>item.id===id);if(!item)return;
    showDialog(E(item.title||'未命名活动'),`<div class="new-choices">${item._publication?B(`使用授课版 V${item._publication.version} 开始授课`,'teach','secondary',`data-id="${E(id)}"`):''}${B('复制为新活动','duplicate','secondary',`data-id="${E(id)}"`)}${B('删除活动','delete-confirm','quiet',`data-id="${E(id)}"`)}</div>`);
  }
  function reload() {
    const loaded=M.read(storage);if(loaded.error){storageError=loaded.error;updateSaveUI();toast('记录仍无法读取，原内容已保留。');return;}
    clearTimeout(saveTimer);items=loaded.items;baseline=loaded.baseline;storageError='';conflict=false;dirty=false;stopWordSpeech();clearImages();draft=null;ui.page='home';ui.tab='mine';closeDialog();render();
  }
  function saveCopy() {
    if(imageJobs.size){toast('图片正在准备中，请稍候。');return;}
    if(!draft||!flushWordEditor())return;
    if(imageJobs.size){toast('图片正在准备中，请稍候。');return;}
    const fresh=M.read(storage);if(fresh.error){storageError=fresh.error;updateSaveUI();return;}
    const copy=M.clone(draft);copy.id=M.blank().id;copy.title=(copy.title||'未命名活动')+'（副本）';delete copy._publication;
    const result=M.write(storage,[copy,...fresh.items],fresh.baseline);
    if(!result.ok){storageError=result.error;updateSaveUI();return;}
    items=[copy,...fresh.items];baseline=result.baseline;storageError='';conflict=false;dirty=false;draft=copy;closeDialog();render();toast('已另存为新活动，原记录保持不变。');
  }
  function exportCurrent() {
    const pendingWordEdit={add:ui.wordAdd};
    const blob=new Blob([JSON.stringify({schemaVersion:M.SCHEMA_VERSION,items,draft,pendingWordEdit},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='涂鸦活动备份.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function navigate(module) {
    if(module==='doodle'){if(session)exitSession();if(ui.page==='editor')leaveEditor();return;}
    if(!['song','music','yoga','speak','move-match'].includes(module))return;
    if(window.parent!==window)window.parent.postMessage({type:'wellbeing:module',module},location.origin);
    else void window.WBPrepareModuleSwitch().then(allowed=>{if(allowed)location.href='../prep-workbench-six-modules-v1/latest.html#'+module;});
  }
  window.WBPrepareModuleSwitch = async () => {
    if(loadError)return true;
    if(!save()){toast('请先保存当前修改，再切换模块。');return false;}
    return !cloud || await cloud.flush();
  };
  window.WBPauseForModuleSwitch = () => {stopWordSpeech();session?.handle?.setVisible(false);};
  document.addEventListener('input',event=>{
    if(event.target.id==='word-add-input'){ui.wordAdd=event.target.value;return;}
    if(event.target.id==='search'){ui.query=event.target.value;document.getElementById('results').innerHTML=results();decorate();return;}
    const field=event.target.dataset.field;if(!draft||!field)return;
    let value=event.target.type==='checkbox'?event.target.checked:event.target.value;
    if(['practiceSeconds','rounds','wordCount'].includes(field)&&value!=='all')value=Number(value);
    draft[field]=value;draft=M.normalize(draft);delete ui.errors[field==='rawWords'?'words':field];
    if(field==='rawWords')refreshWords();
    const error=document.getElementById('error-'+(field==='rawWords'?'words':field));if(error)error.textContent='';event.target.removeAttribute('aria-invalid');scheduleSave();
  });
  document.addEventListener('paste',event=>{
    if(event.target.id!=='word-add-input')return;
    const text=event.clipboardData?.getData('text');
    if(!text||!/[\r\n]/.test(text))return;
    event.preventDefault();
    event.target.setRangeText(text.replace(/[\r\n]+/g,', '),event.target.selectionStart,event.target.selectionEnd,'end');
    ui.wordAdd=event.target.value;
  });
  document.addEventListener('keydown',event=>{
    if(event.isComposing)return;
    if(event.target.id==='word-add-input'&&event.key==='Enter'){event.preventDefault();addWord();}
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('button[data-action]');if(!button||button.disabled)return;
    const action=button.dataset.action,id=button.dataset.id;
    if(button.closest('.unified-navigation')&&button.dataset.module){navigate(button.dataset.module);return;}
    if(action==='word-add')addWord();
    else if(action==='image-generate')generateImage(button.dataset.word);
    else if(action==='images-generate')generateMissingImages();
    else if(action==='image-upload')uploadImage(button.dataset.word);
    else if(action==='word-remove'){const index=Number(button.dataset.index),before=draft.words.slice(),word=before[index],result=W.update(before,{type:'remove',index});if(result.ok){const images=M.clone(draft.wordImages);cancelImage(word);imageErrors.delete(word);setWords(result.words,'已删除 '+word+'。',{before,images,after:JSON.stringify(result.words)});document.querySelector('[data-action="word-undo"]')?.focus();}}
    else if(action==='word-undo'){const undo=ui.wordUndo;if(undo&&undo.after===JSON.stringify(draft.words)){draft.wordImages={...undo.images,...draft.wordImages};setWords(undo.before,'已恢复删除的单词。');document.getElementById('word-add-input')?.focus();}}
    else if(action==='word-say')sayWord(draft.words[Number(button.dataset.index)]);
    else if(action==='new'){if(save())edit(M.blank(),true);}
    else if(action==='copy-case')edit(M.fromCase(id,casesList()),true);
    else if(action==='publish-case')void caseLibrary?.publish(id).then(published=>{
      if(published){ui.tab='cases';ui.query='';ui.filter='all';render();toast('已发布到平台案例库。');}
    }).catch(error=>toast(error.message));
    else if(action==='edit'){if(save()){const item=items.find(item=>item.id===id);if(item)edit(item);}}
    else if(action==='tab'){ui.tab=button.dataset.tab;ui.filter='all';render();document.getElementById('wb-'+ui.tab+'-tab')?.focus({preventScroll:true});}
    else if(action==='filter'){ui.filter=button.dataset.filter;render();}
    else if(action==='clear-filter'){ui.filter='all';ui.query='';render();document.getElementById('search')?.focus({preventScroll:true});}
    else if(action==='home')leaveEditor();
    else if(action==='close')closeDialog();
    else if(action==='save'||action==='retry-save'){if(save()){if(cloud)void cloud.flush().then(ok=>{if(ok)toast('草稿已同步后台');});else toast('草稿已保存');}}
    else if(action==='preview')startSession(draft,'preview');
    else if(action==='case-preview'){const item=casesList().find(item=>item.id===id);if(item)startSession(item,'case');}
    else if(action==='review')review();
    else if(action==='review-saved'){const item=items.find(item=>item.id===id);if(item){edit(item);review();}}
    else if(action==='publish')publish();
    else if(action==='teach-current'&&draft?._publication)startSession(draft._publication.draft,'classroom');
    else if(action==='teach'){const item=items.find(item=>item.id===id);if(item?._publication)startSession(item._publication.draft,'classroom');}
    else if(action==='session-exit')exitSession();
    else if(action==='session-retry')mountSession();
    else if(action==='session-copy'){exitSession();edit(M.fromCase(id,casesList()),true);}
    else if(action==='more')more(id);
    else if(action==='duplicate'){
      const source=items.find(item=>item.id===id);if(source){const copy=M.clone(source);copy.id=M.blank().id;copy.title=(copy.title||'未命名活动')+'（副本）';delete copy._publication;edit(copy,true);}
    }
    else if(action==='delete-confirm')showDialog('删除涂鸦活动',`<p>删除后，活动草稿和已确认授课版都会移除。此操作无法在页面中撤销。</p>`,B('保留活动','close')+B('确认删除','delete','primary',`data-id="${E(id)}"`));
    else if(action==='delete'){if(persist(items.filter(item=>item.id!==id))){closeDialog();render();toast('活动已删除');}else closeDialog();}
    else if(action==='reload')showDialog('重新载入活动',`<p>重新读取此浏览器保存的最新记录。页面里尚未保存的修改会被替换，可先导出当前内容留存。</p>`,B('先导出当前内容','export')+B('取消','close')+B('重新载入','reload-confirm','primary'));
    else if(action==='reload-confirm')reload();
    else if(action==='save-copy')saveCopy();
    else if(action==='export')exportCurrent();
    else if(action==='platform-return'){
      if(window.parent!==window)window.parent.postMessage({type:'wellbeing:return'},location.origin);
      else navigate('music');
    }
    else if(action==='retry-load')location.reload();
    else if(action==='help')showDialog('涂鸦游戏 · 使用说明',`<p>从案例库预览玩法，点击“制作同款”修改目标词；也可以新增空白活动。手填课堂单词，生成图片示意；图片可重新生成或上传替换。${live?'配图使用平台图片服务。':'当前配图为离线交互演示。'}课堂词库支持添加和删除。Solo/PK 在课堂切换。</p><p>草稿自动保存。核对并确认授课版后，可从“我制作的”开始课堂。后续修改草稿不会改变已确认内容。</p><p>案例和备课预览中的画作、词库及设置不会回写备课内容。猜画反馈沿用原游戏的本地模拟。</p>`);
  });
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||event.origin!==location.origin||event.data?.type!=='wellbeing:visibility')return;
    if(typeof event.data.visible!=='boolean')return;
    platformVisible=event.data.visible;
    if(!platformVisible){stopWordSpeech();save(false);}
    session?.handle?.setVisible(platformVisible&&!document.hidden);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopWordSpeech();save(false);}session?.handle?.setVisible(platformVisible&&!document.hidden);});
  window.addEventListener('pagehide',()=>{stopWordSpeech();clearImages();});
  window.addEventListener('beforeunload',event=>{if((dirty||ui.wordAdd.trim()||imageJobs.size)&&!save()||cloud?.dirty){event.preventDefault();event.returnValue='';}});
  window.addEventListener('storage',event=>{
    if(cloud||event.key!==M.STORAGE_KEY)return;
    if(draft){storageError='另一个页面已更新涂鸦活动。可将当前内容另存为新活动，或导出后重新载入。';conflict=true;updateSaveUI();}
    else{const loaded=M.read(storage);if(!loaded.error){items=loaded.items;baseline=loaded.baseline;if(!session)render();else pendingHomeRefresh=true;}else{storageError=loaded.error;updateSaveUI();}}
  });
  function initialize(){
    const initial=M.read(storage);
    items=initial.items;baseline=initial.baseline;storageError=initial.error;
    if(!storageError)cloud?.importLocal();
    render();
  }
  function backendLoadError(error){
    loadError=error.message||'暂时无法读取涂鸦活动，请重试。';
    app.innerHTML=shell(`<main class="library-home" data-workbench-load-error><h1>暂时无法读取涂鸦活动</h1><p role="alert">${E(loadError)}</p>${B('重试','retry-load','primary')}</main>`,true);
  }
  try{
    cloud=api?.activityStore?.('doodle',M.STORAGE_KEY,updateSaveUI);
    if(cloud)storage=cloud.storage;
    if(cloud||caseLibrary)Promise.all([cloud?.load(),caseLibrary?.load()]).then(initialize).catch(backendLoadError);
    else initialize();
  }catch(error){backendLoadError(error);}
})();
