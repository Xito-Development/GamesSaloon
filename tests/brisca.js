/* Comprueba que la brisca reparte 40 cartas sin repetir y que cada partida suma 120 puntos */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path').join(__dirname, '..', 'www') + '/';

const dom = new JSDOM(fs.readFileSync(path + 'index.html', 'utf8'), { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window;
w.AudioContext = function () {
  const n = () => ({ connect() { }, start() { }, stop() { }, gain: { value: 0, setValueAtTime() { }, linearRampToValueAtTime() { }, exponentialRampToValueAtTime() { }, cancelScheduledValues() { } }, frequency: { value: 0, setValueAtTime() { }, exponentialRampToValueAtTime() { } }, type: '', buffer: null });
  return { currentTime: 0, sampleRate: 44100, destination: {}, createGain: n, createOscillator: n, createBiquadFilter: n, createConvolver: n, createBuffer: (c, l) => ({ getChannelData: () => new Float32Array(l) }), resume() { } };
};
w.crypto = { randomUUID: () => 'x' };
const files = ['js/audio.js', 'js/naipes.js', 'js/cards.js', 'js/anim.js', 'js/bingo-carton.js', 'js/net.js', 'js/games/solitario.js', 'js/games/bingo.js',
  'js/games/ajedrez-reglas.js', 'js/games/ajedrez.js', 'js/games/brisca.js', 'js/games/parchis.js', 'js/games/cinquillo.js', 'js/games/chinchon.js',
  'js/games/damas.js', 'js/games/domino.js', 'js/games/escoba.js', 'js/games/conecta4.js', 'js/games/oca.js', 'js/games/reversi.js', 'js/games/generala.js', 'js/games/buscaminas.js', 'js/games/online.js', 'js/app.js'];
const api = w.eval(files.map(f => fs.readFileSync(path + f, 'utf8')).join('\n;\n') + '\n;({App, GAMES, Brisca});');
// la app se inicia sola con DOMContentLoaded
// temporizadores instantáneos para simular partidas completas
api.App.timer = function (fn) { const g = this.gen; return setTimeout(() => { if (g === this.gen) fn(); }, 0); };

const wait = () => new Promise(r => setTimeout(r, 0));

(async () => {
  await new Promise(r => setTimeout(r, 30)); // deja que arranque la app
  const fails = [];
  for (let partida = 0; partida < 30; partida++) {
    api.App.go('play', { game: api.GAMES.find(g => g.id === 'brisca'), diff: ['facil', 'medio', 'dificil'][partida % 3] });
    const v = w.document.getElementById('view');
    for (let i = 0; i < 400; i++) {
      const c = [...v.querySelectorAll('#mano > div')].find(e => e.onclick);
      if (c) c.click();
      await wait();
      const msgEl = v.querySelector('#msg');
      if (!msgEl) { fails.push(`partida ${partida}: se perdió la interfaz en la jugada ${i}`); break; }
      const msg = msgEl.textContent;
      if (/Ganas \d|Pierdes \d|Empate/.test(msg)) break;
    }
    const rest = (v.querySelector('#rest') || {}).textContent || '';
    const msg = (v.querySelector('#msg') || {}).textContent || '';
    const m = rest.match(/^(\d+) de 120/);
    if (!m) fails.push(`partida ${partida}: no terminó (${msg} | ${rest})`);
    else if (+m[1] !== 120) fails.push(`partida ${partida}: solo se repartieron ${m[1]} puntos de 120`);
    // ninguna carta repetida en pantalla
    const vistas = [...v.querySelectorAll('#mano > div')].map(e => e.textContent);
    if (new Set(vistas).size !== vistas.length) fails.push(`partida ${partida}: cartas repetidas en la mano`);
  }
  console.log(fails.length ? 'FALLOS:\n' + fails.join('\n') : 'Brisca: 30 partidas completas, 120 puntos repartidos en todas ✔');
  process.exit(fails.length ? 1 : 0);
})();
