(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./word-images.js') : root.DoodleWordImages);
  api.factory = factory;
  if (typeof module === 'object' && module.exports) module.exports = Object.freeze(api);
  else root.DoodleClassroomWordBank = Object.freeze(api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (imageTools) {
  'use strict';

  // The controller only adds/removes words in the original Word Bank draft.
  // It never saves a lesson or accesses Storage itself.
  function createEditorController(tools, read, write) {
    let session = null, selectedId = null, pending = null;
    const undoBySet = new Map();
    function sync() {
      const current = read();
      if (current?.session !== session) { session = current?.session || null; undoBySet.clear(); pending = null; }
      if (current?.id !== selectedId) { selectedId = current?.id || null; pending = null; }
      return current;
    }
    function words() { return tools.parse(sync()?.raw || '').words; }
    function persist(result, deleted = false) {
      if (!result.ok) return result;
      const current = sync();
      if (!current) return {ok: false, error: 'index'};
      const raw = result.words.join('\n');
      if (deleted) undoBySet.set(current.id, {before: current.raw, after: raw});
      else undoBySet.delete(current.id);
      pending = null;
      write(raw);
      return result;
    }
    function commit() {
      sync();
      if (!pending) return {ok: true, words: words()};
      return persist(tools.update(words(), {type: 'add', value: pending.value}));
    }
    function guard() {
      sync();
      if (pending && !pending.value.trim()) pending = null;
      return commit();
    }
    return {
      sync, words, guard, commit,
      pending() { sync(); return pending && {...pending}; },
      setAdd(value) { sync(); pending = {value: String(value)}; },
      cancel() { pending = null; },
      remove(index) {
        const allowed = guard(); if (!allowed.ok) return allowed;
        return persist(tools.update(words(), {type: 'remove', index}), true);
      },
      canUndo() { const current = sync(), undo = undoBySet.get(current?.id); return !!undo && undo.after === current.raw; },
      undo() {
        const allowed = guard(); if (!allowed.ok) return allowed;
        const current = sync(), undo = undoBySet.get(current?.id);
        if (!undo || undo.after !== current.raw) return {ok: false, error: 'index'};
        undoBySet.delete(current.id); pending = null; write(undo.before);
        return {ok: true, words: tools.parse(undo.before).words};
      }
    };
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));
  }
  function cardMarkup(word, index, picture, icon, wordImage) {
    const E = escapeHTML;
    const key = String(word).trim().toLowerCase();
    const image = imageTools?.normalize({[key]: wordImage}, [key])[key];
    let visual = picture ? `<span class="wb-word-picture" aria-hidden="true">${E(picture)}</span>`
      : '<span class="wb-word-picture wb-no-picture">No picture</span>';
    if (image?.kind === 'upload' || image?.kind === 'ai') {
      visual = `<span class="wb-word-picture wb-upload-picture"><img src="${E(image.src)}" referrerpolicy="no-referrer" alt="${E(word)}"></span>`;
    } else if (image?.kind === 'demo' && picture) {
      visual = `<span class="wb-word-picture wb-demo-picture" data-image-variant="${image.variant}"><span aria-hidden="true">${E(picture)}</span></span>`;
    }
    const button = (action, label, symbol) => `<button type="button" data-wb-action="${action}" data-word-index="${index}" aria-label="${E(label)}" title="${E(label)}">${icon(symbol)}</button>`;
    return `<article class="wb-word-card" data-word-index="${index}">${visual}<strong class="wb-word-label" lang="en">${E(word)}</strong><div class="wb-card-actions">${button('listen', 'Listen to ' + word, 'volume')}${button('remove', 'Delete ' + word, 'trash')}</div></article>`;
  }

  function install(tools) {
    if (window.__doodleWordBankCards) return window.__doodleWordBankCards;
    const overlay = document.getElementById?.('wordOverlay');
    if (!overlay) return null; // Small runtime fixtures need no classroom UI.
    if (!tools || typeof tools.update !== 'function' || typeof tools.picture !== 'function') throw new Error('Word card tools are unavailable.');
    const original = {};
    for (const name of ['renderWordList', 'renderWordBankEditor', 'updateWordBankDraft', 'saveWords', 'switchLesson', 'addLesson', 'deleteLesson', 'closeWordModal']) {
      if (typeof window[name] !== 'function') throw new Error('Word Bank interface is incomplete: ' + name);
      original[name] = window[name];
    }
    const input = document.getElementById('wordInput');
    const errors = {
      empty: 'Enter one word first.', invalid: 'Use English letters, a hyphen or an apostrophe.',
      duplicate: 'This word is already in the set.', multiple: 'Add one word at a time.',
      index: 'This word changed. Choose it again.'
    };
    const controller = createEditorController(tools, () => {
      const set = typeof currentWordBankSet === 'function' ? currentWordBankSet() : null;
      return set && {session: wordBankDraft, id: set.id, raw: set.raw};
    }, raw => {
      input.value = raw;
      original.updateWordBankDraft();
    });
    const element = (tag, id, className) => {
      const node = document.createElement(tag); if (id) node.id = id; if (className) node.className = className; return node;
    };
    const toolbar = element('div', 'wbCardToolbar', 'wb-card-toolbar');
    toolbar.innerHTML = '<label for="wbSingleWord">Add a word</label><div class="wb-card-add-row"><input id="wbSingleWord" autocomplete="off" spellcheck="false" placeholder="e.g. apple" aria-describedby="wbCardFeedback wbSingleHelp"><button type="button" class="btn primary" data-wb-action="add">Add</button></div><small id="wbSingleHelp">Enter to add · Esc to clear</small>';
    const feedback = element('div', 'wbCardFeedback', 'wb-card-feedback');
    feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite');
    const grid = element('div', 'wbCardGrid', 'wb-card-grid');
    grid.setAttribute('aria-label', 'Words in this set');
    input.before(toolbar, feedback, grid);
    // Keep the original adapter field for capture/save functions, never as an
    // editable route around the add/delete-only word card interaction.
    input.hidden = true; input.readOnly = true; input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    document.getElementById('wordInputHelp').hidden = true;
    document.getElementById('wordPreview').hidden = true;
    overlay.querySelector('.wb-words-heading label').setAttribute('for', 'wbSingleWord');
    document.getElementById('wordBankIntro').textContent = 'Choose picture words for Solo Drawing and Drawing Duel.';
    overlay.dataset.wordCards = 'true';
    const single = document.getElementById('wbSingleWord');
    const style = element('style', 'doodle-wordbank-card-style');
    style.textContent = `
+#wordOverlay[data-word-cards] .word-bank-modal{width:980px;max-height:92dvh}
+#wordOverlay[data-word-cards] .wb-body{grid-template-columns:185px minmax(0,1fr);gap:24px;min-height:0}
+#wordOverlay[data-word-cards] .wb-library{padding-right:18px}
+#wordOverlay[data-word-cards] .wb-header{padding-bottom:18px}
+#wordOverlay[data-word-cards] .wb-words-heading{margin-top:18px;margin-bottom:10px}
+#wordOverlay .wb-card-toolbar>label{display:block;font-size:12px;margin-bottom:6px}
+#wordOverlay #wbSingleHelp{display:block;font-size:11px;color:#64745b;margin-top:6px}
+#wordOverlay .wb-card-add-row{display:flex;align-items:center;gap:8px}
+#wordOverlay #wbSingleWord{width:100%;min-width:0;box-sizing:border-box;min-height:42px;border:1.5px solid #aeb89b;border-radius:9px;background:#fffef9;color:#354d34;font:inherit;font-size:15px;padding:9px 11px}
+#wordOverlay[data-word-cards] #wordInput,#wordOverlay[data-word-cards] #wordInputHelp,#wordOverlay[data-word-cards] #wordPreview{display:none!important}
+#wordOverlay .wb-card-add-row .btn{flex:0 0 auto;min-height:42px;padding:9px 18px}
+#wordOverlay .wb-card-feedback{display:flex;align-items:center;gap:9px;flex-wrap:wrap;color:#4a613e;font-size:12px;line-height:1.5;margin-top:8px}
+#wordOverlay .wb-card-feedback:empty{display:none}
+#wordOverlay .wb-card-feedback[data-error="true"]{color:#963e2d}
+#wordOverlay .wb-card-feedback button{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:#405b37;text-decoration:underline;text-underline-offset:3px;font:inherit;font-weight:700;min-height:32px;padding:2px 5px}
+#wordOverlay .wb-card-feedback .icon{width:14px;height:14px}
+#wordOverlay .wb-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0 18px}
+#wordOverlay .wb-word-card{min-width:0;display:flex;flex-direction:column;align-items:center;border:1px solid #d1d7bf;border-radius:13px;background:#fffef7;padding:12px 9px 9px;box-shadow:none}
+#wordOverlay .wb-word-picture{display:flex;align-items:center;justify-content:center;min-height:58px;font-size:42px;line-height:1.2;margin:0 0 7px}
+#wordOverlay .wb-upload-picture,#wordOverlay .wb-demo-picture{width:100%;height:100px;border-radius:9px;overflow:hidden;background:#edf4e5}
+#wordOverlay .wb-upload-picture img{display:block;width:100%;height:100%;object-fit:contain}
+#wordOverlay .wb-demo-picture{flex-direction:column;gap:5px}
+#wordOverlay .wb-demo-picture[data-image-variant="1"]{background:#fff0d6}
+#wordOverlay .wb-demo-picture[data-image-variant="2"]{background:#e8efff}
+#wordOverlay .wb-demo-picture small{font-size:10px;line-height:1.3;color:#516145}
+#wordOverlay .wb-no-picture{font-size:11px;color:#68765c;text-align:center}
+#wordOverlay .wb-word-label{display:block;width:100%;font-size:17px;line-height:1.35;text-align:center;overflow-wrap:anywhere;font-weight:800;margin-bottom:11px}
+#wordOverlay .wb-card-actions{display:flex;justify-content:center;gap:5px;width:100%;margin-top:auto}
+#wordOverlay .wb-card-actions button{display:inline-flex;align-items:center;justify-content:center;max-width:38px;min-width:0;min-height:36px;flex:1 1 0;border:1px solid #c7cfb5;border-radius:8px;background:#f6f3e5;color:#425b39;box-shadow:none;padding:7px 5px}
+#wordOverlay .wb-card-actions .icon{width:17px;height:17px}
+#wordOverlay .wb-card-actions button:hover{background:#f4e3b4;border-color:#a39158}
+#wordOverlay .wb-card-actions [data-wb-action="remove"]{color:#8b533e}
+#wordOverlay .wb-card-empty{grid-column:1/-1;padding:18px 8px;text-align:center;color:#64745b;font-size:13px;line-height:1.6}
+#wordOverlay[data-word-cards] button:focus-visible,#wordOverlay[data-word-cards] input:focus-visible{outline:2px solid #587b41;outline-offset:3px}
+#wordOverlay[data-word-cards] button:disabled,#wordOverlay[data-word-cards] input:disabled{opacity:.55;cursor:not-allowed}
+#wordOverlay[data-word-cards] .wb-footer{flex-shrink:0}
+@media(max-width:720px){#wordOverlay[data-word-cards] .word-bank-modal{max-width:calc(100vw - 24px);max-height:94dvh}#wordOverlay[data-word-cards] .wb-body{display:block;padding:0 18px 18px}#wordOverlay[data-word-cards] .wb-library{padding:0 0 16px;border:0}#wordOverlay[data-word-cards] .wb-set-list{flex-direction:row;max-height:none}#wordOverlay[data-word-cards] .wb-set{width:150px;min-height:60px}#wordOverlay[data-word-cards] .wb-new-set{margin-top:10px;min-height:38px}#wordOverlay[data-word-cards] .wb-header{padding:20px 18px 16px}#wordOverlay[data-word-cards] .wb-header h2{font-size:24px}#wordOverlay[data-word-cards] .wb-footer{padding:12px 18px;gap:10px}#wordOverlay[data-word-cards] .wb-save-context small{display:none}}
+@media(max-width:440px){#wordOverlay .wb-card-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}#wordOverlay[data-word-cards] .wb-footer{align-items:flex-start;flex-direction:column}#wordOverlay[data-word-cards] .wb-footer-actions{width:100%;display:flex;justify-content:flex-end}#wordOverlay[data-word-cards] .wb-footer-actions .btn{min-height:40px}#wordOverlay .wb-word-label{font-size:16px}}
+`.replace(/^\+/gm, '');
    document.head.appendChild(style);

    let message = '', messageIsError = false;
    const editable = () => !!wordBankDraft && !duel && !duelSetupOpen && !pk && !wordBankConfirming;
    function renderFeedback() {
      feedback.textContent = message; feedback.dataset.error = String(messageIsError);
      if (controller.canUndo()) {
        const undo = element('button'); undo.type = 'button'; undo.dataset.wbAction = 'undo';
        undo.innerHTML = icon('undo') + 'Undo delete'; feedback.appendChild(undo);
      }
    }
    function renderCards() {
      controller.sync(); const list = controller.words(), pending = controller.pending();
      const imageSet = window.__doodleWordImageSet;
      const images = imageSet?.id === controller.sync()?.id ? imageSet.images : {};
      grid.innerHTML = list.length ? list.map((word,index) => cardMarkup(word,index,tools.picture(word),icon,
        Object.prototype.hasOwnProperty.call(images, word) ? images[word] : null)).join('')
        : '<p class="wb-card-empty">Add a word to start your picture cards.</p>';
      single.value = pending ? pending.value : '';
      renderFeedback();
    }
    function announce(text, error = false) { message = text; messageIsError = error; renderFeedback(); }
    function showError(result) {
      announce(errors[result.error] || 'Please check this word and try again.', true);
      single.setAttribute('aria-invalid', 'true'); single.focus();
      return false;
    }
    function finishPending() {
      const result = controller.guard();
      if (!result.ok) return showError(result);
      single.removeAttribute('aria-invalid'); return true;
    }
    function commit() {
      const result = controller.commit();
      if (!result.ok) return showError(result);
      renderCards(); announce(''); single.removeAttribute('aria-invalid'); single.focus(); return true;
    }
    window.renderWordList = renderCards;
    window.renderWordBankEditor = function (...args) {
      message = ''; messageIsError = false;
      const result = original.renderWordBankEditor.apply(this, args);
      controller.sync(); renderCards(); return result;
    };
    for (const name of ['switchLesson', 'addLesson', 'deleteLesson', 'closeWordModal']) {
      window[name] = function (...args) {
        if (!finishPending()) return;
        return original[name].apply(this, args);
      };
    }
    window.saveWords = function (...args) {
      if (!finishPending()) return;
      if (wordBankDraft) {
        captureWordBankEditor();
        const invalidSet = wordBankDraft.sets.find(set => tools.parse(set.raw).invalid.length);
        if (invalidSet) {
          wordBankDraft.selectedId = invalidSet.id;
          window.renderWordBankEditor();
          const parsed = tools.parse(invalidSet.raw);
          document.getElementById('wordError').textContent = 'Delete invalid words, then add the correct spelling: ' + parsed.invalid.join(', ') + '.';
          const index = parsed.words.indexOf(parsed.invalid[0]);
          grid.querySelector(`[data-word-index="${index}"] [data-wb-action="remove"]`)?.focus(); return;
        }
      }
      const result = original.saveWords.apply(this, args);
      if (wordBankDraft && document.getElementById('wordError').textContent) single.focus();
      return result;
    };
    // The original Escape/backdrop handler cached function references at load.
    if (typeof dismissDialogs === 'object' && dismissDialogs) dismissDialogs.wordOverlay = window.closeWordModal;
    overlay.addEventListener('input', event => {
      if (event.target === single) { controller.setAdd(single.value); single.removeAttribute('aria-invalid'); announce(''); }
    });
    overlay.addEventListener('click', event => {
      const button = event.target.closest('[data-wb-action]'); if (!button || !editable()) return;
      const action = button.dataset.wbAction, index = Number(button.dataset.wordIndex);
      event.preventDefault();
      if (action === 'listen') { speakWord(controller.words()[index]); return; }
      if (action === 'add') { controller.setAdd(single.value); commit(); return; }
      if (action === 'remove' || action === 'undo') {
        const result = action === 'remove' ? controller.remove(index) : controller.undo();
        if (!result.ok) {showError(result); return;}
        renderCards(); announce(action === 'remove' ? 'Word deleted.' : 'Word restored.');
        (feedback.querySelector('button') || single).focus();
      }
    });
    // Enter adds a word; Escape clears pending input without closing its draft.
    document.addEventListener('keydown', event => {
      if (!overlay.classList.contains('show') || wordBankConfirming || event.isComposing) return;
      if (event.target === single && ['Enter','Escape'].includes(event.key)) {
        event.preventDefault(); event.stopImmediatePropagation();
        if (event.key === 'Escape') {controller.cancel(); renderCards(); announce(''); single.removeAttribute('aria-invalid'); single.focus();}
        else {controller.setAdd(single.value); commit();}
      }
    }, true);
    const api = Object.freeze({controller, originals: Object.freeze(original), refresh: renderCards});
    Object.defineProperty(window, '__doodleWordBankCards', {value: api});
    renderCards();
    return api;
  }
  return {createEditorController, cardMarkup, install};
});
