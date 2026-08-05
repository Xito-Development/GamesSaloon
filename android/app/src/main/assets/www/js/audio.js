/* Música relajante generativa (sin archivos, funciona offline) */
const Audio2 = (() => {
  let ctx, master, on = false, timer = null;
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]; // pentatónica mayor: alegre y luminosa
  const ROOT = 349.23; // fa4, registro brillante
  const BASS = [0, -5, -3, -7];   // vueltas de acordes sencillas
  let bar = 0;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.0;
    const rev = ctx.createConvolver();
    rev.buffer = impulse(1.6, 3);
    const wet = ctx.createGain(); wet.gain.value = 0.3;
    master.connect(ctx.destination);
    master.connect(wet); wet.connect(rev); rev.connect(ctx.destination);
  }

  function impulse(dur, decay) {
    const len = ctx.sampleRate * dur, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  // pulso tipo marimba/campanita: ataque rápido y cola corta = alegre
  function note(freq, dur, vol, type) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type || 'triangle'; o2.type = 'sine';
    o.frequency.value = freq; o2.frequency.value = freq * 2;
    f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t);
    f.frequency.exponentialRampToValueAtTime(900, t + dur * 0.7);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(master);
    o.start(t); o2.start(t); o.stop(t + dur + .05); o2.stop(t + dur + .05);
  }
  function bass(freq, dur, vol) {
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }

  function step() {
    if (!on) return;
    const beat = 460; // ~130 bpm, animado pero suave
    const root = BASS[bar % BASS.length];
    // melodía saltarina de 2-3 notas
    const n = 2 + (Math.random() < .5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const deg = SCALE[Math.floor(Math.random() * SCALE.length)] + root;
      setTimeout(() => on && note(ROOT * Math.pow(2, deg / 12), 0.7 + Math.random() * .4, 0.13), i * beat / 2);
    }
    // bajo redondo al principio del compás
    bass(ROOT / 4 * Math.pow(2, root / 12), 1.1, 0.11);
    // chispita aguda de vez en cuando
    if (Math.random() < .35) setTimeout(() => on && note(ROOT * 4 * Math.pow(2, SCALE[Math.floor(Math.random() * 4)] / 12), .35, .05), beat);
    bar++;
    timer = setTimeout(step, beat * 2);
  }

  return {
    toggle() { on ? this.stop() : this.start(); return on; },
    start() {
      init(); ctx.resume(); on = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.42, ctx.currentTime + 1.5);
      step();
    },
    stop() {
      on = false; clearTimeout(timer);
      if (master) master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    },
    get playing() { return on; },
    /* efectos de mesa */
    chord(freqs, dur = .5, vol = .12) {
      init(); ctx.resume();
      freqs.forEach((f, i) => setTimeout(() => {
        const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + .02);
      }, i * 90));
    },
    shuffleSfx() {
      init(); ctx.resume();
      for (let i = 0; i < 7; i++) setTimeout(() => this.sfx('card'), i * 55);
    },
    sfx(kind) {
      if (kind === 'win') return this.chord([523, 659, 784, 1047], .55, .14);
      if (kind === 'bad') return this.chord([330, 262], .5, .12);
      init(); ctx.resume();
      const t = ctx.currentTime, g = ctx.createGain(), o = ctx.createOscillator();
      const map = { card: [560, 0.07], chip: [880, 0.09], win: [660, 0.5], bad: [180, 0.25], tick: [1200, 0.04] };
      const [f, d] = map[kind] || map.tick;
      o.type = kind === 'card' ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(f, t);
      if (kind === 'win') o.frequency.exponentialRampToValueAtTime(f * 2.5, t + d);
      if (kind === 'bad') o.frequency.exponentialRampToValueAtTime(f * 0.5, t + d);
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + d + 0.02);
    }
  };
})();
