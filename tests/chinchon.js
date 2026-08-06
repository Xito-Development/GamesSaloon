/* Comprueba que el chinchón termina la partida a 100 puntos y registra un solo resultado */
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
  'js/games/ajedrez-reglas.js', 'js/games/ajedrez.js', 'js/games/brisca.js', 'js/games/parchis.js', 'js/games/cinquillo.js',
  'js/games/chinchon.js', 'js/games/damas.js', 'js/games/domino.js', 'js/games/escoba.js', 'js/games/conecta4.js', 'js/games/oca.js', 'js/games/reversi.js', 'js/games/generala.js', 'js/games/buscaminas.js', 'js/games/online.js', 'js/app.js'];
const api = w.eval(files.map(f => fs.readFileSync(path + f, 'utf8')).join('\n;\n') + '\n;({App, GAMES});');

const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await wait(30);
  const fails = [];
  api.App.state.stats = {};
  api.App.go('play', { game: api.GAMES.find(g => g.id === 'chinchon'), diff: 'medio' });
  const v = w.document.getElementById('view');
  for (let ronda = 0; ronda < 60; ronda++) {
    for (let i = 0; i < 60; i++) {
      const centro = [...v.querySelectorAll('#centro > div')];
      if (centro[0]) centro[0].click();
      const mano = [...v.querySelectorAll('#mano > div')];
      if (mano[0]) mano[0].click();
      await wait(1);
      if (/Cierre|Partida terminada/.test(v.querySelector('#msg').textContent)) break;
    }
    if (/Partida terminada/.test(v.querySelector('#msg').textContent)) break;
    v.querySelector('#nw').click();
    await wait(2);
  }
  const msg = v.querySelector('#msg').textContent;
  if (!/Partida terminada/.test(msg)) fails.push('la partida no llegó nunca a los 100 puntos: ' + msg);
  const st = api.App.state.stats.chinchon || { w: 0, l: 0 };
  if (st.w + st.l !== 1) fails.push(`resultados registrados: ${st.w + st.l}, debería ser 1 por partida`);
  console.log(fails.length ? 'FALLOS:\n' + fails.join('\n') : `Chinchón: partida completa a 100 puntos con un único resultado (${msg.slice(0, 60)}…) ✔`);
  process.exit(fails.length ? 1 : 0);
})();
