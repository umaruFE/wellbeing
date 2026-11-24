(() => {
  'use strict';

  const MAX_LEVEL = 130;
  const HISTORY_MS = 3000;
  const HISTORY_WIDTH = 160;
  const HISTORY_HEIGHT = 24;
  const COUNTDOWN_SECONDS = 3;
  // Pitch is measured from the screen plane toward the student.
  const RECORDING_PITCH = 42 * Math.PI / 180;
  const VOICES = [
    { name: 'SOFT', hint: 'Whisper', range: [10, 52] },
    { name: 'MEDIUM', hint: 'Talking voice', range: [50, 80] },
    { name: 'LOUD', hint: 'Loud & clear', range: [80, 127] }
  ];
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  const microphoneWaves = stage.querySelector('.mic-sound-waves');
  const line = $('line');
  const linewrap = $('linewrap');
  const readingCue = linewrap.querySelector('.reading-cue');
  const picks = $('picks');
  const meter = $('meter');
  const fill = $('fill');
  const target = $('target');
  const targetLabel = $('volume-target');
  const historyTarget = $('volume-history-target');
  const historyLine = $('volume-history-line');
  const value = $('mVal');
  const feedback = $('volume-feedback');
  const tip = $('tip-copy');
  const countdownValue = $('countdown-value');
  const drawButton = $('drawBtn');
  const recordButton = $('recBtn');
  const doneButton = $('doneBtn');
  const notes = $('notes');
  let selected = null;
  let phase = 'ready';
  let capture = null;

  const title = stage.querySelector('.title h1');
  const plaque = document.createElement('div');
  plaque.className = 'title-plaque';
  plaque.setAttribute('aria-hidden', 'true');
  plaque.innerHTML = '<svg viewBox="548 14 758 104" preserveAspectRatio="none"><image href="../assets/volume-v3/school-radio.png" width="1736" height="906"/></svg>';
  title.before(plaque);
  title.innerHTML = '<svg class="title-lettering" viewBox="0 0 525 60" aria-hidden="true"><text x="262.5" y="45" text-anchor="middle">Volume <tspan class="challenge">Challenge</tspan></text></svg>';
  title.setAttribute('aria-label', 'Volume Challenge · 声音广播站');

  const status = document.createElement('div');
  status.className = 'broadcast-status';
  status.setAttribute('aria-hidden', 'true');
  status.innerHTML = '<i></i><span></span>';
  stage.append(status);
  const statusText = status.querySelector('span');

  const monitor = document.createElement('div');
  monitor.className = 'monitor-skin';
  monitor.setAttribute('aria-hidden', 'true');
  monitor.innerHTML = '<svg viewBox="510 182 715 354" preserveAspectRatio="none"><clipPath id="monitor-outline"><rect x="513" y="183" width="710" height="312" rx="36"/><rect x="811" y="491" width="113" height="43" rx="6"/></clipPath><use href="#room-art" clip-path="url(#monitor-outline)"/></svg>';
  stage.querySelector('.studio-wall').append(monitor);

  const drawIcon = '<svg viewBox="0 0 26 26" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="4" fill="#fff4dc" stroke="currentColor" stroke-width="2"/><g fill="currentColor"><circle cx="8" cy="8" r="1.7"/><circle cx="18" cy="8" r="1.7"/><circle cx="13" cy="13" r="1.7"/><circle cx="8" cy="18" r="1.7"/><circle cx="18" cy="18" r="1.7"/></g></svg>';
  const replayIcon = '<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M5 10a9 9 0 1 1 0 7M5 4v6h6" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const checkIcon = '<svg viewBox="0 0 26 26" aria-hidden="true"><path d="m5 13 5 5L22 6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const recordIcon = '<svg viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="7" fill="currentColor"/></svg>';
  const stopIcon = '<svg viewBox="0 0 26 26" aria-hidden="true"><rect x="6" y="6" width="14" height="14" rx="2" fill="currentColor"/></svg>';
  const channelShapes = [
    ['335 558 353 155', 'M389 560H667Q685 560 683 579L671 695Q670 710 651 710H352Q331 710 337 690L367 578Q371 560 389 560Z'],
    ['695 558 353 155', 'M725 560H1011Q1027 560 1029 580L1038 694Q1039 710 1020 710H716Q693 710 696 691L705 580Q706 560 725 560Z'],
    ['1050 558 353 155', 'M1071 560H1348Q1363 560 1368 578L1397 691Q1402 710 1384 710H1080Q1064 710 1062 694L1051 579Q1049 560 1071 560Z']
  ];
  function channelSurface(index) {
    const [box, path] = channelShapes[index];
    return `<svg class="channel-surface" aria-hidden="true" viewBox="${box}" preserveAspectRatio="none"><path class="channel-depth" transform="translate(0 6)" d="${path}"/><path class="channel-face" d="${path}"/></svg>`;
  }
  function speaker(index) {
    const color = ['#60a45d', '#d7a231', '#e97670'][index];
    const waves = Array.from({ length: index + 1 }, (_, n) =>
      `<path d="M${27+n*5} ${18-n*4}q${3+n} ${3+n*4} 0 ${6+n*8}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`
    ).join('');
    return `<svg viewBox="0 0 42 42" aria-hidden="true"><path d="M7 16h7l9-7v24l-9-7H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" fill="#b58be2" stroke="#72508c" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 16v10l9 7V9Z" fill="#fff4dc" stroke="#72508c" stroke-width="1.8" stroke-linejoin="round"/>${waves}</svg>`;
  }
  picks.innerHTML = VOICES.map((voice, index) => {
    const bars = Array.from({ length: 5 }, (_, bar) =>
      `<i class="${bar <= index * 2 ? 'lit' : ''}" style="--bar-height:${7 + bar * 4}px"></i>`
    ).join('');
    return `<div class="pick" role="group" aria-label="${voice.name} · ${voice.hint}">${channelSurface(index)}${speaker(index)}<span class="channel-copy"><span class="nm">${voice.name}</span><span class="hint">${voice.hint}</span></span><span class="channel-bars" aria-hidden="true">${bars}</span><span class="channel-lamp" aria-hidden="true"></span></div>`;
  }).join('');
  const cards = [...picks.children];

  line.innerHTML = SS_ESCAPE(SS_DATA?.line ?? 'There are [four] people in my family.')
    .replace(/\[([^\]]+)\]/g, '<span class="rep">$1</span>');

  function updateReadingCue() {
    const atEnd = line.scrollTop + line.clientHeight >= line.scrollHeight - 2;
    readingCue.textContent = atEnd ? 'End of text' : 'Scroll to read more';
  }
  function fitText() {
    linewrap.dataset.overflow = 'false';
    for (let size = 32; size >= 26; size--) {
      line.style.fontSize = size + 'px';
      if (line.scrollHeight <= line.clientHeight) break;
    }
    const overflow = line.scrollHeight > line.clientHeight;
    linewrap.dataset.overflow = String(overflow);
    if (overflow) line.tabIndex = 0;
    else line.removeAttribute('tabindex');
    updateReadingCue();
  }
  function fitScene() {
    stage.style.transform = 'scale(' + Math.min(innerWidth / 1280, innerHeight / (1280 * 906 / 1736)) + ')';
    fitText();
  }
  line.addEventListener('scroll', updateReadingCue);
  addEventListener('resize', fitScene);
  document.fonts.ready.then(fitText);

  function createMicrophoneStand(rig) {
    const stand = rig.querySelector('.mic-stand');
    const elbow = rig.querySelector('.mic-elbow-rig');
    const footX = 636;
    const footY = 846;
    const dx = 702 - footX;
    const dy = 389 - footY;
    return degrees => {
      const radians = -degrees * Math.PI / 180;
      const cosine = Math.cos(radians);
      const sine = Math.sin(radians);
      const x = dx * (cosine - 1) - dy * sine;
      const y = dx * sine + dy * (cosine - 1);
      stand.setAttribute('transform', `rotate(${-degrees} ${footX} ${footY})`);
      elbow.setAttribute('transform', `translate(${x} ${y})`);
      return { x, y };
    };
  }

  const percent = level => (level / MAX_LEVEL * 100) + '%';
  const historyY = level => 1 + (1 - level / MAX_LEVEL) * (HISTORY_HEIGHT - 2);

  function paintMicrophoneHead(rig) {
    const collar = rig.querySelector('.mic-collar');
    const barrel = rig.querySelector('.mic-barrel');
    const vents = rig.querySelector('.mic-vents');
    const shell = rig.querySelector('.mic-shell');
    const lamp = rig.querySelector('.mic-recording-led');
    // Axial stations and radii follow the illustrated cream ferrule and the single coral capsule.
    const collarProfile = [[21,43],[26,61],[33,74],[41,85],[49,91],[58,94],[71,94],[81,89],[87,80]];
    const barrelProfile = [[85,45],[88,61],[93,71],[100,77],[111,79],[213,79],[229,78],[244,74],[257,67],[269,56],[278,42],[285,26],[288,0]];
    const normals = Array.from({ length: 96 }, (_, i) => {
      const angle = i * Math.PI / 48;
      return [Math.cos(angle), Math.sin(angle)];
    });

    function silhouette(profile, crossSectionDepth, length, magnify) {
      const rings = profile.map(([station, radius]) => {
        const scale = magnify(station);
        return { y: station * length * scale, r: radius * scale };
      });
      const points = normals.map(([nx, ny]) => {
        const supportRadius = Math.hypot(nx, ny * crossSectionDepth);
        let rim = rings[0], greatest = -Infinity;
        for (const ring of rings) {
          const support = ring.y * ny + ring.r * supportRadius;
          if (support > greatest) { greatest = support; rim = ring; }
        }
        const x = rim.r * nx / supportRadius;
        const y = rim.y + rim.r * ny * crossSectionDepth ** 2 / supportRadius;
        return x.toFixed(2) + ',' + y.toFixed(2);
      });
      return 'M' + points.join('L') + 'Z';
    }

    // Rounded slots are cut in three bands around the casing. At rest the two outer
    // bands wrap out of view at the edges, just as they do on the activity cover.
    const slots = [];
    for (const [station, radius] of [[160,79],[205,79],[249,72]]) {
      for (const [angle, halfAngle] of [[-.29,.55],[1.16,.35],[-1.52,.25]]) {
        slots.push(Array.from({ length: 32 }, (_, i) => {
          const t = i * Math.PI / 16;
          const u = Math.cos(t), v = Math.sin(t);
          const azimuth = Math.max(-Math.PI / 2, Math.min(Math.PI / 2,
            angle + halfAngle * Math.sign(u) * Math.abs(u) ** .52));
          return { x: radius * Math.sin(azimuth), z: radius * Math.cos(azimuth),
            y: station + 8.3 * Math.sign(v) * Math.abs(v) ** .52 };
        }));
      }
    }

    return function project(pitchRadians, totalRollDegrees) {
      const facing = Math.sin(pitchRadians);
      const length = Math.cos(pitchRadians);
      const magnify = station => 745 / (745 - station * facing);
      // The cover already reveals the near side of each rim in its parked pose.
      const crossSectionDepth = .48 * length + .64 * facing;
      collar.setAttribute('d', silhouette(collarProfile, crossSectionDepth, length, magnify));
      barrel.setAttribute('d', silhouette(barrelProfile, crossSectionDepth, length, magnify));
      vents.setAttribute('d', slots.map(slot => 'M' + slot.map(({ x, y, z }) => {
        const scale = magnify(y);
        return (x * scale).toFixed(2) + ',' + ((y * length - z * crossSectionDepth) * scale).toFixed(2);
      }).join('L') + 'Z').join(''));

      const tipY = 267 * length * magnify(267);
      shell.setAttribute('transform', `translate(0 ${tipY - 267})`);
      // The tally lamp sits below the central slots on the near side of the curved nose.
      const lampScale = magnify(275);
      const lampY = (275 * length - 41 * crossSectionDepth) * lampScale;
      lamp.setAttribute('transform', `translate(${-10 * lampScale} ${lampY - tipY}) scale(${lampScale * .88} ${lampScale * .84})`);
      // The pulse follows the same pickup, behind the casing, throughout the swing.
      const waveScale = magnify(239);
      const waveY = 236 * length * waveScale;
      microphoneWaves.setAttribute('transform', `translate(0 ${waveY}) scale(${waveScale * .9} ${waveScale * .84})`);

      const roll = totalRollDegrees * Math.PI / 180;
      return { x: -Math.sin(roll) * tipY, y: Math.cos(roll) * tipY };
    };
  }

  function createMicrophoneRig() {
    const rig = stage.querySelector('.scene-microphone');
    const upper = rig.querySelector('.mic-upper-arm');
    const forearm = rig.querySelector('.mic-boom');
    const wrist = rig.querySelector('.mic-wrist');
    const head = rig.querySelector('.mic-capsule');
    const projectHead = paintMicrophoneHead(rig);
    const tiltStand = createMicrophoneStand(rig);
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const rad = Math.PI / 180;
    const upperLength = Math.hypot(268, 304), lowerLength = Math.hypot(104, 113);
    const upperRest = Math.atan2(-304, -268), forearmRest = Math.atan2(113, -104);
    const parkedX = 304 - 267 * Math.sin(24 * rad), parkedY = 259 + 267 * Math.cos(24 * rad);
    let goal = 0, motion = null, frame = null;

    function ease(t) {
      t = Math.min(1, Math.max(0, t));
      // Ease only near the endpoints so the turn stays visible through all three beats.
      const ramp = .15;
      const end = Math.min(t, 1 - t);
      if (end >= ramp) return (t - ramp / 2) / (1 - ramp);
      const u = end / ramp;
      const distance = ramp * u ** 3 * (1 - u / 2) / (1 - ramp);
      return t < .5 ? distance : 1 - distance;
    }

    function bezier(a, b, c, d, t) {
      const u = 1 - t;
      return u ** 3 * a + 3 * u ** 2 * t * b + 3 * u * t ** 2 * c + t ** 3 * d;
    }

    function paint(time) {
      // Guide the pickup along one arc. The two arm links solve backwards from the
      // wrist, so turning a long barrel towards the viewer never pulls the tip back.
      const travel = ease(time);
      const sweep = Math.sin(Math.PI * travel);
      const roll = 24 + (48 - 24) * travel + 4 * sweep;
      const wristAngle = -13 * travel + 4 * sweep;
      const pitch = RECORDING_PITCH * travel;
      const elbow = tiltStand(13 * ease(time / .92));
      const tip = projectHead(pitch, roll);
      const wx = Math.cos(wristAngle * rad), wy = Math.sin(wristAngle * rad);
      const x = bezier(parkedX, 127, 65, 64, travel) - tip.x - (-26 * wx - 61 * wy) - (702 + elbow.x);
      const y = bezier(parkedY, 515, 466, 397, travel) - tip.y - (-26 * wy + 61 * wx) - (389 + elbow.y);

      const cosine = (x * x + y * y - upperLength ** 2 - lowerLength ** 2) / (2 * upperLength * lowerLength);
      const bend = -Math.acos(Math.max(-1, Math.min(1, cosine)));
      const upperAngle = Math.atan2(y, x) - Math.atan2(lowerLength * Math.sin(bend), upperLength + lowerLength * Math.cos(bend));
      const relativeAngle = (angle, rest) => Math.atan2(Math.sin(angle - rest), Math.cos(angle - rest)) / rad;
      const upperTurn = relativeAngle(upperAngle, upperRest);
      const forearmTurn = relativeAngle(upperAngle + bend, forearmRest);
      upper.setAttribute('transform', `rotate(${upperTurn})`);
      forearm.setAttribute('transform', `rotate(${forearmTurn - upperTurn})`);
      wrist.setAttribute('transform', `rotate(${wristAngle - forearmTurn})`);
      head.setAttribute('transform', `rotate(${roll - 24 - wristAngle})`);
    }

    function settle() {
      SS_LIFECYCLE.cancelAnimationFrame(frame);
      frame = null;
      motion = null;
      paint(goal);
      rig.style.visibility = 'visible';
    }

    // Crossfade playback velocity when direction changes mid-swing. Integrating
    // smoothstep keeps both position and velocity continuous at the reversal.
    function playhead(now) {
      const elapsed = Math.max(0, (now - motion.start) / 1000);
      const ramp = motion.ramp;
      const u = ramp ? Math.min(1, elapsed / ramp) : 1;
      const rateChange = motion.toRate - motion.fromRate;
      const rampDistance = ramp * (motion.fromRate * u + rateChange * u ** 3 * (1 - .5 * u));
      const position = motion.from + rampDistance + motion.toRate * Math.max(0, elapsed - ramp);
      return { position: Math.max(0, Math.min(1, position)), rate: motion.fromRate + rateChange * u * u * (3 - 2 * u) };
    }

    function returnFrame(now) {
      frame = null;
      const { position, rate } = playhead(now);
      if (position === 0 && rate <= 0) {
        settle();
        return;
      }
      paint(position);
      frame = SS_LIFECYCLE.requestAnimationFrame(returnFrame);
    }

    function startMotion(next, now) {
      const current = motion ? playhead(now) : { position: goal, rate: 0 };
      SS_LIFECYCLE.cancelAnimationFrame(frame);
      frame = null;
      goal = next;
      if (reducedMotion.matches || SS_LIFECYCLE.paused) {
        settle();
        return;
      }
      const room = current.rate < 0 ? current.position : 1 - current.position;
      const ramp = current.rate ? Math.min(.26, room / Math.abs(current.rate)) : 0;
      // A restarted take gets the full countdown even halfway through the return.
      const toRate = next ? (1 - current.position - current.rate * ramp / 2) / (COUNTDOWN_SECONDS - ramp / 2) : -1 / 1.8;
      motion = { start: now, from: current.position, fromRate: current.rate, toRate, ramp };
    }

    settle();
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) settle(); });
    return {
      startTurn(now) { startMotion(1, now); },
      drawTurn(now, finished) {
        if (!motion) return;
        if (finished) settle();
        else paint(playhead(now).position);
      },
      park() {
        if (goal === 0 && !SS_LIFECYCLE.paused) return;
        startMotion(0, performance.now());
        if (motion) frame = SS_LIFECYCLE.requestAnimationFrame(returnFrame);
      }
    };
  }

  const microphone = createMicrophoneRig();

  function selectVoice(voice) {
    selected = voice;
    cards.forEach((card, index) => {
      const level = VOICES[index];
      card.classList.toggle('sel', voice === level);
      card.setAttribute('aria-label', level.name + ' · ' + level.hint + (voice === level ? ' · Target level' : ''));
    });
    target.hidden = !voice;
    targetLabel.textContent = 'Target —';
    historyTarget.setAttribute('height', '0');
    if (!voice) return;
    const [low, high] = voice.range;
    target.style.left = percent(low);
    target.style.width = percent(high - low);
    targetLabel.textContent = `Target ${voice.name} · ${low}–${high}`;
    historyTarget.setAttribute('y', historyY(high));
    historyTarget.setAttribute('height', historyY(low) - historyY(high));
  }

  function plotHistory(samples, level, now) {
    samples.push({ time: now, level });
    const start = now - HISTORY_MS;
    while (samples[0].time < start) samples.shift();
    const points = samples.map(sample => {
      const x = (sample.time - start) / HISTORY_MS * HISTORY_WIDTH;
      return `${x.toFixed(2)},${historyY(sample.level).toFixed(2)}`;
    });
    historyLine.setAttribute('points', points.join(' '));
  }

  function renderLevel(level = null) {
    const rounded = Math.round(level);
    const [low, high] = selected?.range ?? [0, MAX_LEVEL];
    const label = rounded < low ? 'Too quiet' : rounded > high ? 'Too loud' : 'In range';
    const measured = level !== null;
    // Use the meter's RMS sample. Leave a small noise floor so silence clears the ripples.
    const energy = Math.sqrt(Math.max(0, rounded - 3) / (MAX_LEVEL - 3));
    microphoneWaves.style.setProperty('--mic-energy', energy.toFixed(3));
    const message = measured ? label : phase === 'live' ? 'Listening…' : selected ? 'Ready to measure' : 'Choose a level';
    fill.style.width = percent(rounded);
    value.textContent = measured ? rounded : '—';
    feedback.textContent = message;
    feedback.dataset.level = measured ? label.toLowerCase().replace(' ', '-') : '';
    meter.setAttribute('aria-valuenow', rounded);
    meter.setAttribute('aria-valuetext', measured ? `${rounded} · ${label}` : message);
  }

  function showPhase(next, message) {
    phase = next;
    stage.dataset.broadcast = next;
    statusText.textContent = {
      ready: 'READY', drawing: 'TUNING…', selected: 'READY', requesting: 'MIC CHECK',
      countdown: 'GET READY', live: 'ON AIR', complete: 'ALL DONE'
    }[next];
    const preparing = next === 'requesting' || next === 'countdown';
    const occupied = next === 'drawing' || preparing || next === 'live';
    const finished = next === 'complete';
    drawButton.disabled = occupied || finished;
    drawButton.classList.toggle('hint', next === 'ready');
    recordButton.disabled = !selected || finished;
    doneButton.disabled = !selected || occupied;
    drawButton.innerHTML = drawIcon + '<span>' + (next === 'drawing' ? 'TUNING…' : selected ? 'DRAW AGAIN' : 'DRAW A LEVEL') + '</span>';
    const recordLabel = preparing ? 'CANCEL' : next === 'live' ? 'STOP RECORDING' : 'START RECORDING';
    recordButton.innerHTML = (next === 'live' ? stopIcon : recordIcon) + '<span>' + recordLabel + '</span>';
    doneButton.innerHTML = (finished ? replayIcon : checkIcon) + '<span>' + (finished ? 'PLAY AGAIN' : 'COMPLETE') + '</span>';
    tip.textContent = message;
    renderLevel();
    historyLine.removeAttribute('points');
  }

  function drawLevel() {
    if (drawButton.disabled || SS_LIFECYCLE.paused) return;
    selectVoice(null);
    showPhase('drawing', 'Drawing a voice level…');
    let index = 0;
    const roll = SS_LIFECYCLE.setInterval(() => {
      cards.forEach((card, position) => card.classList.toggle('roll', position === index));
      index = (index + 1) % cards.length;
    }, 75);
    SS_LIFECYCLE.setTimeout(() => {
      SS_LIFECYCLE.clearInterval(roll);
      cards.forEach(card => card.classList.remove('roll'));
      selectVoice(VOICES[Math.floor(Math.random() * VOICES.length)]);
      showPhase('selected', 'Press START RECORDING when you’re ready.');
    }, 740);
  }

  function stopRecording(message) {
    const current = capture;
    if (!current) return;
    capture = null;
    SS_LIFECYCLE.cancelAnimationFrame(current.countdownFrame);
    SS_LIFECYCLE.clearInterval(current.timer);
    current.stream?.getTracks().forEach(track => track.stop());
    current.context?.close().catch(() => {});
    microphone.park();
    showPhase('selected', message);
  }

  function beginSampling(current, analyser) {
    const buffer = new Uint8Array(analyser.fftSize);
    const samples = [];
    showPhase('live', 'Recording started. Read aloud now.');
    current.timer = SS_LIFECYCLE.setInterval(() => {
      analyser.getByteTimeDomainData(buffer);
      let sum = 0;
      for (const sample of buffer) sum += (sample - 128) ** 2;
      const level = Math.sqrt(sum / buffer.length);
      renderLevel(level);
      plotHistory(samples, level, performance.now());
    }, 45);
  }

  function beginCountdown(current, analyser) {
    const start = performance.now();
    const deadline = start + COUNTDOWN_SECONDS * 1000;
    let remaining = COUNTDOWN_SECONDS;
    const message = () => `Recording starts in ${remaining}…`;
    microphone.startTurn(start);
    countdownValue.textContent = remaining;
    showPhase('countdown', message());
    function advance(now) {
      if (capture !== current) return;
      const millisecondsLeft = Math.max(0, deadline - now);
      microphone.drawTurn(now, millisecondsLeft === 0);
      if (millisecondsLeft === 0) {
        current.countdownFrame = null;
        beginSampling(current, analyser);
        return;
      }
      const next = Math.min(COUNTDOWN_SECONDS, Math.ceil(millisecondsLeft / 1000));
      if (remaining !== next) {
        remaining = next;
        countdownValue.textContent = remaining;
        tip.textContent = message();
      }
      current.countdownFrame = SS_LIFECYCLE.requestAnimationFrame(advance);
    }
    advance(start);
  }

  async function startRecording() {
    if (phase !== 'selected' || SS_LIFECYCLE.paused) return;
    const current = {};
    capture = current;
    showPhase('requesting', 'Allow microphone access to start.');
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Microphone unavailable');
      current.context = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false }
      });
      if (capture !== current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      current.stream = stream;
      const analyser = current.context.createAnalyser();
      analyser.fftSize = 512;
      current.context.createMediaStreamSource(stream).connect(analyser);
      stream.getAudioTracks().forEach(track => track.addEventListener('ended', () => {
        if (capture === current) stopRecording('Microphone disconnected. Press START RECORDING to try again.');
      }));
      await current.context.resume();
      if (capture !== current) return;
      beginCountdown(current, analyser);
    } catch (error) {
      if (capture !== current) return;
      const message = error.name === 'NotAllowedError'
        ? 'Microphone access was denied. Allow access and try again.'
        : 'Microphone unavailable. Check your microphone and try again.';
      stopRecording(message);
    }
  }

  drawButton.onclick = drawLevel;
  recordButton.onclick = () => {
    if (phase === 'live') stopRecording('Recording ended. Press COMPLETE or try again.');
    else if (phase === 'countdown') stopRecording('Countdown cancelled. Press START RECORDING to try again.');
    else if (phase === 'requesting') stopRecording('Microphone check cancelled. Press START RECORDING to try again.');
    else startRecording();
  };
  doneButton.onclick = () => {
    if (doneButton.disabled) return;
    if (phase === 'complete') {
      selectVoice(null);
      showPhase('ready', 'Draw your voice level.');
    } else {
      showPhase('complete', 'Nice work! Press PLAY AGAIN for a new level.');
    }
  };

  $('helpBtn').onclick = () => {
    notes.hidden = false;
    $('closeNotes').focus();
  };
  function closeNotes() {
    notes.hidden = true;
    $('helpBtn').focus();
  }
  $('closeNotes').onclick = closeNotes;
  notes.onclick = event => { if (event.target === notes) closeNotes(); };
  document.addEventListener('keydown', event => {
    if (!notes.hidden) {
      if (event.key === 'Escape') closeNotes();
      else if (event.key === 'Tab') event.preventDefault();
      return;
    }
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.toLowerCase() === 'r') drawLevel();
    if (event.code === 'Space' && !event.target.closest('button, [tabindex]') && !recordButton.disabled) {
      event.preventDefault();
      recordButton.click();
    }
  });

  SS_LIFECYCLE.subscribe(({ paused }) => {
    if (paused) {
      stopRecording('Recording paused. Press START RECORDING when you’re ready.');
      microphone.park();
    }
  });
  showPhase('ready', 'Draw your voice level.');
  fitScene();
})();
