/* Damas españolas 8x8 — captura obligatoria y a la mayoría, damas voladoras */
const Damas = {
  id: 'damas', name: 'Damas', hasBot: true,
  mount(root, opts) {
    const depth = { facil: 1, medio: 3, dificil: 5 }[opts.diff || 'medio'];
    let b, turn, sel, over, chain = null, sinComer = 0, vistas = {};

    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud" id="hud">Juegas con blancas</div></div>
      <div class="board-wrap"><div id="bd" style="border-radius:var(--r-md);overflow:hidden;box-shadow:var(--shadow);border:6px solid #4a3524"></div></div>
      <div class="row"><button class="btn" id="nw">Nueva partida</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = init;

    const dark = i => ((i >> 3) + (i & 7)) % 2 === 1;
    function init() {
      b = Array(64).fill('.');
      for (let i = 0; i < 64; i++) { if (!dark(i)) continue; const r = i >> 3; if (r < 3) b[i] = 'n'; if (r > 4) b[i] = 'b'; }
      turn = 'b'; sel = null; over = false; chain = null; sinComer = 0; vistas = {}; render(); status();
    }
    const mine = (c, t) => c !== '.' && c.toLowerCase() === t;
    const isK = c => c === c.toUpperCase() && c !== '.';

    function caps(bd, i, t) {
      const out = [], c = bd[i], king = isK(c);
      const r = i >> 3, f = i & 7;
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, df]) => {
        if (king) {
          let nr = r + dr, nf = f + df;
          while (nr >= 0 && nr < 8 && nf >= 0 && nf < 8 && bd[nr * 8 + nf] === '.') { nr += dr; nf += df; }
          if (nr < 0 || nr > 7 || nf < 0 || nf > 7) return;
          const vic = nr * 8 + nf;
          if (mine(bd[vic], t)) return;
          let lr = nr + dr, lf = nf + df;
          while (lr >= 0 && lr < 8 && lf >= 0 && lf < 8 && bd[lr * 8 + lf] === '.') { out.push({ to: lr * 8 + lf, vic }); lr += dr; lf += df; }
        } else {
          const vr = r + dr, vf = f + df, lr = r + 2 * dr, lf = f + 2 * df;
          if (lr < 0 || lr > 7 || lf < 0 || lf > 7) return;
          const vic = vr * 8 + vf, land = lr * 8 + lf;
          if (bd[vic] !== '.' && !mine(bd[vic], t) && bd[land] === '.') out.push({ to: land, vic });
        }
      });
      return out;
    }
    function simples(bd, i, t) {
      const out = [], c = bd[i], king = isK(c), r = i >> 3, f = i & 7;
      const dirs = king ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : (t === 'b' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]]);
      dirs.forEach(([dr, df]) => {
        let nr = r + dr, nf = f + df;
        while (nr >= 0 && nr < 8 && nf >= 0 && nf < 8 && bd[nr * 8 + nf] === '.') {
          out.push({ to: nr * 8 + nf });
          if (!king) break;
          nr += dr; nf += df;
        }
      });
      return out;
    }
    function allMoves(bd, t) {
      let best = [];
      for (let i = 0; i < 64; i++) if (mine(bd[i], t)) {
        const seqs = capSeq(bd, i, t, []);
        seqs.forEach(s => best.push({ from: i, seq: s }));
      }
      if (best.length) {
        const max = Math.max(...best.map(m => m.seq.length));
        return best.filter(m => m.seq.length === max);
      }
      const out = [];
      for (let i = 0; i < 64; i++) if (mine(bd[i], t)) simples(bd, i, t).forEach(m => out.push({ from: i, seq: [m] }));
      return out;
    }
    function capSeq(bd, i, t, acc) {
      const cs = caps(bd, i, t);
      if (!cs.length) return acc.length ? [acc] : [];
      let res = [];
      cs.forEach(c => {
        const nb = bd.slice();
        nb[c.to] = nb[i]; nb[i] = '.'; nb[c.vic] = '.';
        res = res.concat(capSeq(nb, c.to, t, acc.concat([c])));
      });
      return res;
    }
    function applyMove(bd, mv) {
      const nb = bd.slice();
      let at = mv.from;
      mv.seq.forEach(s => { nb[s.to] = nb[at]; nb[at] = '.'; if (s.vic !== undefined) nb[s.vic] = '.'; at = s.to; });
      const r = at >> 3;
      if (nb[at] === 'b' && r === 0) nb[at] = 'B';
      if (nb[at] === 'n' && r === 7) nb[at] = 'N';
      return nb;
    }
    function evalb(bd) {
      let s = 0;
      for (let i = 0; i < 64; i++) {
        const c = bd[i]; if (c === '.') continue;
        const v = isK(c) ? 320 : 100 + (c.toLowerCase() === 'b' ? (7 - (i >> 3)) * 4 : (i >> 3) * 4);
        s += (c.toLowerCase() === 'b' ? 1 : -1) * v;
      }
      return s;
    }
    function search(bd, t, d, a, be) {
      const ms = allMoves(bd, t);
      if (!ms.length) return t === 'b' ? -99999 : 99999;
      if (d === 0) return evalb(bd);
      if (t === 'b') { let v = -1e9; for (const m of ms) { v = Math.max(v, search(applyMove(bd, m), 'n', d - 1, a, be)); a = Math.max(a, v); if (be <= a) break; } return v; }
      let v = 1e9; for (const m of ms) { v = Math.min(v, search(applyMove(bd, m), 'b', d - 1, a, be)); be = Math.min(be, v); if (be <= a) break; } return v;
    }
    function botMove() {
      const ms = allMoves(b, 'n');
      if (!ms.length) return status();
      let best = null, bv = 1e9;
      Cards.shuffle(ms).forEach(m => { const v = search(applyMove(b, m), 'b', depth - 1, -1e9, 1e9); if (v < bv) { bv = v; best = m; } });
      grab(best.from); lastTo = best.seq[best.seq.length - 1].to;
      sinComer = best.seq[0].vic !== undefined ? 0 : sinComer + 1;
      b = applyMove(b, best); turn = 'b'; Audio2.sfx(best.seq[0].vic !== undefined ? 'chip' : 'card');
      render(); status();
    }
    function status() {
      const k = b.join('') + turn;
      vistas[k] = (vistas[k] || 0) + 1;
      if (vistas[k] >= 3) { over = true; $('#hud').textContent = 'Tablas por repetición'; App.toast('Tablas por repetición'); return; }
      if (sinComer >= 40) { over = true; $('#hud').textContent = 'Tablas: 40 jugadas sin comer'; App.toast('Tablas'); return; }
      const ms = allMoves(b, turn);
      if (!ms.length) {
        over = true;
        const win = turn === 'n';
        $('#hud').textContent = win ? '¡Has ganado! 🎉' : 'Gana el bot';
        App.toast($('#hud').textContent); Audio2.sfx(win ? 'win' : 'bad');
        App.record('damas', win ? 'win' : 'loss');
      } else $('#hud').innerHTML = (() => {
        const mias = b.filter(c => c.toLowerCase() === 'b').length, suyas = b.filter(c => c.toLowerCase() === 'n').length;
        return `Tú ${mias} · Bot ${suyas}<br>` + (turn === 'b' ? (allMoves(b, 'b')[0].seq[0].vic !== undefined ? 'Captura obligatoria' : 'Tu turno') : 'Piensa el bot…');
      })();
    }
    let pendingFrom = null, lastTo = null;
    function grab(i) {
      const el = $('#bd .piece[data-sq="' + i + '"]');
      pendingFrom = el ? el.getBoundingClientRect() : null;
    }
    function render() {
      const bd = $('#bd'); bd.innerHTML = '';
      const g = document.createElement('div');
      g.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr)';
      const ms = turn === 'b' && !over ? allMoves(b, 'b') : [];
      const targets = sel !== null ? ms.filter(m => m.from === sel).map(m => m.seq[m.seq.length - 1].to) : [];
      for (let i = 0; i < 64; i++) {
        const d = document.createElement('div');
        d.style.cssText = `aspect-ratio:1;display:grid;place-items:center;position:relative;background:${dark(i) ? '#8b5a2b' : '#e8c9a0'}`;
        const c = b[i];
        if (c !== '.') {
          const p = document.createElement('div');
          const white = c.toLowerCase() === 'b';
          p.className = 'piece'; p.dataset.sq = i;
          p.style.cssText = `width:74%;height:74%;border-radius:50%;
            background:radial-gradient(circle at 32% 28%,${white ? '#fff,#cfc6b4' : '#5a5a5a,#161616'});
            box-shadow:0 3px 6px rgba(0,0,0,.55);display:grid;place-items:center;color:${white ? '#a07800' : '#f0b429'};font-size:16px`;
          if (isK(c)) p.textContent = '★';
          if (sel === i) p.style.boxShadow = '0 0 0 3px var(--primary),0 3px 6px rgba(0,0,0,.5)';
          d.appendChild(p);
        }
        if (targets.includes(i)) d.innerHTML += '<span style="position:absolute;width:28%;height:28%;border-radius:50%;background:rgba(20,140,70,.65)"></span>';
        d.onclick = () => {
          if (over || turn !== 'b') return;
          const mv = sel !== null ? ms.find(m => m.from === sel && m.seq[m.seq.length - 1].to === i) : null;
          if (mv) {
            grab(mv.from); lastTo = mv.seq[mv.seq.length - 1].to;
            sinComer = mv.seq[0].vic !== undefined ? 0 : sinComer + 1;
            b = applyMove(b, mv); sel = null; turn = 'n';
            Audio2.sfx(mv.seq[0].vic !== undefined ? 'chip' : 'card'); render(); status();
            if (!over) App.timer(botMove, 300);
          } else { sel = ms.some(m => m.from === i) ? i : null; render(); }
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
