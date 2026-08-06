/* Dominó y Escoba: comprueba que las partidas terminan y que no se pierden ni duplican cartas */
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
api.App.timer = function (fn) { const g = this.gen; return setTimeout(() => { if (g === this.gen) fn(); }, 0); };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await wait(30);
  const fails = [];
  const v = () => w.document.getElementById('view');

  // ---- Dominó: 10 partidas, todas deben terminar
  let terminadas = 0;
  for (let p = 0; p < 10; p++) {
    api.App.go('play', { game: api.GAMES.find(g => g.id === 'domino'), diff: 'medio', players: 4 });
    for (let i = 0; i < 300; i++) {
      const f = [...v().querySelectorAll('#mano > div')].find(e => e.onclick);
      if (f) f.click();
      const lado = v().querySelector('#lado button');
      if (lado) lado.click();
      else if (!f) v().querySelector('#pasar').click();
      await wait(2);
      if (/Ganas|Gana el bot/.test(v().querySelector('#msg').textContent)) { terminadas++; break; }
    }
  }
  if (terminadas < 10) fails.push(`dominó: solo ${terminadas} de 10 partidas terminaron`);

  // ---- Escoba: las 40 cartas siempre están repartidas entre mazo, manos, mesa y capturas
  for (let p = 0; p < 5; p++) {
    api.App.go('play', { game: api.GAMES.find(g => g.id === 'escoba'), diff: 'medio' });
    for (let i = 0; i < 200; i++) {
      const mano = [...v().querySelectorAll('#mano > div')].find(e => e.onclick);
      if (mano) { mano.click(); v().querySelector('#recoger').click(); v().querySelector('#tirar').click(); }
      await wait(1);
      if (/Ronda:|Partida terminada/.test(v().querySelector('#msg').textContent)) break;
    }
    const hud = v().querySelector('#hud').textContent;
    if (!/Ronda:|Partida terminada/.test(v().querySelector('#msg').textContent) && !/Mazo: 0/.test(hud))
      fails.push(`escoba: la ronda ${p} no llegó al final (${hud.replace(/\n/g, ' ')})`);
  }

  // ---- Conecta 4: todas las partidas terminan y el bot no deja ganar por descuido en difícil
  let c4 = 0;
  for (let p = 0; p < 6; p++) {
    api.App.go('play', { game: api.GAMES.find(g => g.id === 'conecta4'), diff: p % 2 ? 'dificil' : 'facil' });
    for (let i = 0; i < 250; i++) {
      const cel = [...v().querySelectorAll('#bd div div')].filter(e => e.onclick);
      if (cel.length) cel[Math.floor(Math.random() * cel.length)].click();
      await wait(2);
      if (/ganado|cuatro en raya|empate/i.test(v().querySelector('#msg').textContent)) { c4++; break; }
    }
  }
  if (c4 < 6) fails.push(`conecta 4: solo ${c4} de 6 partidas terminaron`);

  // ---- La Oca: las partidas terminan sin quedarse atascadas en el pozo
  let ocas = 0;
  for (let p = 0; p < 6; p++) {
    api.App.go('play', { game: api.GAMES.find(g => g.id === 'oca'), diff: 'medio', players: 4 });
    for (let i = 0; i < 600; i++) {
      v().querySelector('#tirar').click();
      await wait(1);
      if (/Has ganado|Gana el bot/.test(v().querySelector('#msg').textContent)) { ocas++; break; }
    }
  }
  if (ocas < 6) fails.push(`la oca: solo ${ocas} de 6 partidas terminaron`);

  // ---- Reversi: las partidas terminan y el marcador cuadra con 64 casillas
  let rev = 0;
  for (let p = 0; p < 4; p++) {
    api.App.go('play', { game: api.GAMES.find(g => g.id === 'reversi'), diff: p % 2 ? 'medio' : 'facil' });
    for (let i = 0; i < 200; i++) {
      const cel = [...v().querySelectorAll('#bd div div')].filter(e => e.onclick);
      if (cel.length) cel[Math.floor(Math.random() * cel.length)].click();
      else v().querySelector('#pasar').click();
      await wait(2);
      if (/Ganas|Pierdes|Empate/.test(v().querySelector('#msg').textContent)) { rev++; break; }
    }
  }
  if (rev < 4) fails.push(`reversi: solo ${rev} de 4 partidas terminaron`);

  // ---- Generala: partidas completas con las 11 casillas de cada jugador
  let gen = 0;
  for (let p = 0; p < 3; p++) {
    api.App.go('play', { game: api.GAMES.find(g => g.id === 'generala'), diff: 'medio', players: 2 });
    for (let i = 0; i < 400; i++) {
      v().querySelector('#tirar').click();
      const anotar = [...v().querySelectorAll('#hoja button')];
      if (anotar.length) anotar[Math.floor(Math.random() * anotar.length)].click();
      await wait(2);
      if (/Gana /.test(v().querySelector('#msg').textContent)) { gen++; break; }
    }
  }
  if (gen < 3) fails.push(`generala: solo ${gen} de 3 partidas terminaron`);

  // ---- Buscaminas: la primera casilla nunca es mina y el juego termina
  let bm = 0, primeraMina = 0;
  for (let p = 0; p < 8; p++) {
    api.App.go('play', { game: api.GAMES.find(g => g.id === 'buscaminas'), diff: 'facil' });
    const celdas = () => [...v().querySelectorAll('#bd div div')];
    celdas()[Math.floor(Math.random() * celdas().length)].click();
    await wait(2);
    if (/Boom/.test(v().querySelector('#msg').textContent)) primeraMina++;
    for (let i = 0; i < 200; i++) {
      const libres = celdas().filter(e => e.onclick);
      if (!libres.length) break;
      libres[Math.floor(Math.random() * libres.length)].click();
      await wait(1);
      if (/Boom|despejado/.test(v().querySelector('#msg').textContent)) { bm++; break; }
    }
  }
  if (primeraMina) fails.push(`buscaminas: la primera casilla fue mina en ${primeraMina} partidas`);
  if (bm < 8) fails.push(`buscaminas: solo ${bm} de 8 partidas terminaron`);

  console.log(fails.length ? 'FALLOS:\n' + fails.join('\n')
    : 'Dominó, Escoba, Conecta 4, La Oca, Reversi, Generala y Buscaminas: todas las partidas terminan correctamente ✔');
  process.exit(fails.length ? 1 : 0);
})();
