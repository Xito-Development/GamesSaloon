/* Reversi / Othello 8x8 contra bot con minimax y poda alfa-beta */
const Reversi = {
  id: 'reversi', name: 'Reversi', hasBot: true,
  reglas: 'Coloca fichas encerrando las del rival entre dos tuyas para darles la vuelta. Si no puedes mover, pasas. Gana quien tenga más fichas al final.',
  mount(root, opts) {
    const prof = { facil: 1, medio: 3, dificil: 5 }[opts.diff || 'medio'];
    const PESOS = [
      120, -20, 20, 5, 5, 20, -20, 120, -20, -40, -5, -5, -5, -5, -40, -20,
      20, -5, 15, 3, 3, 15, -5, 20, 5, -5, 3, 3, 3, 3, -5, 5,
      5, -5, 3, 3, 3, 3, -5, 5, 20, -5, 15, 3, 3, 15, -5, 20,
      -20, -40, -5, -5, -5, -5, -40, -20, 120, -20, 20, 5, 5, 20, -20, 120
    ];
    const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let b, turno, over, ultima = null;

    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud" id="hud"></div></div>
      <div class="board-wrap"><div id="bd" style="background:#0f5132;border-radius:var(--r-md);padding:8px;box-shadow:var(--shadow)"></div></div>
      <div class="card"><p id="msg" style="margin:0">Juegas con negras y empiezas tú.</p></div>
      <div class="row"><button class="btn ghost" id="pasar">Pasar</button><button class="btn" id="nw">Nueva partida</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = init;
    $('#pasar').onclick = () => {
      if (over || turno !== 1) return;
      if (validas(b, 1).length) return App.toast('Todavía tienes jugadas');
      turno = 2; render(); say('Pasas turno'); App.timer(botJuega, 400);
    };
    const say = t => $('#msg').textContent = t;

    function init() {
      b = Array(64).fill(0);
      b[27] = b[36] = 2; b[28] = b[35] = 1;
      turno = 1; over = false; ultima = null; render(); say('Juegas con negras y empiezas tú.');
    }
    function voltea(bd, i, j) {
      const r = i >> 3, c = i & 7, salida = [];
      if (bd[i]) return salida;
      const rival = j === 1 ? 2 : 1;
      DIRS.forEach(([dr, dc]) => {
        const linea = [];
        let nr = r + dr, nc = c + dc;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const k = nr * 8 + nc;
          if (bd[k] === rival) linea.push(k);
          else { if (bd[k] === j && linea.length) salida.push(...linea); break; }
          nr += dr; nc += dc;
        }
      });
      return salida;
    }
    const validas = (bd, j) => [...Array(64).keys()].filter(i => voltea(bd, i, j).length);
    function poner(bd, i, j) {
      const n = bd.slice();
      n[i] = j; voltea(bd, i, j).forEach(k => n[k] = j);
      return n;
    }
    const cuenta = (bd, j) => bd.filter(x => x === j).length;
    function evalua(bd) {
      let s = 0;
      for (let i = 0; i < 64; i++) if (bd[i]) s += (bd[i] === 2 ? 1 : -1) * PESOS[i];
      s += (validas(bd, 2).length - validas(bd, 1).length) * 6;
      return s;
    }
    function buscar(bd, j, d, a, be) {
      const ms = validas(bd, j);
      const rival = j === 1 ? 2 : 1;
      if (!ms.length) {
        if (!validas(bd, rival).length) return (cuenta(bd, 2) - cuenta(bd, 1)) * 1000;
        return buscar(bd, rival, d - 1, a, be);
      }
      if (d === 0) return evalua(bd);
      if (j === 2) {
        let v = -1e9;
        for (const m of ms) { v = Math.max(v, buscar(poner(bd, m, 2), 1, d - 1, a, be)); a = Math.max(a, v); if (be <= a) break; }
        return v;
      }
      let v = 1e9;
      for (const m of ms) { v = Math.min(v, buscar(poner(bd, m, 1), 2, d - 1, a, be)); be = Math.min(be, v); if (be <= a) break; }
      return v;
    }
    function jugar(i) {
      if (over || turno !== 1 || !voltea(b, i, 1).length) return;
      b = poner(b, i, 1); ultima = i; Audio2.sfx('chip');
      turno = 2; render();
      if (fin()) return;
      if (!validas(b, 2).length) { turno = 1; render(); return say('El bot no puede mover, repites'); }
      say('Piensa el bot…');
      App.timer(botJuega, 260);
    }
    function botJuega() {
      if (over || turno !== 2) return;
      const ms = validas(b, 2);
      if (!ms.length) { turno = 1; render(); return say('El bot pasa'); }
      let mejor = ms[0], mv = -1e9;
      Cards.shuffle(ms).forEach(m => {
        const v = buscar(poner(b, m, 2), 1, prof - 1, -1e9, 1e9);
        if (v > mv) { mv = v; mejor = m; }
      });
      b = poner(b, mejor, 2); ultima = mejor; Audio2.sfx('card');
      turno = 1; render();
      if (fin()) return;
      if (!validas(b, 1).length) {
        if (validas(b, 2).length) { turno = 2; render(); say('No tienes jugadas, mueve el bot'); return App.timer(botJuega, 500); }
      } else say('Tu turno.');
    }
    function fin() {
      if (validas(b, 1).length || validas(b, 2).length) return false;
      over = true;
      const yo = cuenta(b, 1), bot = cuenta(b, 2);
      const gano = yo > bot;
      say(yo === bot ? `Empate a ${yo}` : gano ? `¡Ganas ${yo}–${bot}! 🎉` : `Pierdes ${yo}–${bot}`);
      Audio2.sfx(gano ? 'win' : 'bad');
      if (yo !== bot) App.record('reversi', gano ? 'win' : 'loss');
      render();
      return true;
    }
    function render() {
      $('#hud').innerHTML = `⚫ Tú ${cuenta(b, 1)} · ⚪ Bot ${cuenta(b, 2)}<br>${over ? 'Partida terminada' : turno === 1 ? 'Tu turno' : 'Piensa el bot…'}`;
      const bd = $('#bd'); bd.innerHTML = '';
      const g = document.createElement('div');
      g.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr);gap:3px';
      const posibles = (!over && turno === 1) ? validas(b, 1) : [];
      for (let i = 0; i < 64; i++) {
        const d = document.createElement('div');
        d.style.cssText = 'aspect-ratio:1;background:#177245;border-radius:4px;display:grid;place-items:center;position:relative';
        if (b[i]) {
          const f = document.createElement('div');
          f.style.cssText = `width:80%;height:80%;border-radius:50%;transition:background .35s var(--ease);
            background:${b[i] === 1 ? 'radial-gradient(circle at 32% 28%,#666,#0d0d0d)' : 'radial-gradient(circle at 32% 28%,#fff,#cfc8b8)'};
            box-shadow:0 3px 6px rgba(0,0,0,.5)`;
          if (ultima === i) f.classList.add('pop-in');
          d.appendChild(f);
        } else if (posibles.includes(i)) {
          d.innerHTML = '<span style="width:26%;height:26%;border-radius:50%;background:rgba(255,255,255,.4)"></span>';
          d.onclick = () => jugar(i);
        }
        g.appendChild(d);
      }
      bd.appendChild(g);
      $('#pasar').style.opacity = (!over && turno === 1 && !posibles.length) ? 1 : .45;
    }
    init();
  }
};
