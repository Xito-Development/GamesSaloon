const Cards = {
  // ancho de carta que cabe seguro para n cartas en la fila
  fit(n, max = 78, min = 26) {
    const ancho = Math.min(window.innerWidth || 360, 620) - 32;
    return Math.max(min, Math.min(max, Math.floor(ancho / n) - 8));
  },
  FR_SUITS: [{ s: '♠', red: 0 }, { s: '♥', red: 1 }, { s: '♦', red: 1 }, { s: '♣', red: 0 }],
  FR_RANKS: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'],
  ES_SUITS: [{ s: '🌰', n: 'oros', red: 1 }, { s: '🍺', n: 'copas', red: 1 }, { s: '⚔️', n: 'espadas', red: 0 }, { s: '🏑', n: 'bastos', red: 0 }],

  frenchDeck() {
    const d = [];
    this.FR_SUITS.forEach((su, si) => this.FR_RANKS.forEach((r, ri) => d.push({ r, ri, s: su.s, si, red: su.red })));
    return d;
  },
  spanishDeck() {
    const ranks = ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'];
    const d = [];
    this.ES_SUITS.forEach((su, si) => ranks.forEach((r, ri) => d.push({ r, ri, s: su.s, si, red: su.red, palo: su.n })));
    return d;
  },
  shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
    return a;
  },
  el(c, { w = 58, faceDown = false } = {}) {
    const d = document.createElement('div');
    d.className = 'pcard' + (faceDown ? ' back' : '');
    d.style.width = w + 'px'; d.style.height = Math.round(w * 1.45) + 'px';
    d.innerHTML = (faceDown || !c) ? Naipes.dorso(w) : Naipes.svg(c, w);
    return d;
  }
};
