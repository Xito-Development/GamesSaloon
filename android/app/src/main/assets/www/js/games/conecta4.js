/* Conecta 4 (7x6) contra bot con minimax y poda alfa-beta */
const Conecta4 = {
  id: 'conecta4', name: 'Conecta 4', hasBot: true,
  reglas: 'Toca una columna para soltar tu ficha. Gana quien alinee cuatro en horizontal, vertical o diagonal.',
  mount(root, opts) {
    const COLS = 7, FILAS = 6;
    const prof = { facil: 2, medio: 4, dificil: 6 }[opts.diff || 'medio'];
    let b, turno, over, ultima = null;

    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud" id="hud">Tus fichas son las rojas</div></div>
      <div class="board-wrap"><div id="bd" style="background:linear-gradient(160deg,#1d4ed8,#132f7a);border-radius:var(--r-md);
        padding:10px;box-shadow:var(--shadow)"></div></div>
      <div class="card"><p id="msg" style="margin:0">Elige columna.</p></div>
      <div class="row"><button class="btn ghost" id="undo">Deshacer</button><button class="btn" id="nw">Nueva partida</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = init;
    let hist = [];
    $('#undo').onclick = () => {
      if (!hist.length) return App.toast('Nada que deshacer');
      b = hist.pop(); if (hist.length) b = hist.pop();
      turno = 1; over = false; render(); say('Tu turno.');
    };
    const say = t => $('#msg').textContent = t;

    function init() { b = Array.from({ length: FILAS }, () => Array(COLS).fill(0)); turno = 1; over = false; hist = []; ultima = null; render(); say('Elige columna.'); }
    const libre = (bd, c) => { for (let f = FILAS - 1; f >= 0; f--) if (!bd[f][c]) return f; return -1; };
    const columnas = bd => [...Array(COLS).keys()].filter(c => libre(bd, c) >= 0);

    function gana(bd, j) {
      const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (let f = 0; f < FILAS; f++) for (let c = 0; c < COLS; c++) {
        if (bd[f][c] !== j) continue;
        for (const [df, dc] of dirs) {
          let n = 0;
          for (let k = 0; k < 4; k++) {
            const nf = f + df * k, nc = c + dc * k;
            if (nf < 0 || nf >= FILAS || nc < 0 || nc >= COLS || bd[nf][nc] !== j) break;
            n++;
          }
          if (n === 4) return true;
        }
      }
      return false;
    }
    function evalua(bd, j) {
      const rival = j === 1 ? 2 : 1;
      let s = 0;
      const ventanas = [];
      const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (let f = 0; f < FILAS; f++) for (let c = 0; c < COLS; c++) for (const [df, dc] of dirs) {
        const v = [];
        for (let k = 0; k < 4; k++) {
          const nf = f + df * k, nc = c + dc * k;
          if (nf < 0 || nf >= FILAS || nc < 0 || nc >= COLS) { v.length = 0; break; }
          v.push(bd[nf][nc]);
        }
        if (v.length === 4) ventanas.push(v);
      }
      ventanas.forEach(v => {
        const mios = v.filter(x => x === j).length, suyos = v.filter(x => x === rival).length, libres = v.filter(x => !x).length;
        if (mios && suyos) return;
        if (mios === 3 && libres === 1) s += 60;
        else if (mios === 2 && libres === 2) s += 8;
        if (suyos === 3 && libres === 1) s -= 70;
        else if (suyos === 2 && libres === 2) s -= 9;
      });
      for (let f = 0; f < FILAS; f++) if (bd[f][3] === j) s += 4; else if (bd[f][3] === rival) s -= 4;
      return s;
    }
    function soltar(bd, c, j) { const n = bd.map(r => r.slice()); n[libre(bd, c)][c] = j; return n; }
    function buscar(bd, d, a, be, maximiza) {
      if (gana(bd, 2)) return 100000 - (prof - d);
      if (gana(bd, 1)) return -100000 + (prof - d);
      const cols = columnas(bd);
      if (!cols.length) return 0;
      if (d === 0) return evalua(bd, 2);
      cols.sort((x, y) => Math.abs(3 - x) - Math.abs(3 - y));
      if (maximiza) {
        let v = -1e9;
        for (const c of cols) { v = Math.max(v, buscar(soltar(bd, c, 2), d - 1, a, be, false)); a = Math.max(a, v); if (be <= a) break; }
        return v;
      }
      let v = 1e9;
      for (const c of cols) { v = Math.min(v, buscar(soltar(bd, c, 1), d - 1, a, be, true)); be = Math.min(be, v); if (be <= a) break; }
      return v;
    }
    function jugar(c) {
      if (over || turno !== 1) return;
      const f = libre(b, c);
      if (f < 0) return App.toast('Esa columna está llena');
      hist.push(b.map(r => r.slice()));
      b[f][c] = 1; ultima = [f, c]; Audio2.sfx('chip');
      if (comprobar()) { render(); return; }
      turno = 2; render(); say('Piensa el bot…');
      App.timer(botJuega, 260);
    }
    function botJuega() {
      if (over) return;
      const cols = columnas(b);
      let mejor = cols[0], mv = -1e9;
      Cards.shuffle(cols).forEach(c => {
        const v = buscar(soltar(b, c, 2), prof - 1, -1e9, 1e9, false);
        if (v > mv) { mv = v; mejor = c; }
      });
      const f = libre(b, mejor);
      b[f][mejor] = 2; ultima = [f, mejor]; Audio2.sfx('card');
      if (comprobar()) { render(); return; }
      turno = 1; render(); say('Tu turno.');
    }
    function comprobar() {
      if (gana(b, 1)) { over = true; say('¡Cuatro en raya! Has ganado 🎉'); Audio2.sfx('win'); App.record('conecta4', 'win'); return true; }
      if (gana(b, 2)) { over = true; say('El bot ha hecho cuatro en raya'); Audio2.sfx('bad'); App.record('conecta4', 'loss'); return true; }
      if (!columnas(b).length) { over = true; say('Tablero lleno: empate'); return true; }
      return false;
    }
    function render() {
      const bd = $('#bd'); bd.innerHTML = '';
      const g = document.createElement('div');
      g.style.cssText = `display:grid;grid-template-columns:repeat(${COLS},1fr);gap:6px`;
      for (let f = 0; f < FILAS; f++) for (let c = 0; c < COLS; c++) {
        const d = document.createElement('div');
        const j = b[f][c];
        const color = j === 1 ? 'radial-gradient(circle at 32% 28%,#ff8a80,#c62828)'
          : j === 2 ? 'radial-gradient(circle at 32% 28%,#ffe082,#f0a800)'
            : 'radial-gradient(circle at 50% 50%,#0b1c47,#08123190)';
        d.style.cssText = `aspect-ratio:1;border-radius:50%;background:${color};
          box-shadow:inset 0 3px 8px rgba(0,0,0,.55)${j ? ',0 3px 6px rgba(0,0,0,.35)' : ''};transition:background .25s`;
        if (ultima && ultima[0] === f && ultima[1] === c) d.classList.add('pop-in');
        if (!over && turno === 1) d.onclick = () => jugar(c);
        g.appendChild(d);
      }
      bd.appendChild(g);
      $('#hud').textContent = over ? 'Partida terminada' : (turno === 1 ? 'Tú (rojas)' : 'Bot (amarillas)');
    }
    init();
  }
};
