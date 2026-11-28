// The course, the action picker and the library read the same baked vector frames.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.YogaScene = factory(root.YogaScene, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (original, environment = globalThis) {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const reduced = environment.matchMedia?.('(prefers-reduced-motion: reduce)');

  function clipFor(page, settings) {
    return environment.YogaModel?.clipForPage(page, settings);
  }

  function actor(clip) {
    if (!clip) return '<span class="yc-motion-missing" role="status">此页暂无对应动作</span>';
    const url = escape(clip.url), frame = Math.round((clip.frameCount - 1) * .52);
    const title = escape(clip.characterId + ' · ' + clip.name);
    return '<svg class="yc-actor" viewBox="0 0 240 218" role="img" aria-label="' + title +
      '" data-yc-rig="' + escape(clip.characterId) + '" data-yc-action="' + escape(clip.poseId) +
      '" data-clip-url="' + url + '" data-frame-count="' + clip.frameCount + '"><use href="' + url + '#f' + frame + '"/></svg>';
  }

  function renderCourseScene(page, settings, options = {}) {
    const title = options.showLabel !== false && page.kind === 'cover' ? '<h2 class="yc-title">' + escape(page.title) + '</h2>' : '';
    return '<section class="yoga-scene yc-scene' + (options.compact ? ' yc-compact' : '') + '" data-yoga-scene aria-label="' + escape(page.title) +
      '"><div class="yc-stage">' + (options.backgroundMarkup || original.renderBackground(page, settings)) + title + actor(clipFor(page, settings)) + '</div>' +
      (page.english ? '<p class="yc-caption" lang="en">' + escape(page.english) + '</p>' : '') + '</section>';
  }

  function renderReference(page, settings) {
    if (page.wonder || !clipFor(page, settings) && page.backendPose === undefined && !page.backgroundUrl) return original.renderReference(page, settings);
    return '<section class="yoga-reference yc-reference" data-yoga-reference>' + actor(clipFor(page, settings)) + '</section>';
  }

  function setProgress(container, progress) {
    original.setProgress(container, progress);
    if (!container?.querySelectorAll) return;
    const t = reduced?.matches ? .52 : Math.min(1, Math.max(0, Number(progress) || 0));
    for (const svg of container.querySelectorAll('[data-clip-url]')) {
      const index = t === 1 ? 0 : Math.floor(t * Number(svg.dataset.frameCount));
      const use = svg.querySelector('use');
      const href = svg.dataset.clipUrl + '#f' + index;
      if (use.getAttribute('href') !== href) use.setAttribute('href', href);
    }
  }
  function renderCharacter(id) {
    const clip = environment.YogaModel?.motionClip(id, 'guide');
    if (!clip) return original.renderCharacter?.(id) || '';
    return '<span class="yc-avatar" role="img" aria-label="' + escape(id) + '"><svg viewBox="40 35 160 175" aria-hidden="true"><use href="' + escape(clip.url) + '#f0"/></svg></span>';
  }
  return {...original, renderCourseScene, renderReference, setProgress, clipFor, renderCharacter};
});
