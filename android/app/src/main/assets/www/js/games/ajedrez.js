/* Ajedrez contra bot: reglas completas (enroque, captura al paso, promoción con elección,
   jaque mate, ahogado, tablas por material insuficiente y regla de 50 movimientos) */
const Ajedrez = {
  id: 'ajedrez', name: 'Ajedrez', hasBot: true,
  reglas: 'Juegas con blancas. Toca una pieza y luego una casilla marcada. Incluye enroque, captura al paso y promoción con elección de pieza.',
  mount(root, opts) {
    const depth = { facil: 1, medio: 2, dificil: 3 }[opts.diff || 'medio'];
    const GLYPH = { P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔', p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };
    const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    const PST = {
      p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
      n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
      b: new Array(64).fill(5), r: new Array(64).fill(0), q: new Array(64).fill(0),
      k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20]
    };
    let pos, turn, sel, hist, over, lastTo = null, pendingFrom = null, promo = null, vistas = {};

    root.innerHTML = `
      <div class="board-head">
        <button class="back" id="bk">← Salir</button>
        <div class="hud" id="status">Juegas con blancas</div>
      </div>
      <div class="board-wrap"><div id="bd" style="border-radius:var(--r-md);overflow:hidden;box-shadow:var(--shadow);border:6px solid #4a3524;background:#4a3524"></div></div>
      <div class="card" id="capt" style="font-size:20px;line-height:1.3"></div>
      <div class="row"><button class="btn ghost" id="undo">Deshacer</button><button class="btn" id="nw">Nueva</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = init;
    $('#undo').onclick = () => {
      if (!hist.length) return App.toast('Nada que deshacer');
      pos = hist.pop(); if (hist.length) pos = hist.pop();
      turn = 'w'; over = false; sel = null; promo = null;
      const pb = $('#promo'); if (pb) pb.remove();
      render(); status();
    };

    function init() {
      pos = {
        b: ('rnbqkbnr' + 'pppppppp' + '........'.repeat(4) + 'PPPPPPPP' + 'RNBQKBNR').split(''),
        rights: { K: true, Q: true, k: true, q: true }, ep: -1, half: 0
      };
      turn = 'w'; sel = null; hist = []; over = false; promo = null; vistas = {};
      const pb = $('#promo'); if (pb) pb.remove();
      render(); status();
    }
    const { isW, own, clone, pseudo, atacada, enJaque, aplicar, legales } = AjedrezReglas;


    function materialInsuficiente(p) {
      const piezas = p.b.filter(c => c !== '.').map(c => c.toLowerCase());
      if (piezas.some(c => c === 'p' || c === 'r' || c === 'q')) return false;
      return piezas.length <= 3;
    }
    function evalb(p) {
      let s = 0;
      for (let i = 0; i < 64; i++) {
        const c = p.b[i]; if (c === '.') continue;
        const pz = c.toLowerCase(), w = isW(c);
        s += (w ? 1 : -1) * (VAL[pz] + PST[pz][w ? i : (56 - (i & 56) + (i & 7))]);
      }
      return s;
    }
    function search(p, t, d, a, be) {
      const ms = legales(p, t);
      if (!ms.length) return enJaque(p, t) ? (t === 'w' ? -99999 + d : 99999 - d) : 0;
      if (d === 0) return evalb(p);
      ms.sort((x, y) => (p.b[y.to] !== '.') - (p.b[x.to] !== '.'));
      if (t === 'w') {
        let best = -1e9;
        for (const m of ms) { best = Math.max(best, search(aplicar(p, m), 'b', d - 1, a, be)); a = Math.max(a, best); if (be <= a) break; }
        return best;
      }
      let best = 1e9;
      for (const m of ms) { best = Math.min(best, search(aplicar(p, m), 'w', d - 1, a, be)); be = Math.min(be, best); if (be <= a) break; }
      return best;
    }
    function botMove() {
      if (over) return;
      const ms = legales(pos, 'b');
      if (!ms.length) return status();
      let best = null, bv = 1e9;
      Cards.shuffle(ms).forEach(m => {
        const v = search(aplicar(pos, m), 'w', depth - 1, -1e9, 1e9);
        if (v < bv) { bv = v; best = m; }
      });
      grab(best.from); lastTo = best.to;
      hist.push(clone(pos));
      pos = aplicar(pos, best); turn = 'w';
      Audio2.sfx('card'); render(); status();
    }
    const clave = () => pos.b.join('') + turn + JSON.stringify(pos.rights) + pos.ep;
    function status() {
      const k = clave();
      vistas[k] = (vistas[k] || 0) + 1;
      if (vistas[k] >= 3) { over = true; $('#status').textContent = 'Tablas por repetición de posición'; App.toast('Tablas por repetición'); return; }
      const ms = legales(pos, turn);
      if (!ms.length) {
        over = true;
        const msg = enJaque(pos, turn) ? (turn === 'w' ? 'Jaque mate — gana el bot' : '¡Jaque mate! Has ganado 🎉') : 'Tablas por rey ahogado';
        $('#status').textContent = msg; App.toast(msg);
        Audio2.sfx(turn === 'w' ? 'bad' : 'win');
        App.record('ajedrez', turn === 'w' ? 'loss' : 'win');
        return;
      }
      if (materialInsuficiente(pos)) { over = true; $('#status').textContent = 'Tablas por material insuficiente'; App.toast('Tablas'); return; }
      if (pos.half >= 100) { over = true; $('#status').textContent = 'Tablas por la regla de 50 movimientos'; App.toast('Tablas'); return; }
      $('#status').textContent = enJaque(pos, turn) ? 'Jaque' : (turn === 'w' ? 'Tu turno' : 'Piensa el bot…');
    }
    function grab(i) { const el = $('#bd .piece[data-sq="' + i + '"]'); pendingFrom = el ? el.getBoundingClientRect() : null; }

    function elegirPromocion(cb) {
      promo = cb;
      const box = document.createElement('div');
      box.className = 'card'; box.id = 'promo';
      box.innerHTML = '<p style="margin:0 0 8px">Elige la pieza para coronar</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
        ['Q', 'R', 'B', 'N'].map(x => `<button data-p="${x}" style="font-size:32px;width:56px;height:56px;border-radius:14px;border:1px solid var(--outline);background:var(--surf2);color:var(--on)">${GLYPH[x]}</button>`).join('') + '</div>';
      $('#capt').after(box);
      box.querySelectorAll('button').forEach(b => b.onclick = () => {
        box.remove(); const f = promo; promo = null; f(b.dataset.p);
      });
    }
    function capturadas() {
      const inicial = { P: 8, N: 2, B: 2, R: 2, Q: 1, p: 8, n: 2, b: 2, r: 2, q: 1 };
      const quedan = {};
      pos.b.forEach(c => { if (c !== '.') quedan[c] = (quedan[c] || 0) + 1; });
      const falt = mayus => Object.keys(inicial)
        .filter(k => (mayus ? k === k.toUpperCase() : k === k.toLowerCase()))
        .flatMap(k => Array(Math.max(0, inicial[k] - (quedan[k] || 0))).fill(GLYPH[k])).join('');
      $('#capt').innerHTML = `<div>Te has comido: ${falt(false) || '—'}</div><div>El bot se ha comido: ${falt(true) || '—'}</div>`;
    }
    function render() {
      const bd = $('#bd'); bd.innerHTML = '';
      const g = document.createElement('div');
      g.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr)';
      const ms = (turn === 'w' && !over) ? legales(pos, 'w') : [];
      const destinos = sel !== null ? ms.filter(m => m.from === sel).map(m => m.to) : [];
      for (let i = 0; i < 64; i++) {
        const d = document.createElement('div');
        const dark = ((i >> 3) + (i & 7)) % 2;
        d.style.cssText = `aspect-ratio:1;display:grid;place-items:center;font-size:min(8vw,34px);position:relative;
          background:${dark ? '#b58863' : '#f0d9b5'};transition:background .2s`;
        if (pos.b[i] !== '.') {
          const sp = document.createElement('span');
          sp.className = 'piece'; sp.dataset.sq = i;
          sp.textContent = GLYPH[pos.b[i]];
          sp.style.cssText = `color:${isW(pos.b[i]) ? '#fff' : '#111'};text-shadow:${isW(pos.b[i]) ? '0 1px 2px rgba(0,0,0,.6)' : 'none'}`;
          d.appendChild(sp);
        }
        if (sel === i) d.style.background = '#f6d365';
        if (destinos.includes(i)) d.innerHTML += `<span style="position:absolute;width:26%;height:26%;border-radius:50%;background:rgba(20,120,60,.6)"></span>`;
        d.onclick = () => {
          if (over || turn !== 'w' || promo) return;
          const mv = sel !== null ? ms.find(m => m.from === sel && m.to === i) : null;
          if (mv) {
            const hacer = pieza => {
              grab(mv.from); lastTo = i;
              hist.push(clone(pos));
              pos = aplicar(pos, mv, pieza); sel = null; turn = 'b';
              Audio2.sfx('card'); render(); status();
              if (!over) App.timer(botMove, 240);
            };
            if (mv.promo) { sel = null; render(); elegirPromocion(hacer); }
            else hacer();
          } else { sel = (pos.b[i] !== '.' && own(pos.b[i], 'w')) ? i : null; render(); }
        };
        g.appendChild(d);
      }
      bd.appendChild(g);
      capturadas();
      if (pendingFrom && lastTo !== null) {
        Anim.slideFrom(bd.querySelector('.piece[data-sq="' + lastTo + '"]'), pendingFrom);
        pendingFrom = null; lastTo = null;
      }
    }
    init();
  }
};
