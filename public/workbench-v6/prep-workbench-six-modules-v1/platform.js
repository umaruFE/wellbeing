/* Shared platform chrome. Module editors keep their own task-specific layouts. */
(function(){
  'use strict';
  // This integration workspace starts from built-in cases without importing user data.
  // Module controllers own their isolated storage; platform chrome never reads or writes it.
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const modules=[['song','歌曲编唱屋','音乐律动'],['music','星光音乐棚','音乐律动'],['yoga','互动式情境瑜伽','体感探索'],['speak','口语翻翻乐','口语表达'],['doodle','涂鸦游戏','创意表达'],['move-match','分类游戏','分类互动']];
  function navigation(active){
    const names={music:['sidebar','global-navigation','brand'],song:['sidebar','song-navigation','brand'],yoga:['portal-sidebar','yoga-navigation','portal-brand'],speak:['sidebar','speak-navigation','brand'],doodle:['sidebar','doodle-navigation','brand'],'move-match':['sidebar','move-match-navigation','brand']};
    const [cls,id,brand]=names[active];
    const actions=active==='music'?{music:'leave',song:'open-song',yoga:'open-yoga',speak:'open-speak',doodle:'open-doodle','move-match':'open-move-match'}:active==='yoga'?{music:'switch-music',song:'switch-song',yoga:'home',speak:'module',doodle:'module','move-match':'module'}:Object.fromEntries(modules.map(([id])=>[id,id===active?'home':'module']));
    // Older named builds embed the previous bridge while external pages load
    // this file live. Do not offer an entry their parent cannot open.
    let supportsSpeak=true,supportsMoveMatch=true;
    if(window.parent&&window.parent!==window){
      try{const bridge=window.parent.WBModules;if(bridge){supportsSpeak=typeof bridge.openSpeak==='function';supportsMoveMatch=typeof bridge.openMoveMatch==='function';}}
      catch(_){supportsSpeak=false;supportsMoveMatch=false;}
    }
    const visibleModules=modules.filter(([id])=>(id!=='speak'||supportsSpeak)&&(id!=='move-match'||supportsMoveMatch));
    return `<aside class="${cls} unified-navigation" id="${id}" aria-label="平台导航"><div class="unified-nav-drawer-head"><strong>课程创作</strong><button type="button" class="quiet small" data-ui="button" data-ui-variant="ghost" data-ui-size="sm" data-platform-nav-close aria-label="关闭导航">关闭 ×</button></div><div class="${brand}"><b>✧</b>CourseGen AI</div><nav aria-label="创作模块"><div class="unified-nav-label">课程创作</div>${visibleModules.map(([id,name,group])=>`<button type="button" class="navitem portal-item sub ${active===id?'active':''}" data-ui="navigation" data-action="${actions[id]}" data-module="${id}" ${active===id?'aria-current="page"':''}><strong>${name}</strong><small>${group}</small></button>`).join('')}</nav></aside><button type="button" class="unified-nav-backdrop" data-platform-nav-close aria-label="关闭导航遮罩" tabindex="-1"></button>`;
  }
  function formatTime(value){const date=new Date(value);return !value||Number.isNaN(date.getTime())?'时间未记录':date.toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});}
  function revealEditorPanel(selector,focusSelector){
    const panel=document.querySelector(selector);if(!panel)return;
    requestAnimationFrame(()=>{panel.scrollIntoView({block:'start'});document.querySelector(focusSelector)?.focus({preventScroll:true});});
  }
  function prepStep({index,label,complete=false,current=false}){
    const check='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
    return `<i class="prep-step-number">${complete&&!current?check:E(index)}</i><span class="prep-step-copy"><strong>${E(label)}</strong></span>`;
  }
  function prepNotice({text,action,attributes='',label='去补充',kind='warning'}){
    return `<div class="prep-navigation-notice ${kind==='ready'?'is-ready':kind==='info'?'is-info':'is-warning'}"><span class="prep-notice-message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="${kind==='ready'?'m7 12 3 3 7-7':'M12 7v6m0 4h.01'}"/></svg><span>${E(text)}</span></span>${action?`<button type="button" class="flat small prep-notice-action" data-action="${E(action)}" ${attributes}>${E(label)} <span aria-hidden="true">→</span></button>`:''}</div>`;
  }
  function revealPrepCurrent(){
    for(const selector of ['.unified-prep-steps [aria-current="step"]','.activity-editor-nav [aria-selected="true"]']){
      const el=document.querySelector(selector),parent=el?.parentElement;
      if(!parent||parent.scrollWidth<=parent.clientWidth)continue;
      const a=el.getBoundingClientRect(),b=parent.getBoundingClientRect();
      if(a.left<b.left||a.right>b.right)parent.scrollLeft+=a.left-b.left-(parent.clientWidth-a.width)/2;
    }
  }
  window.WBPlatform={navigation,escape:E,formatTime,revealEditorPanel,prepStep,prepNotice,revealPrepCurrent};
  document.body.classList.add('unified');
  // Narrow-screen navigation is presentation state only; module routing and
  // desktop navigation remain owned by the existing controllers.
  if(typeof window.matchMedia==='function'&&typeof MutationObserver==='function'){
    const narrow=window.matchMedia('(max-width:900px)');
    const triggerSelector='.topbar [aria-controls="song-navigation"],.topbar [aria-controls="yoga-navigation"],.topbar [aria-controls="global-navigation"],.topbar [aria-controls="speak-navigation"],.topbar [aria-controls="doodle-navigation"],.topbar [aria-controls="move-match-navigation"]';
    let opened=false,returnTarget=null,blockedWorkspace=null;
    const desktopExpanded=new WeakMap();
    function syncNavigation(){
      const nav=document.querySelector('.unified-navigation');
      if(!nav)opened=false;
      const active=narrow.matches&&opened&&!!nav;
      document.body.toggleAttribute('data-navigation-open',active);
      if(blockedWorkspace){blockedWorkspace.inert=false;blockedWorkspace=null;}
      if(nav){
        nav.inert=narrow.matches&&!active;
        if(narrow.matches)nav.setAttribute('aria-hidden',String(!active));else nav.removeAttribute('aria-hidden');
        if(active){nav.setAttribute('role','dialog');nav.setAttribute('aria-modal','true');}
        else{nav.removeAttribute('role');nav.removeAttribute('aria-modal');}
        if(active){blockedWorkspace=nav.parentElement.querySelector('.workspace,.workspace-column,.portal-workspace');if(blockedWorkspace)blockedWorkspace.inert=true;}
      }
      for(const trigger of document.querySelectorAll(triggerSelector)){
        if(narrow.matches){if(!desktopExpanded.has(trigger))desktopExpanded.set(trigger,trigger.getAttribute('aria-expanded')||'false');trigger.setAttribute('aria-expanded',String(active));}
        else if(desktopExpanded.has(trigger)){trigger.setAttribute('aria-expanded',desktopExpanded.get(trigger));desktopExpanded.delete(trigger);}
      }
    }
    function closeNavigation(restore=true){opened=false;syncNavigation();if(restore)(returnTarget?.isConnected?returnTarget:document.querySelector(triggerSelector))?.focus({preventScroll:true});}
    document.addEventListener('click',event=>{
      if(!narrow.matches)return;
      const trigger=event.target.closest(triggerSelector);
      if(trigger){event.preventDefault();event.stopImmediatePropagation();returnTarget=trigger;opened=!opened;syncNavigation();if(opened)document.querySelector('[data-platform-nav-close]')?.focus({preventScroll:true});else trigger.focus({preventScroll:true});return;}
      if(event.target.closest('[data-platform-nav-close]')){event.preventDefault();event.stopImmediatePropagation();closeNavigation();return;}
      if(opened&&event.target.closest('.unified-navigation [data-action]'))closeNavigation(false);
    },true);
    document.addEventListener('keydown',event=>{
      if(!narrow.matches||!opened)return;
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeNavigation();return;}
      if(event.key==='Tab'){
        const controls=[...document.querySelectorAll('.unified-navigation button:not(:disabled),.unified-navigation a[href]')].filter(el=>el.getClientRects().length);
        const first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    },true);
    narrow.addEventListener('change',()=>{opened=false;syncNavigation();});
    new MutationObserver(syncNavigation).observe(document.getElementById('app'),{childList:true,subtree:true});
    syncNavigation();
  }
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    const help=document.querySelector('.prep-preview-help[open],.experience-help[open],.scene-settings[open],.player-settings[open],.prep-more-menu[open],.composer-tools[open],.composer-settings[open]');if(!help)return;
    event.preventDefault();event.stopImmediatePropagation();help.open=false;help.querySelector('summary')?.focus();
  });
  document.addEventListener('click',event=>{
    for(const help of document.querySelectorAll('.prep-preview-help[open],.experience-help[open],.scene-settings[open],.player-settings[open],.prep-more-menu[open],.composer-tools[open],.composer-settings[open]'))if(!help.contains(event.target))help.open=false;
  });

  // Reserve the actual footer height, including wrapped actions and save errors.
  if(typeof ResizeObserver==='function'&&typeof MutationObserver==='function'){
  let footer=null;
  const reserve=()=>{const height=footer?.getBoundingClientRect().height||0;document.documentElement.style.setProperty('--prep-footer-height',height+'px');};
  const resize=new ResizeObserver(reserve);
  const observeFooter=()=>{const next=document.querySelector('.unified-prep-footer');if(next===footer)return;resize.disconnect();footer=next;if(footer)resize.observe(footer);reserve();};
  new MutationObserver(observeFooter).observe(document.getElementById('app'),{childList:true,subtree:true});
  observeFooter();
  }
  if(typeof MutationObserver==='function'){
    let frame;
    const reveal=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(revealPrepCurrent);};
    new MutationObserver(reveal).observe(document.getElementById('app'),{childList:true,subtree:true});
    window.addEventListener?.('resize',reveal);
  }
})();
