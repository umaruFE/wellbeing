(() => {
  'use strict';

  const beat = 1900;
  const moves = ['squat', 'sidebend', 'balance', 'armsup'];
  const labels = {
    squat: 'Squat', sidebend: 'Side bend', balance: 'Balance', armsup: 'Arms up'
  };
  const example = {
    words: ['We', '___', 'together', 'every', 'weekend'], blankIndex: 1,
    acts: [
      ['cook', '🍳'], ['watch films', '🍿'], ['play chess', '♟️'],
      ['go hiking', '🥾'], ['have a picnic', '🧺']
    ].map(([text, em]) => ({ text, em })).concat({ text: 'say your own', own: true })
  };
  const lesson = SS_DATA || example;
  const colors = ['#ffd3c2', '#c7e3ff', '#d9d2ff', '#bde8c9', '#ffe7a8', '#ffd6e8'];
  const activities = lesson.acts.map((act, i) => ({ ...act, color: colors[i % colors.length] }));
  let moveIndex = 0;
  const words = lesson.words.map((word, i) => {
    if (i === lesson.blankIndex) return { blank: true };
    const fallback = moves[moveIndex++ % moves.length];
    const saved = lesson.moves?.[i];
    return { word, move: moves.includes(saved) ? saved : fallback };
  });

  const byId = id => document.getElementById(id);
  const stage = byId('stage'), sentence = byId('sent'), chips = byId('chips');
  const read = byId('readBtn'), done = byId('doneBtn'), tip = byId('tip'), notes = byId('notes');
  stage.style.setProperty('--words-coach-beat', beat + 'ms');
  let choice = null, active = -1, sequence = false, paused = false, hasRead = false, finished = false;
  let timer = null, remaining = beat, due = 0;

  function cue(index) {
    const entry = words[index];
    if (!entry.blank) return { word: entry.word, move: entry.move, label: labels[entry.move] };
    if (!choice) return { word: '___', label: 'Pick an activity' };
    return { word: choice.own ? 'Your phrase' : choice.text, label: 'Your move' };
  }

  function activityIcon(act) {
    return SpeakIcon(act.own ? '💬' : act.em || '💬');
  }

  function drawSentence() {
    sentence.innerHTML = words.map((entry, index) => {
      const { word, move, label } = cue(index);
      const empty = entry.blank && !choice;
      const figure = empty ? '?' : entry.blank ? activityIcon(choice) : WordsCoach.figure(move);
      const fillColor = entry.blank && choice ? ' style="background-color:' + choice.color + '"' : '';
      return '<button type="button" class="col' + (entry.blank ? ' fill-word' : '') +
        '" data-index="' + index + '" aria-label="' + SS_ESCAPE(word + ' · ' + label) +
        '"' + (empty ? ' disabled' : '') + '><span class="word">' + SS_ESCAPE(word) +
        '</span><span class="disc' + (entry.blank ? ' free-move' : '') + '"' + fillColor + ' aria-hidden="true">' + figure +
        '</span><span class="move-name">' + SS_ESCAPE(label) + '</span></button>';
    }).join('');
  }

  chips.innerHTML = activities.map((act, i) =>
    '<button type="button" class="opt" data-sp="' + i + '" aria-pressed="false">' +
    '<span class="circ" style="background-color:' + act.color + '" aria-hidden="true">' +
    activityIcon(act) + '</span><span class="lab">' +
    SS_ESCAPE(act.text) + '</span></button>').join('');

  function syncControls() {
    const running = active >= 0 && sequence;
    read.disabled = !choice || finished;
    read.textContent = running ? (paused ? '▶ RESUME' : 'Ⅱ PAUSE') :
      (hasRead ? '↺ READ AGAIN' : '▶ READ & MOVE');
    done.disabled = !choice;
    done.className = done.disabled ? 'big ghost' : 'big go';
    done.textContent = finished ? '↺ PLAY AGAIN' : '✓ COMPLETE';
    if (finished) tip.textContent = 'Round complete!';
    else if (active >= 0) {
      const { word, label } = cue(active);
      tip.textContent = (paused ? 'Paused · ' : '') + (active + 1) + ' / ' + words.length + ' · ' + word + ' — ' + label;
    } else tip.textContent = hasRead ? 'Read it again, or choose COMPLETE.' :
      choice ? 'Read the sentence together, or tap a word to practise.' : 'Pick an activity to begin, or tap a word to try its move.';
  }

  function clearClock() {
    if (timer !== null) SS_LIFECYCLE.clearTimeout(timer);
    timer = null;
  }

  function stopBeat() {
    clearClock();
    if (active >= 0) {
      const card = sentence.children[active];
      card.classList.remove('is-reading');
      card.removeAttribute('aria-current');
    }
    active = -1;
    sequence = false;
    paused = false;
    stage.classList.remove('is-paused');
  }

  function syncClock() {
    if (active < 0) return;
    const held = paused || SS_LIFECYCLE.paused || notes.classList.contains('on');
    stage.classList.toggle('is-paused', held);
    if (held && timer !== null) {
      remaining = Math.max(0, due - performance.now());
      clearClock();
    } else if (!held && timer === null) {
      due = performance.now() + remaining;
      timer = SS_LIFECYCLE.setTimeout(() => {
        timer = null;
        if (sequence && active + 1 < words.length) startBeat(active + 1, true);
        else {
          if (sequence) hasRead = true;
          stopBeat();
          syncControls();
        }
      }, remaining);
    }
  }

  function startBeat(index, wholeSentence) {
    if (finished || sentence.children[index]?.disabled) return;
    const repeat = index === active;
    stopBeat();
    active = index;
    sequence = wholeSentence;
    remaining = beat;
    const card = sentence.children[index];
    if (repeat) void card.offsetWidth; // Replay a tapped pose from its first keyframe.
    card.classList.add('is-reading');
    card.setAttribute('aria-current', 'step');
    if (sentence.scrollWidth > sentence.clientWidth) {
      sentence.scrollLeft = card.offsetLeft - (sentence.clientWidth - card.offsetWidth) / 2;
    }
    syncClock();
    syncControls();
  }

  chips.addEventListener('click', event => {
    const button = event.target.closest('button[data-sp]');
    if (!button || finished) return;
    stopBeat();
    choice = activities[Number(button.dataset.sp)];
    hasRead = false;
    for (const chip of chips.children) {
      chip.classList.toggle('sel', chip === button);
      chip.setAttribute('aria-pressed', String(chip === button));
    }
    drawSentence();
    startBeat(0, true);
  });
  sentence.addEventListener('click', event => {
    const card = event.target.closest('button[data-index]');
    if (card && !card.disabled) startBeat(Number(card.dataset.index), false);
  });
  read.addEventListener('click', () => {
    if (active >= 0 && sequence) {
      paused = !paused;
      syncClock();
      syncControls();
    } else startBeat(0, true);
  });

  function complete() {
    if (!choice || SS_LIFECYCLE.paused) return;
    if (finished) {
      location.reload();
      return;
    }
    stopBeat();
    finished = true;
    for (const button of [...sentence.children, ...chips.children]) button.disabled = true;
    syncControls();
  }
  done.addEventListener('click', complete);

  notes.querySelector('.card').replaceChildren(byId('words-help').content.cloneNode(true));
  const help = byId('helpBtn'), close = byId('closeNotes');
  function closeHelp() {
    notes.classList.remove('on');
    syncClock();
    help.focus();
  }
  help.addEventListener('click', () => {
    notes.classList.add('on');
    syncClock();
    close.focus();
  });
  close.addEventListener('click', closeHelp);
  notes.addEventListener('click', event => { if (event.target === notes) closeHelp(); });
  document.addEventListener('keydown', event => {
    if (notes.classList.contains('on')) {
      if (event.key === 'Escape') { event.preventDefault(); closeHelp(); }
      else if (event.key === 'Tab') { event.preventDefault(); close.focus(); }
      return;
    }
    if (event.code === 'Space' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey &&
        !event.target.closest('button,input,textarea,select,[contenteditable="true"]')) {
      event.preventDefault();
      complete();
    }
  }, true);
  drawSentence();
  syncControls();
  SS_LIFECYCLE.subscribe(syncClock);
  addEventListener('pagehide', stopBeat);
})();
