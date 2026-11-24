/* Shared platform presentation and routing requests. The app owns save guards,
   drafts, classroom visibility and every business action. */
(function (root) {
  'use strict';

  const MODULE = 'move-match';
  const moduleIds = new Set(['song', 'music', 'yoga', 'speak', 'doodle', MODULE]);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
  const embedded = () => root.parent !== root && new URLSearchParams(root.location.search).get('embedded') === '1';
  const icon = name => root.WBUI?.icon?.(name) || '';
  let navigating = false, forwardingNavigation = false;

  function navigation() {
    // Earlier platform releases do not register move-match. Keep their content
    // usable without copying a menu or pretending another module is selected.
    try {
      const html = root.WBPlatform?.navigation?.(MODULE);
      if (typeof html !== 'string' || !html.includes('unified-navigation')) return {html:'', id:''};
      const id = html.match(/<aside\b[^>]*\bid="([^"]+)"/i)?.[1];
      return id ? {html, id} : {html:'', id:''};
    } catch (_) { return {html:'', id:''}; }
  }

  function shell(content, home) {
    const nav = navigation();
    const menu = nav.id ? `<button type="button" class="quiet library-navigation-toggle" data-ui="button" data-ui-variant="ghost" data-action="nav" aria-controls="${escape(nav.id)}" aria-expanded="false" aria-label="打开模块导航">${icon('menu') || '导航'}</button>` : '';
    const backLabel = embedded() ? '返回上个模块' : '返回平台';
    const topbar = `<header class="topbar unified-topbar"><div class="mm-topbar-title">${menu}<strong>创作工坊 / 分类游戏</strong></div><div class="mm-topbar-actions"><button type="button" class="quiet" data-ui="button" data-ui-variant="ghost" data-ui-size="sm" data-action="platform-return">${icon('arrow-left')}<span>${backLabel}</span></button><span class="avatar">教师</span></div></header>`;
    const main = home ? `<main id="main" class="library-home mm-library" tabindex="-1">${content}</main>` : content;
    return `<div class="shell mm-shell ${home ? 'mm-home-shell' : 'editor-mode'}${nav.id ? ' expanded' + (home ? ' library-mode' : '') : ' mm-without-navigation'}">${nav.html}<div class="workspace">${topbar}${main}</div></div>`;
  }

  function homeShell(content) { return shell(content, true); }
  function editorShell(content) { return shell(content, false); }
  function homeHeading(actionsHtml = '') {
    return `<header class="lh-header"><h1>分类游戏</h1><div class="lh-header-actions">${actionsHtml}</div></header>`;
  }
  function decorate(scope = root.document) { root.WBUI?.decorate?.(scope); }

  async function navigate(message, module) {
    if (navigating) return false;
    navigating = true;
    try {
      if (embedded()) {
        if (!root.location.origin || root.location.origin === 'null') return false;
        root.parent.postMessage(message, root.location.origin);
        return true; // Request sent; the parent still owns guard and visibility.
      }
      // Do not create a nested platform inside an unregistered foreign frame.
      if (root.parent !== root || typeof root.WBPrepareModuleSwitch !== 'function') return false;
      if (await root.WBPrepareModuleSwitch() !== true) return false;
      root.location.href = '../prep-workbench-six-modules-v1/latest.html#' + module;
      return true;
    } finally { navigating = false; }
  }

  function requestModule(module) {
    if (!moduleIds.has(module) || module === MODULE) return Promise.resolve(false);
    return navigate({type:'wellbeing:module', module}, module);
  }
  function returnToPlatform() { return navigate({type:'wellbeing:return'}, 'music'); }

  function toggleNav() {
    // The shared platform handles the actual narrow-screen drawer. Its capture
    // handler normally consumes the user's click before the app sees it. This
    // forwarding path also supports callers without a second drawer state.
    if (forwardingNavigation) return false;
    const trigger = root.document.querySelector('.mm-shell .library-navigation-toggle');
    if (!trigger) return false;
    const before = root.document.body.hasAttribute('data-navigation-open');
    forwardingNavigation = true;
    try { trigger.click(); }
    finally { forwardingNavigation = false; }
    return root.document.body.hasAttribute('data-navigation-open') !== before;
  }

  root.MMPlatform = Object.freeze({homeShell, editorShell, homeHeading, decorate, requestModule, returnToPlatform, toggleNav, embedded});
})(window);
