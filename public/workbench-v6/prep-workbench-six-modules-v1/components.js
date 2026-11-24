/* Shared presentation adapter. Never owns business actions, state or storage. */
(function(root){
  'use strict';
  const scope='.library-home,.unified-prep-main,.unified-prep-footer,.topbar,.unified-navigation,dialog#dialog,.unified-experience-header,.fullscreen-preview-main,.fullscreen-preview-footer,.fullscreen,.classroom,.recorder,.fullscreen-footer,.class-navigation,.experience-display-tools,.unified-experience-tabs,.activity-bank-tabs,.component-lab';
  const groups='.segmented,.activity-mode-switch,.hunter-content-switch,.resource-tabs,.editor-tabs,.unified-experience-tabs,.preview-activities,.experience-display-tools,.unified-audio-modes,.activity-bank-tabs,.lh-filters,.lh-tabs';
  const special='.token,.lyric-word,.blank,.blank-slot,.workspace-blank,.workspace-word,.wordcard,.word-card,.preview-line,.step,.navitem,.portal-item,.question-open,.question-row,.echo-word,.play,.round,.play-button,.choice,.image-card,.instrument,.singer-source,.prep-material-tab';
  // Resource choices keep their composition; ordinary actions share Button.
  const resourceChoices='.character,.quick-melody,.track-choice,.song-source,.song-option';
  const composedActions='.fullscreen-preview-button,.teaching-entry';
  const iconPaths={
    sparkle:'<path d="M12 2C10.8 7.8 7.8 10.8 2 12c5.8 1.2 8.8 4.2 10 10 1.2-5.8 4.2-8.8 10-10-5.8-1.2-8.8-4.2-10-10Z" fill="currentColor" stroke="none"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',
    edit:'<path d="m16 3 5 5-12 12-6 1 1-6Z M14 5l5 5"/>',
    trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    undo:'<path d="m9 5-5 5 5 5M4 10h10a6 6 0 0 1 0 12"/>',
    'chevron-left':'<path d="m15 6-6 6 6 6"/>','chevron-right':'<path d="m9 6 6 6-6 6"/>',
    'arrow-left':'<path d="M20 12H4m6-6-6 6 6 6"/>',
    eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    stop:'<rect x="5" y="5" width="14" height="14" rx="1"/>',
    play:'<path d="m8 4 12 8-12 8Z"/>',
    pause:'<path d="M8 5v14M16 5v14"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3" fill="var(--color-surface)"/><circle cx="16" cy="17" r="3" fill="var(--color-surface)"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1.1-1.2 2.3M12 17h.01"/>',
    book:'<path d="M12 5v15M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Z"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    volume:'<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
    refresh:'<path d="M20 7v5h-5M4 17v-5h5M5.5 7a7.5 7.5 0 0 1 12.5-2l2 2M4 17l2 2a7.5 7.5 0 0 0 12.5-2"/>',
    shuffle:'<path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3.5-2 5-4.5M14 8.5C15.2 7 16.5 6 18 6h3m-4-4 4 4-4 4"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    grip:'<path d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 5 5 3-3 5 5"/>',
    maximize:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>'
  };
  const escapeAttribute=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function icon(name){return iconPaths[name]?`<svg class="wb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${iconPaths[name]}</svg>`:'';}
  function button(label,action,classes='',attrs=''){
    // Controllers opt in explicitly; their actions, scope and state stay intact.
    if(/\bdata-ai-adjust=["']true["']/.test(attrs)){
      const context=escapeAttribute(String(label).replace(/<[^>]*>/g,'').trim());
      if(!/aria-label=/.test(attrs))attrs+=` aria-label="${context.startsWith('AI 调整')?context:'AI 调整：'+context}"`;
      attrs+=' data-icon="sparkle"';
      classes=classes.split(/\s+/).filter(c=>c&&!['primary','secondary','quiet','flat','small','tiny'].includes(c)).concat('secondary').join(' ');
      const scope=attrs.match(/data-ai-scope=["'](page|course)["']/)?.[1];
      label=scope==='page'?'AI 调整本页':scope==='course'?'AI 调整整课':'AI 调整';
    }
    const iconOnly=attrs.match(/data-icon-only=["']([^"']+)["']/)?.[1],name=iconOnly||attrs.match(/data-icon=["']([^"']+)["']/)?.[1],svg=icon(name);
    if(svg){
      const accessible=attrs.match(/aria-label=(["'])(.*?)\1/)?.[2]||escapeAttribute(String(label).replace(/<[^>]*>/g,'').trim());
      if(!/aria-label=/.test(attrs))attrs+=` aria-label="${accessible}"`;
      if(!/\btitle=/.test(attrs))attrs+=` title="${accessible}"`;
      label=iconOnly?svg:`${svg}<span>${label}</span>`;
    }
    return `<button type="button" class="${classes}" data-action="${action}" ${attrs}>${label}</button>`;
  }
  // Explicit mapping from existing markup to one component contract. Data-action,
  // roles, selected/disabled state and focus are owned by the module controller.
  function describe(el){
    const c=el.classList,inside=s=>!!el.closest(s);
    // Feedback and review recipes are presentational. Progress values, task
    // cancellation and publication checks remain owned by each module.
    if(c.contains('review-diff'))return {kind:'review-diff'};
    if(c.contains('review-evidence'))return {kind:'review-evidence'};
    if(el.matches('.spinner,.generation-spinner'))return {kind:'spinner',size:inside('.loader-panel,.loading,.question-generating,.course-adjustment-progress')?'lg':'sm'};
    if(el.matches('.progress,.progress-line'))return {kind:'progress',variant:inside('.fullscreen,.fullscreen-playback')?'inverse':'default'};
    if(el.matches('.loader-panel,.loading,.question-generating,.course-adjustment-progress'))return {kind:'loading',variant:c.contains('loader-panel')?'panel':'region'};
    if(c.contains('job-strip'))return {kind:'task-status'};
    if(el.matches('.lh-empty,.home-empty,.library-empty,.empty,.empty-type,.melody-empty,.reuse-empty,.adjustment-empty,.workspace-empty,.background-placeholder'))return {kind:'empty',variant:c.contains('lh-empty')?'page':c.contains('background-placeholder')?'media':el.matches('.empty-type,.reuse-empty')?'inline':c.contains('workspace-empty')?'context':'region'};
    // Classroom song summaries use the activity scene's typography and colour.
    if(!inside('.song-scene-dialog')){
      if(el.matches('.review-list,.review-lines,.review-grid,.checklist'))return {kind:'review-list',variant:c.contains('review-grid')?'grid':'list'};
      if(el.matches('.review-row,.review-line,.review-card,.review-item')||el.matches('label')&&inside('.checklist'))return {kind:'review-item',variant:c.contains('review-row')?'indexed':c.contains('review-card')?'activity':el.matches('label')?'check':c.contains('review-item')?'content':'text'};
    }
    if(c.contains('unified-review-summary'))return {kind:'review-summary'};
    if(c.contains('ready-mark'))return {kind:'readiness-mark'};
    if(c.contains('reason-list'))return {kind:'review-reasons'};
    if(inside('.unified-prep-main,.component-lab')){
      if(c.contains('panel'))return {kind:'panel',variant:el.matches('.preview-card,.song-score')?'flush':el.matches('.question-edit-panel,.song-bank-panel')?'compact':'default'};
      if(el.matches('.stack,.content-column,.preview-column,.two-col,.readiness-grid,.workbench,.assets-layout,.arranger'))return {kind:'panel-layout'};
    }
    // Composite controls share a full recipe; the adapter never changes their
    // children, event targets, ARIA semantics or controller-owned selection.
    if(el.matches('.badge,.chip,.goal-chip'))return {kind:'badge',variant:el.matches('.ready,.green,.dark,.used')?'success':el.matches('.warning,.yellow,.amber,.unused')?'warning':c.contains('error')?'error':el.matches('.purple,.draft')?'accent':'neutral'};
    if(el.matches('.tags,.target-tags'))return {kind:'tag-list',variant:c.contains('tags')?'field':'plain'};
    if(c.contains('target-tag')||c.contains('singer-chip')||(c.contains('tag')&&inside('.tags')))return {kind:'tag',variant:c.contains('singer-chip')?'person':'text',selected:String(c.contains('editing'))};
    if(c.contains('notice')){
      const variant=el.matches('.error,.storage-alert')?'error':el.matches('.warning,.amber')?'warning':'info';
      return {kind:variant!=='info'||el.matches('.undo-strip,.version-note,.job-result')||['alert','status'].includes(el.getAttribute('role'))?'alert':'help',variant,layout:c.contains('undo-strip')?'actions':'text'};
    }
    if(el.matches('.upload-label,.upload-button'))return {kind:'upload'};
    if(c.contains('question-row'))return {kind:'editor-item',variant:'question',selected:String(c.contains('selected')),...(c.contains('question-summary-row')?{layout:'summary'}:{})};
    if(c.contains('placement-slot'))return {kind:'resource-pair',selected:String(c.contains('has-value'))};
    if(el.matches('button')){
      if(el.getAttribute('data-ai-adjust')==='true')return {kind:'button',variant:'secondary',size:'md',icon:'false'};
      if(el.getAttribute('data-icon-only'))return {kind:'button',variant:el.matches('.danger')?'danger':el.matches('.primary')?'primary':el.matches('.flat,.quiet')?'ghost':'secondary',size:'md',icon:'true'};
      if(c.contains('unified-return'))return {kind:'button',variant:'return',size:'md',icon:'false'};
      if(c.contains('slot-choice'))return {kind:'resource-slot'};
      if(c.contains('slot-remove'))return {kind:'resource-remove'};
      if(el.matches('.target-tag-text,.target-tag-remove,.singer-chip-remove')||inside('.tags .tag'))return {kind:'tag-action',variant:el.matches('.target-tag-remove,.singer-chip-remove')||el.getAttribute('data-action')==='tag-remove'?'remove':'edit'};
      if(c.contains('singer-add'))return {kind:'button',variant:'secondary',size:'md',icon:'false'};
      if(el.matches('.overview-line-button,.page-item'))return {kind:'editor-item',variant:c.contains('page-item')?'page':'lyric',selected:String(c.contains('active')||inside('.is-editing')||el.getAttribute('aria-current')==='true')};
      if(c.contains('question-open'))return {kind:'editor-content',...(c.contains('question-summary-open')?{layout:'summary'}:{})};
      if(c.contains('question-drag-handle'))return {kind:'drag-handle'};
      if(el.matches('.picture,.candidate-picture')||inside('.image-options,.hint-grid'))return {kind:'image-picker',size:c.contains('picture')?'lg':inside('.hint-grid')?'fluid':'md',variant:inside('.image-options,.hint-grid')?'emoji':'thumbnail'};
      if(c.contains('unified-nav-backdrop'))return null;
      if(el.hasAttribute?.('data-platform-nav-close'))return {kind:'button',variant:'ghost',size:'sm',icon:'false'};
      if(inside('.unified-navigation'))return {kind:'navigation'};
      if(c.contains('step')||inside('.unified-prep-steps,.prep-steps,.steps'))return {kind:'step'};
      if(inside(groups))return {kind:inside('.lh-tabs')?'tab':'toggle',size:inside('.unified-audio-modes')?'sm':'md'};
      if(inside('.unified-player')&&(c.contains('play')||c.contains('round')))return {kind:'play',variant:'primary',size:'lg'};
      if(c.contains('play-button'))return {kind:'button',variant:'primary',size:'lg',icon:'false'};
      if(c.contains('prep-material-entry'))return {kind:'disclosure',variant:'card'};
      if(el.matches(resourceChoices))return {kind:'choice',variant:c.contains('track-choice')?'embedded':'resource'};
      if(el.matches('.choice,.image-card,.instrument,.singer-source,.prep-material-tab')||inside('.hint-grid,.character-strip,.singer-inline-options'))return {kind:'choice',variant:c.contains('choice')?'card':'resource'};
      if(el.matches(special)||inside('.echo-lines,.lyric-pick,.workspace-lines,.word-sort-tokens'))return null;
      if(!inside(scope))return null;
      // Illustrated covers, lyric editors and line navigation are composed
      // controls, not ordinary action buttons. Keep their task geometry.
      const plainState=/^(selected|active)$/.test(el.className.trim());
      if(el.className.trim()&&!plainState&&!el.matches('.primary,.secondary,.danger,.quiet,.flat,.small,.tiny,.icon,.icon-btn,.ui-dialog-close,.lh-more')&&!el.matches(composedActions))return null;
      const variant=c.contains('primary')?'primary':c.contains('danger')?'danger':c.contains('quiet')||c.contains('flat')||inside('.unified-back-link,.prep-eyebrow,.topbar')?'ghost':'secondary';
      const icon=el.matches('.icon,.icon-btn,.ui-dialog-close,.lh-more');
      const size=inside('.unified-prep-footer,.prep-head-actions,.dialog-foot,.dialogfoot,.lh-header-actions')?'md':c.contains('small')||c.contains('tiny')||inside('.topbar,.prep-header-status')?'sm':'md';
      return {kind:'button',variant,size,icon:icon?'true':'false'};
    }
    if(el.matches('input,textarea,select')){
      if(!inside(scope)&&!inside('.unified-player'))return null;
      if(el.matches('[type=hidden]'))return null;
      if(el.matches('[type=file]'))return el.matches('.hide,[hidden]')?null:{kind:'file',embedded:inside('.upload-label,.upload-button')?'true':'false'};
      if(el.matches('[type=checkbox],[type=radio]'))return {kind:'check'};
      if(el.matches('[type=range]'))return {kind:'range',size:inside('.unified-player')?(el.getAttribute('aria-label')==='音量'?'sm':'md'):'fluid'};
      return {kind:'field',size:inside('.unified-player,.target-entry')?'sm':'md',embedded:inside('.lh-search,.target-input-box')?'true':'false'};
    }
    if(c.contains('library-track'))return {kind:'choice',variant:'surface'};
    if(el.matches('label')&&inside(scope))return {kind:'label'};
    if(el.matches('summary')&&inside(scope))return {kind:'disclosure'};
    return null;
  }
  // Field presentation only; controllers retain validation and saving rules.
  function setFieldError(field,descriptionId,invalid){
    if(!field)return;
    const descriptions=new Set((field.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));
    if(invalid){field.setAttribute('aria-invalid','true');descriptions.add(descriptionId);}
    else{field.removeAttribute('aria-invalid');descriptions.delete(descriptionId);}
    if(descriptions.size)field.setAttribute('aria-describedby',[...descriptions].join(' '));
    else field.removeAttribute('aria-describedby');
  }
  const adapted=new WeakSet();
  const presentationAttributes=['data-ui','data-ui-variant','data-ui-size','data-ui-icon','data-ui-embedded','data-ui-selected','data-ui-layout'];
  function decorate(host){
    for(const group of host.querySelectorAll('.segmented'))group.setAttribute('data-ui-group','segmented');
    for(const group of host.querySelectorAll('.preview-activities,.unified-experience-tabs'))group.setAttribute('data-ui-group','experience');
    for(const el of host.querySelectorAll('button,input,select,textarea,summary,label,.library-track,.badge,.chip,.goal-chip,.tags,.target-tags,.tags .tag,.target-tag,.singer-chip,.notice,.question-row,.placement-slot,.spinner,.generation-spinner,.progress,.progress-line,.loader-panel,.loading,.question-generating,.course-adjustment-progress,.job-strip,.lh-empty,.home-empty,.library-empty,.empty,.empty-type,.melody-empty,.reuse-empty,.adjustment-empty,.workspace-empty,.background-placeholder,.review-diff,.review-evidence,.review-list,.review-lines,.review-grid,.checklist,.review-row,.review-line,.review-card,.review-item,.unified-review-summary,.ready-mark,.reason-list,.panel,.stack,.content-column,.preview-column,.two-col,.readiness-grid,.workbench,.assets-layout,.arranger')){
      const spec=describe(el);
      if(adapted.has(el))for(const attr of presentationAttributes){const key=attr==='data-ui'?'kind':attr.slice(8);if(!spec||!(key in spec))el.removeAttribute(attr);}
      if(!spec)continue;
      adapted.add(el);
      for(const [key,value] of Object.entries(spec)){const attr=key==='kind'?'data-ui':'data-ui-'+key;if(el.getAttribute(attr)!==value)el.setAttribute(attr,value);}
    }
  }
  const api={button,icon,describe,decorate,setFieldError};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.WBUI=api;
  if(typeof document!=='undefined'){
    const hosts=[document.getElementById('app'),document.getElementById('dialog')].filter(Boolean);
    hosts.forEach(decorate);
    if(typeof MutationObserver==='function')for(const host of hosts){
      const observer=new MutationObserver(()=>decorate(host));
      observer.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-current']});
    }
  }
})(typeof window!=='undefined'?window:globalThis);
