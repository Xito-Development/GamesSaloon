/* Buscaminas con tres tamaños según la dificultad, banderas, cronómetro y despeje automático */
const Buscaminas = {
  id: 'buscaminas', name: 'Buscaminas', hasBot: false,
  reglas: 'Toca para destapar y mantén pulsado (o activa el modo bandera) para marcar minas. Los números dicen cuántas minas hay alrededor. Ganas al destapar todas las casillas sin mina.',
  NIVELES: { facil: [9, 9, 10], medio: [12, 14, 26], dificil: [14, 18, 45] },
  mount(root, opts) {
    const [COLS, FILAS, MINAS] = this.NIVELES[opts.diff || 'medio'];
    const COLORES = ['', '#3b82f6', '#16a34a', '#dc2626', '#7c3aed', '#b45309', '#0891b2', '#111', '#666'];
    let campo, abiertas, banderas, over, ganado, primera, t0, tid, modoBandera = false;

    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud" id="hud"></div></div>
      <div class="board-wrap"><div id="bd" style="background:var(--surf2);border:1px solid var(--outline);
        border-radius:var(--r-md);padding:6px;box-shadow:var(--shadow);overflow:auto"></div></div>
      <div class="card"><p id="msg" style="margin:0">Toca una casilla para empezar. La primera nunca es mina.</p></div>
      <div class="row"><button class="btn ghost" id="bandera">🚩 Modo bandera: no</button><button class="btn" id="nw">Nueva partida</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => { clearInterval(tid); App.go('hub'); };
    $('#nw').onclick = init;
    $('#bandera').onclick = () => { modoBandera = !modoBandera; $('#bandera').textContent = `🚩 Modo bandera: ${modoBandera ? 'sí' : 'no'}`; Audio2.sfx('tick'); };
    App.onLeave = () => clearInterval(tid);
    const say = t => $('#msg').textContent = t;
    const idx = (f, c) => f * COLS + c;
    const vecinos = i => {
      const f = Math.floor(i / COLS), c = i % COLS, out = [];
      for (let df = -1; df <= 1; df++) for (let dc = -1; dc <= 1; dc++) {
        if (!df && !dc) continue;
        const nf = f + df, nc = c + dc;
        if (nf >= 0 && nf < FILAS && nc >= 0 && nc < COLS) out.push(idx(nf, nc));
      }
      return out;
    };

    function init() {
      campo = Array(COLS * FILAS).fill(0);
      abiertas = new Set(); banderas = new Set();
      over = false; ganado = false; primera = true;
      clearInterval(tid); t0 = null;
      say('Toca una casilla para empezar. La primera nunca es mina.');
      render();
    }
    function sembrar(seguro) {
      const prohibidas = new Set([seguro, ...vecinos(seguro)]);
      const libres = [...Array(COLS * FILAS).keys()].filter(i => !prohibidas.has(i));
      Cards.shuffle(libres).slice(0, Math.min(MINAS, libres.length)).forEach(i => campo[i] = -1);
      for (let i = 0; i < campo.length; i++) {
        if (campo[i] === -1) continue;
        campo[i] = vecinos(i).filter(v => campo[v] === -1).length;
      }
      t0 = Date.now();
      tid = setInterval(() => { if (!over) render(); }, 1000);
    }
    function abrir(i) {
      if (over || abiertas.has(i) || banderas.has(i)) return;
      if (primera) { primera = false; sembrar(i); }
      if (campo[i] === -1) {
        over = true; clearInterval(tid);
        abiertas.add(i);
        say('¡Boom! Has pisado una mina.');
        Audio2.sfx('bad');
        App.record('buscaminas', 'loss');
        return render();
      }
      // despeje en cascada
      const pila = [i];
      while (pila.length) {
        const k = pila.pop();
        if (abiertas.has(k) || banderas.has(k)) continue;
        abiertas.add(k);
        if (campo[k] === 0) vecinos(k).forEach(v => { if (!abiertas.has(v)) pila.push(v); });
      }
      Audio2.sfx('tick');
      comprobar();
      render();
    }
    function marcar(i) {
      if (over || abiertas.has(i)) return;
      banderas.has(i) ? banderas.delete(i) : banderas.add(i);
      Audio2.sfx('chip'); render();
    }
    function comprobar() {
      if (abiertas.size === COLS * FILAS - MINAS) {
        over = true; ganado = true; clearInterval(tid);
        const s = Math.floor((Date.now() - t0) / 1000);
        say(`¡Campo despejado en ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}! 🎉`);
        Audio2.sfx('win');
        App.record('buscaminas', 'win');
      }
    }
    function render() {
      const s = t0 ? Math.floor((Date.now() - t0) / 1000) : 0;
      $('#hud').innerHTML = `💣 ${MINAS - banderas.size} · 🚩 ${banderas.size}<br>${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      const bd = $('#bd'); bd.innerHTML = '';
      const g = document.createElement('div');
      const lado = Math.max(20, Math.min(38, Math.floor((Math.min(window.innerWidth, 620) - 46) / COLS)));
      g.style.cssText = `display:grid;grid-template-columns:repeat(${COLS},${lado}px);gap:2px;justify-content:center`;
      for (let i = 0; i < campo.length; i++) {
        const d = document.createElement('div');
        const abierta = abiertas.has(i), bandera = banderas.has(i);
        const mina = campo[i] === -1;
        d.style.cssText = `width:${lado}px;height:${lado}px;display:grid;place-items:center;border-radius:5px;
          font-weight:800;font-size:${Math.round(lado * 0.5)}px;user-select:none;transition:background .2s;
          background:${abierta ? (mina ? '#c62828' : 'var(--surf3)') : 'var(--primary)'};
          color:${abierta && !mina ? COLORES[campo[i]] : '#fff'};
          box-shadow:${abierta ? 'inset 0 1px 3px rgba(0,0,0,.35)' : '0 2px 4px rgba(0,0,0,.3)'}`;
        if (abierta) d.textContent = mina ? '💣' : (campo[i] || '');
        else if (bandera) d.textContent = '🚩';
        else if (over && mina) { d.textContent = '💣'; d.style.background = 'var(--surf3)'; }
        if (!over) {
          let pulsado;
          d.onclick = () => modoBandera ? marcar(i) : abrir(i);
          d.oncontextmenu = e => { e.preventDefault(); marcar(i); };
          d.ontouchstart = () => { pulsado = setTimeout(() => { marcar(i); pulsado = 'largo'; }, 420); };
          d.ontouchend = e => { if (pulsado === 'largo') { e.preventDefault(); pulsado = null; } else clearTimeout(pulsado); };
        }
        g.appendChild(d);
      }
      bd.appendChild(g);
    }
    init();
    const onResize = () => { if (root.isConnected) render(); };
    window.addEventListener('resize', onResize);
    const prev = App.onLeave;
    App.onLeave = () => { window.removeEventListener('resize', onResize); if (prev) prev(); };
  }
};
