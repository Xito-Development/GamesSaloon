/* Motor de reglas del ajedrez, separado para poder probarlo (perft) */
const AjedrezReglas = (() => {
  const isW = c => c !== '.' && c === c.toUpperCase();
  const own = (c, t) => c !== '.' && (isW(c) ? 'w' : 'b') === t;
  const clone = p => ({ b: p.b.slice(), rights: { ...p.rights }, ep: p.ep, half: p.half });

  function pseudo(p, t, sinEnroque) {
  const bd = p.b, out = [];
  const add = (f, to) => { if (bd[to] === '.' || !own(bd[to], t)) out.push({ from: f, to }); };
    for (let i = 0; i < 64; i++) {
    const c = bd[i]; if (!own(c, t)) continue;
    const pz = c.toLowerCase(), r = i >> 3, f = i & 7;
      if (pz === 'p') {
      const d = t === 'w' ? -8 : 8, inicio = t === 'w' ? 6 : 1, coronar = t === 'w' ? 0 : 7;
        if (bd[i + d] === '.') {
          out.push({ from: i, to: i + d, promo: ((i + d) >> 3) === coronar });
          if (r === inicio && bd[i + 2 * d] === '.') out.push({ from: i, to: i + 2 * d, doble: true });
        }
        [-1, 1].forEach(dx => {
        const nf = f + dx; if (nf < 0 || nf > 7) return;
        const to = i + d + dx; if (to < 0 || to > 63) return;
          if (bd[to] !== '.' && !own(bd[to], t)) out.push({ from: i, to, promo: (to >> 3) === coronar });
          else if (to === p.ep && bd[to] === '.') out.push({ from: i, to, alPaso: true });
        });
      } else if (pz === 'n') {
        [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].forEach(([dx, dy]) => {
        const nf = f + dx, nr = r + dy;
          if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) add(i, nr * 8 + nf);
        });
      } else if (pz === 'k') {
        [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dx, dy]) => {
        const nf = f + dx, nr = r + dy;
          if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) add(i, nr * 8 + nf);
        });
        if (!sinEnroque) {
        const base = t === 'w' ? 56 : 0;
        const corto = t === 'w' ? p.rights.K : p.rights.k;
        const largo = t === 'w' ? p.rights.Q : p.rights.q;
          if (i === base + 4 && !enJaque(p, t)) {
            if (corto && bd[base + 5] === '.' && bd[base + 6] === '.' && bd[base + 7].toLowerCase() === 'r' && own(bd[base + 7], t)
              && !atacada(p, base + 5, t) && !atacada(p, base + 6, t)) out.push({ from: i, to: base + 6, enroque: 'corto' });
            if (largo && bd[base + 1] === '.' && bd[base + 2] === '.' && bd[base + 3] === '.' && bd[base].toLowerCase() === 'r' && own(bd[base], t)
              && !atacada(p, base + 3, t) && !atacada(p, base + 2, t)) out.push({ from: i, to: base + 2, enroque: 'largo' });
          }
        }
      } else {
      const dirs = pz === 'r' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : pz === 'b' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
          : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        dirs.forEach(([dx, dy]) => {
          let nf = f + dx, nr = r + dy;
          while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
          const to = nr * 8 + nf;
            if (bd[to] === '.') out.push({ from: i, to });
            else { if (!own(bd[to], t)) out.push({ from: i, to }); break; }
            nf += dx; nr += dy;
          }
        });
      }
    }
    return out;
  }
  function atacada(p, casilla, t) {
  const rival = t === 'w' ? 'b' : 'w';
    return pseudo(p, rival, true).some(m => m.to === casilla);
  }
  function enJaque(p, t) {
  const k = p.b.indexOf(t === 'w' ? 'K' : 'k');
    return k < 0 ? true : atacada(p, k, t);
  }
  function aplicar(p, m, pieza) {
  const n = clone(p), bd = n.b;
  const mov = bd[m.from], t = isW(mov) ? 'w' : 'b';
  const captura = bd[m.to] !== '.' || m.alPaso;
    bd[m.to] = mov; bd[m.from] = '.';
    if (m.alPaso) bd[m.to + (t === 'w' ? 8 : -8)] = '.';
    if (m.promo) bd[m.to] = t === 'w' ? (pieza || 'Q').toUpperCase() : (pieza || 'q').toLowerCase();
    if (m.enroque === 'corto') { const base = t === 'w' ? 56 : 0; bd[base + 5] = bd[base + 7]; bd[base + 7] = '.'; }
    if (m.enroque === 'largo') { const base = t === 'w' ? 56 : 0; bd[base + 3] = bd[base]; bd[base] = '.'; }
    if (mov === 'K') { n.rights.K = n.rights.Q = false; }
    if (mov === 'k') { n.rights.k = n.rights.q = false; }
    if (m.from === 63 || m.to === 63) n.rights.K = false;
    if (m.from === 56 || m.to === 56) n.rights.Q = false;
    if (m.from === 7 || m.to === 7) n.rights.k = false;
    if (m.from === 0 || m.to === 0) n.rights.q = false;
    n.ep = m.doble ? (m.from + m.to) / 2 : -1;
    n.half = (captura || mov.toLowerCase() === 'p') ? 0 : p.half + 1;
    return n;
  }

  const legales = (p, t) => pseudo(p, t).filter(m => !enJaque(aplicar(p, m), t));
  const inicial = () => ({
    b: ('rnbqkbnr' + 'pppppppp' + '........'.repeat(4) + 'PPPPPPPP' + 'RNBQKBNR').split(''),
    rights: { K: true, Q: true, k: true, q: true }, ep: -1, half: 0
  });
  const perft = (p, t, d) => {
    if (d === 0) return 1;
    let n = 0;
    for (const m of legales(p, t)) {
      if (m.promo) { for (const x of ['q', 'r', 'b', 'n']) n += perft(aplicar(p, m, x), t === 'w' ? 'b' : 'w', d - 1); }
      else n += perft(aplicar(p, m), t === 'w' ? 'b' : 'w', d - 1);
    }
    return n;
  };
  return { isW, own, clone, pseudo, atacada, enJaque, aplicar, legales, inicial, perft };
})();
if (typeof module !== 'undefined') module.exports = AjedrezReglas;
