const Ajedrez = {
  id: 'ajedrez', name: 'Ajedrez', hasBot: true,
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
    let b, turn, sel, hist, over, lastTo = null;

    root.innerHTML = `
      <div class="board-head">
        <button class="back" id="bk">← Salir</button>
        <div class="hud" id="status">Juegas con blancas</div>
      </div>
      <div class="board-wrap"><div id="bd" style="border-radius:var(--r-md);overflow:hidden;box-shadow:var(--shadow);border:6px solid #4a3524;background:#4a3524"></div></div>
      <div class="row"><button class="btn ghost" id="undo">Deshacer</button><button class="btn" id="nw">Nueva</button></div>`;
    root.querySelector('#bk').onclick = () => App.go('hub');
    root.querySelector('#nw').onclick = init;
    root.querySelector('#undo').onclick = () => { if (hist.length >= 2) { b = hist.pop(); b = hist.pop(); turn = 'w'; over = 0; sel = null; render(); } };

    function init() {
      b = 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNR'.split('').join('');
      b = ('rnbqkbnr' + 'pppppppp' + '........'.repeat(4) + 'PPPPPPPP' + 'RNBQKBNR').split('');
      turn = 'w'; sel = null; hist = []; over = 0; render();
    }
    const isW = c => c !== '.' && c === c.toUpperCase();
    const own = (c, t) => c !== '.' && (isW(c) ? 'w' : 'b') === t;

    function moves(bd, t, checkLegal = true) {
      const out = [];
      const add = (f, to) => { if (bd[to] === '.' || !own(bd[to], t)) out.push([f, to]); };
      for (let i = 0; i < 64; i++) {
        const c = bd[i]; if (!own(c, t)) continue;
        const p = c.toLowerCase(), r = i >> 3, f = i & 7;
        if (p === 'p') {
          const d = t === 'w' ? -8 : 8, st = t === 'w' ? 6 : 1;
          if (bd[i + d] === '.') { out.push([i, i + d]); if (r === st && bd[i + 2 * d] === '.') out.push([i, i + 2 * d]); }
          [-1, 1].forEach(dx => {
            const to = i + d + dx;
            if (f + dx >= 0 && f + dx < 8 && to >= 0 && to < 64 && bd[to] !== '.' && !own(bd[to], t)) out.push([i, to]);
          });
        } else if (p === 'n') {
          [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(([dx, dy]) => {
            const nf = f + dx, nr = r + dy;
            if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) add(i, nr * 8 + nf);
          });
        } else if (p === 'k') {
          [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
            const nf = f + dx, nr = r + dy;
            if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) add(i, nr * 8 + nf);
          });
        } else {
          const dirs = p === 'r' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : p === 'b' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
            : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
          dirs.forEach(([dx, dy]) => {
            let nf = f + dx, nr = r + dy;
            while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
              const to = nr * 8 + nf;
              if (bd[to] === '.') out.push([i, to]);
              else { if (!own(bd[to], t)) out.push([i, to]); break; }
              nf += dx; nr += dy;
            }
          });
        }
      }
      if (!checkLegal) return out;
      return out.filter(m => { const n = apply(bd, m); return !inCheck(n, t); });
    }
    function apply(bd, [f, to]) {
      const n = bd.slice(); n[to] = n[f]; n[f] = '.';
      if (n[to] === 'P' && to < 8) n[to] = 'Q';
      if (n[to] === 'p' && to > 55) n[to] = 'q';
      return n;
    }
    function inCheck(bd, t) {
      const k = bd.indexOf(t === 'w' ? 'K' : 'k');
      if (k < 0) return true;
      return moves(bd, t === 'w' ? 'b' : 'w', false).some(m => m[1] === k);
    }
    function evalb(bd) {
      let s = 0;
      for (let i = 0; i < 64; i++) {
        const c = bd[i]; if (c === '.') continue;
        const p = c.toLowerCase(), w = isW(c);
        const pst = PST[p][w ? i : (56 - (i & 56) + (i & 7))];
        s += (w ? 1 : -1) * (VAL[p] + pst);
      }
      return s;
    }
    function search(bd, t, d, a, be) {
      if (d === 0) return evalb(bd);
      const ms = moves(bd, t);
      if (!ms.length) return inCheck(bd, t) ? (t === 'w' ? -99999 + d : 99999 - d) : 0;
      ms.sort((x, y) => (bd[y[1]] !== '.') - (bd[x[1]] !== '.'));
      if (t === 'w') {
        let best = -1e9;
        for (const m of ms) { best = Math.max(best, search(apply(bd, m), 'b', d - 1, a, be)); a = Math.max(a, best); if (be <= a) break; }
        return best;
      } else {
        let best = 1e9;
        for (const m of ms) { best = Math.min(best, search(apply(bd, m), 'w', d - 1, a, be)); be = Math.min(be, best); if (be <= a) break; }
        return best;
      }
    }
    function botMove() {
      const ms = moves(b, 'b');
      if (!ms.length) return end();
      let best = null, bv = 1e9;
      Cards.shuffle(ms).forEach(m => {
        const v = search(apply(b, m), 'w', depth - 1, -1e9, 1e9);
        if (v < bv) { bv = v; best = m; }
      });
      grab(best[0]); lastTo = best[1];
      hist.push(b.slice());
      b = apply(b, best); turn = 'w'; Audio2.sfx('card'); render(); end();
    }
    function end() {
      const ms = moves(b, turn);
      if (!ms.length) {
        over = 1;
        const msg = inCheck(b, turn) ? (turn === 'w' ? 'Jaque mate — gana el bot' : '¡Jaque mate! Has ganado 🎉') : 'Tablas por ahogado';
        root.querySelector('#status').textContent = msg;
        App.toast(msg); Audio2.sfx(turn === 'w' ? 'bad' : 'win');
        App.record('ajedrez', turn === 'w' ? 'loss' : 'win');
      } else if (inCheck(b, turn)) root.querySelector('#status').textContent = 'Jaque';
      else root.querySelector('#status').textContent = turn === 'w' ? 'Tu turno' : 'Piensa el bot…';
    }
    let pendingFrom = null;
    function grab(i) {
      const el = root.querySelector('#bd .piece[data-sq="' + i + '"]');
      pendingFrom = el ? el.getBoundingClientRect() : null;
    }
    function render() {
      const bd = root.querySelector('#bd');
      bd.innerHTML = '';
      const g = document.createElement('div');
      g.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr)';
      const legal = sel !== null ? moves(b, turn).filter(m => m[0] === sel).map(m => m[1]) : [];
      for (let i = 0; i < 64; i++) {
        const d = document.createElement('div');
        const dark = ((i >> 3) + (i & 7)) % 2;
        d.style.cssText = `aspect-ratio:1;display:grid;place-items:center;font-size:min(8vw,34px);position:relative;
          background:${dark ? '#b58863' : '#f0d9b5'};color:${isW(b[i]) ? '#fff' : '#111'};
          text-shadow:${isW(b[i]) ? '0 1px 2px rgba(0,0,0,.6)' : 'none'};transition:background .2s`;
        if (b[i] !== '.') {
          const sp = document.createElement('span');
          sp.className = 'piece';
          sp.dataset.sq = i;
          sp.textContent = GLYPH[b[i]] || GLYPH[b[i].toLowerCase()];
          d.appendChild(sp);
        }
        if (sel === i) d.style.background = '#f6d365';
        if (legal.includes(i)) d.innerHTML += `<span style="position:absolute;width:26%;height:26%;border-radius:50%;background:rgba(20,120,60,.6)"></span>`;
        d.onclick = () => {
          if (over || turn !== 'w') return;
          if (sel !== null && legal.includes(i)) {
            grab(sel); lastTo = i;
            hist.push(b.slice()); b = apply(b, [sel, i]); sel = null; turn = 'b';
            Audio2.sfx('card'); render(); end();
            if (!over) App.timer(botMove, 220);
          } else { sel = (b[i] !== '.' && own(b[i], 'w')) ? i : null; render(); }
        };
        g.appendChild(d);
      }
      bd.appendChild(g);
      if (pendingFrom && lastTo !== null) {
        Anim.slideFrom(bd.querySelector('.piece[data-sq="' + lastTo + '"]'), pendingFrom);
        pendingFrom = null; lastTo = null;
      }
    }
    init();
  }
};
