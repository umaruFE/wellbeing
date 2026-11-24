(() => {
  'use strict';

  const rate = 24000;
  const tau = 2 * Math.PI;
  // First three vocal-tract resonances, in Hz. Morphing them gives the entrance a syllable.
  const vowels = {
    ah: [770, 1240, 2520], eh: [565, 1830, 2700], ee: [320, 2140, 2960],
    oh: [490, 890, 2400], oo: [330, 740, 2220], er: [470, 1320, 1710],
    mm: [265, 1060, 2110]
  };
  const entrances = {
    alien(fx) {
      fx.beep(0, .19, [570, 920, 1180], 1);
      fx.beep(.22, .14, [1050, 730], .72);
      fx.beep(.40, .42, [650, 1090, 810], .9);
      fx.beep(.70, .19, [1230, 920], .19);
    },
    monster(fx) {
      const throat = { size: .76, rough: .85, breath: .11 };
      fx.voice(0, .57, [80, 100, 124, 92], 'er', 'ah', throat);
      fx.voice(.57, .39, [99, 77, 72], 'oh', 'mm', throat);
    },
    robot(fx) {
      const chip = { size: .95, metal: true };
      fx.voice(0, .18, [144], 'ee', 'ee', chip);
      fx.voice(.23, .17, [144], 'eh', 'eh', chip);
      fx.voice(.45, .32, [120], 'oh', 'oo', chip);
    },
    witch(fx) {
      const laugh = { size: 1.13, breath: .24, rough: .14, vibrato: .026 };
      fx.voice(.02, .18, [278, 358, 245], 'eh', 'ah', laugh);
      fx.voice(.24, .15, [318, 380, 269], 'ee', 'eh', laugh);
      fx.voice(.45, .16, [302, 351, 243], 'ee', 'eh', laugh);
      fx.voice(.65, .27, [310, 256, 207], 'eh', 'ah', laugh);
    },
    pirate(fx) {
      const hearty = { size: .94, rough: .40, breath: .15, vibrato: .016 };
      fx.air(0, .10, 1350, .09);
      fx.voice(.05, .32, [128, 191, 152], 'ah', 'er', hearty);
      fx.voice(.43, .49, [159, 186, 134, 106], 'ah', 'er', hearty);
    },
    lion(fx) {
      fx.air(0, 1.13, 720, .48);
      fx.voice(.06, .93, [65, 112, 123, 86, 58], 'ah', 'oh',
        { size: .66, breath: .6, rough: .94, attack: .16, release: .28 });
      fx.air(.90, .29, 470, .18);
    },
    baby(fx) {
      const coo = { size: 1.26, breath: .07, vibrato: .022 };
      fx.voice(0, .53, [306, 416, 461, 370], 'oo', 'ah', coo);
      fx.voice(.62, .38, [380, 443, 326], 'eh', 'oo', coo);
    },
    grandma(fx) {
      const hum = { size: 1.01, breath: .08, vibrato: .022, attack: .09, release: .14 };
      fx.voice(0, .46, [191, 218, 220], 'mm', 'oo', hum);
      fx.voice(.43, .70, [218, 244, 219, 187], 'oo', 'mm', hum);
    }
  };

  function contour(values, progress) {
    const point = Math.min(1, progress) * (values.length - 1);
    const i = Math.floor(point);
    const t = point - i;
    return values[i] + ((values[i + 1] ?? values[i]) - values[i]) * t * t * (3 - 2 * t);
  }

  function render(name) {
    const track = new Float32Array(Math.ceil(rate * 1.25));
    // A repeatable noise source makes a role sound the same when its card is revisited.
    let seed = 1;
    for (const c of name) seed = Math.imul(seed, 31) + c.charCodeAt(0);
    function noise() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2147483648 - 1;
    }
    let end = 0;
    function layer(start, duration, attack, release, sample) {
      const offset = Math.round(start * rate);
      const count = Math.round(duration * rate);
      end = Math.max(end, offset + count);
      for (let i = 0; i < count; i++) {
        const t = i / rate;
        const edge = Math.min(1, t / attack, (count - 1 - i) / (rate * release));
        track[offset + i] += sample(i, t, i / (count-1)) * edge * edge * (3 - 2 * edge);
      }
    }
    function voice(start, duration, notes, from, to, options) {
      const { size, rough = 0, breath = 0, vibrato = 0, metal = false,
        attack = metal ? .008 : .034, release = metal ? .014 : .077 } = options;
      const filters = [95, 138, 203].map((bandwidth, i) => {
        const radius = Math.exp(-Math.PI * bandwidth / rate);
        return { radius, decay: radius ** 2, weight: [1, .61, .30][i], a: 0, b: 0, last: 0, older: 0 };
      });
      let phase = 0, cycle = 0, previousFlow = 0, slowNoise = 0;
      layer(start, duration, attack, release, (i, t, progress) => {
        const white = noise();
        slowNoise += .018 * (white - slowNoise);
        const frequency = contour(notes, progress) *
          (1 + vibrato * Math.sin(tau * 5.1 * t) + rough * .075 * slowNoise);
        phase += frequency / rate;
        if (phase >= 1) { phase -= 1; cycle++; }
        // The glottis opens gradually, closes faster, then stays closed until the next pulse.
        const flow = phase < .43 ? .5 - .5 * Math.cos(Math.PI * phase / .43)
          : phase < .61 ? .5 + .5 * Math.cos(Math.PI * (phase - .43) / .18) : 0;
        const pulse = (flow - previousFlow) * rate / frequency * .27;
        previousFlow = flow;
        const drive = pulse * (1 - rough * (cycle % 2) * .72) + breath * white;
        let result = 0;
        for (let k = 0; k < filters.length; k++) {
          const f = filters[k];
          if ((i & 31) === 0) {
            const hz = size * (vowels[from][k] + progress * (vowels[to][k] - vowels[from][k]));
            const w = tau * hz / rate;
            f.a = 2 * f.radius * Math.cos(w);
            f.b = (1 - f.radius) * Math.sin(w);
          }
          const now = f.a * f.last - f.decay * f.older + f.b * drive;
          f.older = f.last;
          f.last = now;
          result += f.weight * now;
        }
        result += .06 * Math.sin(tau * phase) + rough * .045 * Math.sin(Math.PI * (cycle % 2 + phase));
        return metal ? result * (.65 + .35 * Math.cos(tau * 73 * t)) : result;
      });
    }
    function air(start, duration, cutoff, strength) {
      let low = 0, floor = 0;
      const filter = 1 - Math.exp(-tau * cutoff / rate);
      layer(start, duration, Math.min(.12, duration / 3), duration * .42, () => {
        low += filter * (noise() - low);
        floor += .022 * (low - floor);
        return strength * (low - floor);
      });
    }
    function beep(start, duration, notes, strength) {
      let phase = 0;
      layer(start, duration, .018, .074, (_i, t, progress) => {
        phase += tau * contour(notes, progress) * (1 + .025 * Math.sin(tau * 9 * t)) / rate;
        return strength * .25 * Math.sin(phase + .84 * Math.sin(2 * phase));
      });
    }
    entrances[name]({ voice, air, beep });
    const samples = track.subarray(0, end);
    let power = 0, peak = 0;
    for (const x of samples) { power += x*x; peak = Math.max(peak, Math.abs(x)); }
    const gain = Math.min(.48 / peak, .085 / Math.sqrt(power / end));
    for (let i = 0; i < end; i++) samples[i] *= gain;
    return samples;
  }

  let context = null;
  let playing = null;
  let generation = 0;
  const buffers = new Map();

  function stop() {
    generation++;
    if (!playing) return;
    const { source, volume } = playing;
    playing = null;
    const now = context.currentTime;
    volume.gain.cancelScheduledValues(now);
    if (context.state === 'running') {
      volume.gain.setValueAtTime(volume.gain.value, now);
      volume.gain.linearRampToValueAtTime(0, now + .016);
      source.stop(now + .018);
    } else {
      source.stop();
      source.disconnect();
      volume.disconnect();
    }
  }

  async function play(role) {
    stop();
    const name = String(role || '').toLowerCase().trim();
    if (!Object.hasOwn(entrances, name) || document.hidden || window.SS_LIFECYCLE?.paused) return;
    const id = generation;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!context || context.state === 'closed') {
        context = new Audio();
        buffers.clear();
      }
      const ctx = context;
      if (ctx.state !== 'running') await ctx.resume();
      if (id !== generation || ctx !== context || document.hidden || ctx.state !== 'running') return;
      if (!buffers.has(name)) {
        const samples = render(name);
        const buffer = ctx.createBuffer(1, samples.length, rate);
        buffer.getChannelData(0).set(samples);
        buffers.set(name, buffer);
      }
      const source = ctx.createBufferSource();
      const volume = ctx.createGain();
      source.buffer = buffers.get(name);
      source.connect(volume);
      volume.connect(ctx.destination);
      source.onended = () => {
        if (playing?.source === source) playing = null;
        source.disconnect();
        volume.disconnect();
      };
      source.start();
      playing = { source, volume };
    } catch {
      // The classroom stays usable if the device has disabled audio.
    }
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.SS_LIFECYCLE?.subscribe(({ paused }) => { if (paused) stop(); });
  window.addEventListener('pagehide', () => {
    stop();
    context?.close().catch(() => {});
    context = null;
    buffers.clear();
  });
  window.RoleSound = Object.freeze({ play, stop });
})();
