/* Versioned illustration adapter. Existing courses keep their original renderer. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.YogaScene = factory(root.YogaScene, root.YogaWonderCase, root.YogaWonderMotionRenderer);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (original, W, motion) {
  'use strict';
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const specification = page => page?.wonder?.templateId === W.templateId && Number.isInteger(page.wonder.source)
    ? W.pages[page.wonder.source] : null;
  function actorFor(page, spec) {
    return page.kind === 'action' ? W.pages.find(item => item.actionId === page.actionId) || spec : spec;
  }
  function actorMarkup(spec, className = '') {
    const c = spec.character;
    let style = '', ratio = '';
    if (c.original_display_crop) {
      const crop = c.original_display_crop.css_image;
      const [width, height] = c.original_display_crop.viewport_px;
      ratio = `--ratio:${width / height};`;
      style = `width:${crop.width};height:${crop.height};left:${crop.left};top:0;`;
    } else {
      const [width, height] = c.dimensions_px, [left, top, right, bottom] = c.visible_alpha_bbox_px;
      const visibleWidth = right - left, visibleHeight = bottom - top;
      ratio = `--ratio:${visibleWidth / visibleHeight};`;
      style = `width:${width / visibleWidth * 100}%;height:${height / visibleHeight * 100}%;left:${-left / visibleWidth * 100}%;top:${-top / visibleHeight * 100}%;`;
    }
    return `<div class="yw-actor yw-pose-${escape(spec.kind)} ${className}" style="${ratio}"${spec.actionId ? ` data-yw-motion="${escape(spec.kind)}"` : ''} role="img" aria-label="${escape(spec.pose || W.character.name)}"><div class="yw-sprite"><img src="${escape(c.path)}" alt="" style="${style}" draggable="false"></div></div>`;
  }
  function backgroundMarkup(page, settings, spec) {
    if (page.scene !== spec.scene) return `<div class="yw-generated-background">${original.renderBackground(page, settings)}</div>`;
    return `<img class="yw-background" src="${escape(spec.background)}" alt="${escape(page.scene)}" draggable="false">`;
  }
  function render(page, settings, options = {}) {
    const spec = specification(page);
    if (!spec) return original.render(page, settings, options);
    const actor = actorFor(page, spec), unchangedCopy = page.english === spec.sourceText;
    const unchangedAction = page.actionId === spec.actionId;
    // Pose names belong to teacher references; the teaching scene carries the story.
    let heading = page.kind === 'action' ? '' : spec.heading, caption = spec.caption;
    if (page.kind === 'action') {
      if (!unchangedCopy) caption = escape(page.english);
    } else if (!unchangedCopy) {
      heading = escape(page.english); caption = '';
    }
    return `<section class="yoga-scene yoga-wonder yw-${escape(spec.kind)}${page.kind === 'action' ? ' yw-action' : ''}${options.compact ? ' yw-compact' : ''}${page.look === 'bright' ? ' yw-bright' : ''}${!unchangedAction ? ' yw-custom-pose' : ''}${!unchangedCopy && page.kind !== 'action' ? ' yw-edited-copy' : ''}" data-yoga-scene data-wonder-source="${spec.source}" aria-label="${escape(page.title)}">
      ${backgroundMarkup(page, settings, spec)}${heading ? `<h2 class="yw-headline" lang="en">${heading}</h2>` : ''}<div class="yw-mat" aria-hidden="true"></div>${actorMarkup(actor)}
      ${caption ? `<p class="yw-caption${spec.longCaption || page.english.length > 120 ? ' long' : ''}" lang="en">${caption}</p>` : ''}</section>`;
  }
  function renderBackground(page, settings) {
    const spec = specification(page);
    if (!spec) return original.renderBackground(page, settings);
    return `<section class="yoga-scene yoga-wonder${page.look === 'bright' ? ' yw-bright' : ''}" role="img" aria-label="${escape(page.scene)}">${backgroundMarkup(page, settings, spec)}</section>`;
  }
  function renderReference(page, settings) {
    const spec = specification(page);
    if (!spec) return original.renderReference(page, settings);
    const actor = actorFor(page, spec);
    return `<section class="yoga-reference yw-reference" data-yoga-reference aria-label="${escape(actor.pose || W.character.name)}"><div class="yw-reference-art">${actorMarkup(actor)}</div><span class="yw-reference-caption">${escape(actor.pose || W.character.name)} · 动作示范</span></section>`;
  }
  function renderCharacter(id) {
    if (id !== W.character.id) return '';
    return `<span class="yw-avatar" role="img" aria-label="${escape(W.character.name)}">${actorMarkup(W.pages[0])}</span>`;
  }
  const setProgress = motion ? (container, progress) => { original.setProgress(container, progress); motion.setProgress(container, progress); } : original.setProgress;
  return { ...original, render, renderBackground, renderReference, renderCharacter, setProgress };
});
