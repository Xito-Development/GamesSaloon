const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path').join(__dirname, '..', 'www') + '/';

const dom = new JSDOM(fs.readFileSync(path + 'index.html', 'utf8'), {
  runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/'
});
const w = dom.window;
w.AudioContext = function () {
  const node = () => ({ connect() { }, start() { }, stop() { }, gain: { value: 0, setValueAtTime() { }, linearRampToValueAtTime() { }, exponentialRampToValueAtTime() { }, cancelScheduledValues() { } }, frequency: { value: 0, setValueAtTime() { }, exponentialRampToValueAtTime() { } }, type: '', buffer: null });
  return {
    currentTime: 0, sampleRate: 44100, destination: {},
    createGain: node, createOscillator: node, createBiquadFilter: node, createConvolver: node,
    createBuffer: (c, l) => ({ getChannelData: () => new Float32Array(l) }), resume() { }
  };
};
w.crypto = { randomUUID: () => 'uuid-' + Math.random().toString(36).slice(2) };
w.HTMLElement.prototype.animate = () => ({ finished: Promise.resolve() });

const errors = [];
w.addEventListener('error', e => errors.push('window error: ' + e.message));
const files = ['js/audio.js', 'js/cards.js', 'js/net.js', 'js/games/solitario.js', 'js/games/bingo.js',
  'js/games/ajedrez.js', 'js/games/brisca.js', 'js/games/parchis.js', 'js/games/cinquillo.js',
  'js/games/chinchon.js', 'js/games/damas.js', 'js/games/online.js', 'js/app.js'];
const src = files.map(f => fs.readFileSync(path + f, 'utf8')).join('\n;\n');
let api;
try { api = w.eval(src + '\n;({App, GAMES, Cards, Net, Audio2});'); }
catch (e) { errors.push('carga: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
if (!api) { console.log(errors.join('\n')); process.exit(1); }
w.App = api.App; w.GAMES = api.GAMES;

const run = (label, fn) => { try { fn(); console.log('OK  ' + label); } catch (e) { errors.push(label + ' → ' + e.message + '\n' + (e.stack || '').split('\n')[1]); console.log('ERR ' + label + ': ' + e.message); } };

run('App.init', () => w.App.init());
const G = w.GAMES;
G.filter(g => g.mod).forEach(game => {
  run('setup ' + game.id, () => w.App.go('setup', game));
  run('play ' + game.id, () => w.App.go('play', { game, diff: 'medio', players: game.id === 'cinquillo' ? 4 : 4 }));
});
run('stats', () => w.App.go('stats'));
run('settings', () => w.App.go('settings'));
run('hub', () => w.App.go('hub'));

// simular partidas automáticas
run('ajedrez: 6 jugadas del jugador', () => {
  w.App.go('play', { game: G.find(g => g.id === 'ajedrez'), diff: 'facil' });
  for (let n = 0; n < 6; n++) {
    const cells = [...w.document.querySelectorAll('#bd > div > div')];
    let moved = false;
    for (const c of cells) { if (c.textContent.trim()) { c.click(); if (w.document.querySelector('#bd span')) { moved = true; break; } } }
    if (!moved) break;
    const target = w.document.querySelector('#bd span');
    if (target) target.parentElement.click();
  }
});
run('damas: clic en todas las casillas', () => {
  w.App.go('play', { game: G.find(g => g.id === 'damas'), diff: 'facil' });
  [...w.document.querySelectorAll('#bd > div > div')].slice(0, 40).forEach(c => c.click());
});
run('solitario: 40 clics aleatorios', () => {
  w.App.go('play', { game: G.find(g => g.id === 'solitario') });
  for (let i = 0; i < 40; i++) {
    const els = [...w.document.querySelectorAll('#felt div')].filter(e => e.onclick);
    if (!els.length) break;
    els[Math.floor(Math.random() * els.length)].click();
  }
});
run('cinquillo: partida completa', () => {
  w.App.go('play', { game: G.find(g => g.id === 'cinquillo'), diff: 'medio', players: 4 });
  for (let i = 0; i < 60; i++) {
    const c = [...w.document.querySelectorAll('#mano > div')].find(e => e.onclick);
    if (c) c.click(); else w.document.querySelector('#paso').click();
  }
});
run('chinchon: 30 turnos', () => {
  w.App.go('play', { game: G.find(g => g.id === 'chinchon'), diff: 'medio' });
  for (let i = 0; i < 30; i++) {
    const centro = [...w.document.querySelectorAll('#centro > div')];
    if (centro[0]) centro[0].click();
    const mano = [...w.document.querySelectorAll('#mano > div')];
    if (mano[0]) mano[0].click();
  }
});
run('parchis: 40 tiradas', () => {
  w.App.go('play', { game: G.find(g => g.id === 'parchis'), diff: 'medio', players: 4 });
  for (let i = 0; i < 40; i++) {
    w.document.querySelector('#tirar').click();
    const p = [...w.document.querySelectorAll('#bd div')].find(e => e.onclick);
    if (p) p.click();
  }
});
run('brisca: 30 jugadas', () => {
  w.App.go('play', { game: G.find(g => g.id === 'brisca'), diff: 'medio' });
  for (let i = 0; i < 30; i++) {
    const c = [...w.document.querySelectorAll('#mano > div')][0];
    if (c) c.click();
  }
});
run('bingo: iniciar', () => {
  w.App.go('play', { game: G.find(g => g.id === 'bingo'), diff: 'medio', players: 4 });
  w.document.querySelector('#go').click();
  w.document.querySelector('#linebtn').click();
  w.document.querySelector('#bingobtn').click();
});
run('online screen', () => w.App.go('online', G[0]));

// soak: 8 repeticiones de cada juego con clics aleatorios
for (let rep = 0; rep < 8; rep++) {
  G.filter(g => g.mod).forEach(game => {
    run('soak ' + game.id + ' #' + rep, () => {
      w.App.go('play', { game, diff: ['facil', 'medio', 'dificil'][rep % 3], players: game.id === 'cinquillo' ? [3, 4, 6][rep % 3] : [2, 3, 4][rep % 3] });
      for (let i = 0; i < 60; i++) {
        const els = [...w.document.querySelectorAll('#view *')].filter(e => e.onclick);
        if (!els.length) break;
        els[Math.floor(Math.random() * els.length)].click();
      }
    });
  });
}

setTimeout(() => {
  console.log('\n--- ' + (errors.length ? errors.length + ' ERRORES ---' : 'SIN ERRORES ---'));
  errors.forEach(e => console.log('* ' + e));
  process.exit(errors.length ? 1 : 0);
}, 1500);
