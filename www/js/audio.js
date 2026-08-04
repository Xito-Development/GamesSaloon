/* Música relajante generativa (sin archivos, funciona offline) */
const Audio2 = (() => {
  let ctx, master, on = false, timer = null;
  const SCALE = [0, 3, 5, 7, 10, 12, 15, 19]; // pentatónica menor, sonido cálido
  const ROOT = 220;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.0;
    const rev = ctx.createConvolver();
    rev.buffer = impulse(3.4, 2.2);
    const wet = ctx.createGain(); wet.gain.value = 0.55;
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

  function note(freq, dur, vol) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = 'sine'; o2.type = 'triangle';
    o.frequency.value = freq; o2.frequency.value = freq * 2.005;
    f.type = 'lowpass'; f.frequency.value = 1300;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(master);
    o.start(t); o2.start(t); o.stop(t + dur); o2.stop(t + dur);
  }

  function step() {
    if (!on) return;
    const deg = SCALE[Math.floor(Math.random() * SCALE.length)];
    note(ROOT * Math.pow(2, deg / 12), 5 + Math.random() * 4, 0.14);
    if (Math.random() < 0.4) {
      const d2 = SCALE[Math.floor(Math.random() * SCALE.length)];
      setTimeout(() => on && note(ROOT * 2 * Math.pow(2, d2 / 12), 4, 0.07), 900);
    }
    if (Math.random() < 0.25) note(ROOT / 2, 9, 0.1); // bajo cálido
    timer = setTimeout(step, 1800 + Math.random() * 2200);
  }

  return {
    toggle() { on ? this.stop() : this.start(); return on; },
    start() {
      init(); ctx.resume(); on = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.5);
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
