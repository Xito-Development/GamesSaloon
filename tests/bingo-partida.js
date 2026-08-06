/* Juega partidas de bingo enteras y comprueba que solo se puede ganar una vez */
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
const realInterval = w.setInterval.bind(w);
w.setInterval = (fn) => realInterval(fn, 1);   // bolas a toda velocidad

const files = ['js/audio.js', 'js/naipes.js', 'js/cards.js', 'js/anim.js', 'js/bingo-carton.js', 'js/net.js', 'js/games/solitario.js',
  'js/games/bingo.js', 'js/games/ajedrez-reglas.js', 'js/games/ajedrez.js', 'js/games/brisca.js', 'js/games/parchis.js', 'js/games/cinquillo.js',
  'js/games/chinchon.js', 'js/games/damas.js', 'js/games/domino.js', 'js/games/escoba.js', 'js/games/conecta4.js', 'js/games/oca.js', 'js/games/reversi.js', 'js/games/generala.js', 'js/games/buscaminas.js', 'js/games/online.js', 'js/app.js'];
const api = w.eval(files.map(f => fs.readFileSync(path + f, 'utf8')).join('\n;\n') + '\n;({App, GAMES});');

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await wait(30);
  const fails = [];
  api.App.state.stats = {};

  for (let p = 0; p < 5; p++) {
    api.App.go('play', { game: api.GAMES.find(g => g.id === 'bingo'), diff: 'medio', players: 4 });
    const v = w.document.getElementById('view');
    v.querySelector('#go').click();
    // marcar todo lo que salga y cantar en cuanto se pueda
    for (let i = 0; i < 400; i++) {
      [...v.querySelectorAll('#mycard div div')].forEach(c => c.onclick && c.click());
      v.querySelector('#linebtn').click();
      v.querySelector('#bingobtn').click();
      await wait(2);
      if (/terminada/i.test(v.querySelector('#go').textContent)) break;
    }
    console.log('partida', p, '→', v.querySelector('#estado').textContent, '| botón:', v.querySelector('#go').textContent);
    // intentar cantar bingo 10 veces más después de terminar
    for (let k = 0; k < 10; k++) { v.querySelector('#bingobtn').click(); v.querySelector('#linebtn').click(); }
    await wait(10);
  }

  const st = api.App.state.stats.bingo || { w: 0, l: 0 };
  const total = st.w + st.l;
  if (total !== 5) fails.push(`5 partidas jugadas pero se registraron ${total} resultados (${st.w}V ${st.l}D) — se puede ganar/perder varias veces`);
  console.log(fails.length ? 'FALLOS:\n' + fails.join('\n')
    : `Bingo: 5 partidas, 5 resultados registrados (${st.w}V ${st.l}D), sin victorias repetidas ✔`);
  process.exit(fails.length ? 1 : 0);
})();
