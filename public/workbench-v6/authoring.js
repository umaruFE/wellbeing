/* Presentation only: keep the fixed action bar within its workspace and reserve
 * its measured height. No storage, navigation, or module state is changed. */
(function () {
  'use strict';
  let main = null;
  let footer = null;
  let pending = false;
  const resize = new ResizeObserver(schedule);
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(sync);
  }
  function sync() {
    pending = false;
    const nextMain = document.querySelector('.wb-authoring');
    const nextFooter = document.querySelector('.wb-authoring-footer');
    if (nextMain !== main || nextFooter !== footer) {
      resize.disconnect();
      main = nextMain;
      footer = nextFooter;
      if (main) resize.observe(main);
      if (footer) resize.observe(footer);
    }
    if (!main) {
      document.documentElement.style.setProperty('--wb-authoring-footer-height', '0px');
      return;
    }
    if (!footer) {
      main.style.setProperty('--wb-authoring-footer-height', '0px');
      document.documentElement.style.setProperty('--wb-authoring-footer-height', '0px');
      return;
    }
    const bounds = main.getBoundingClientRect();
    if (!bounds.width) return;
    const left = `${Math.round(bounds.left)}px`;
    const width = `${Math.round(bounds.width)}px`;
    if (footer.style.left !== left) footer.style.left = left;
    if (footer.style.width !== width) footer.style.width = width;
    footer.style.right = 'auto';
    const height = `${Math.ceil(footer.getBoundingClientRect().height)}px`;
    if (main.style.getPropertyValue('--wb-authoring-footer-height') !== height) {
      main.style.setProperty('--wb-authoring-footer-height', height);
    }
    if (document.documentElement.style.getPropertyValue('--wb-authoring-footer-height') !== height) {
      document.documentElement.style.setProperty('--wb-authoring-footer-height', height);
    }
  }
  function start() {
    new MutationObserver(schedule).observe(document.body, {childList: true, subtree: true});
    addEventListener('resize', schedule, {passive: true});
    document.fonts?.ready.then(schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
