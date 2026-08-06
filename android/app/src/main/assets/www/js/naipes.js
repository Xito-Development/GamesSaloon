/* Naipes dibujados en SVG: baraja francesa (picas, corazones, diamantes, tréboles)
   y baraja española (oros, copas, espadas, bastos) con figuras y dorso propios.
   Todo vectorial, sin imágenes externas: funciona sin conexión y escala sin pixelarse. */
const Naipes = {
  // ---------- palos franceses ----------
  PIP_FR: {
    '♠': '<path d="M50 12 C70 34 88 44 88 60 C88 72 78 79 68 79 C61 79 55 75 52 70 C54 80 57 86 62 90 L38 90 C43 86 46 80 48 70 C45 75 39 79 32 79 C22 79 12 72 12 60 C12 44 30 34 50 12Z"/>',
    '♣': '<circle cx="50" cy="30" r="17"/><circle cx="28" cy="58" r="17"/><circle cx="72" cy="58" r="17"/><path d="M46 55 h8 c0 16 2 27 8 35 H38 c6-8 8-19 8-35Z"/>',
    '♥': '<path d="M50 90 C22 68 10 55 10 40 C10 27 20 18 31 18 C40 18 46 23 50 30 C54 23 60 18 69 18 C80 18 90 27 90 40 C90 55 78 68 50 90Z"/>',
    '♦': '<path d="M50 8 C62 30 76 44 88 50 C76 56 62 70 50 92 C38 70 24 56 12 50 C24 44 38 30 50 8Z"/>'
  },
  // posiciones de los pips por valor (coordenadas 0-1 dentro de la carta)
  LAYOUT: {
    1: [[.5, .5]],
    2: [[.5, .2], [.5, .8]],
    3: [[.5, .2], [.5, .5], [.5, .8]],
    4: [[.3, .2], [.7, .2], [.3, .8], [.7, .8]],
    5: [[.3, .2], [.7, .2], [.5, .5], [.3, .8], [.7, .8]],
    6: [[.3, .2], [.7, .2], [.3, .5], [.7, .5], [.3, .8], [.7, .8]],
    7: [[.3, .2], [.7, .2], [.5, .35], [.3, .5], [.7, .5], [.3, .8], [.7, .8]],
    8: [[.3, .2], [.7, .2], [.5, .35], [.3, .5], [.7, .5], [.5, .65], [.3, .8], [.7, .8]],
    9: [[.3, .18], [.7, .18], [.3, .39], [.7, .39], [.5, .5], [.3, .61], [.7, .61], [.3, .82], [.7, .82]],
    10: [[.3, .16], [.7, .16], [.3, .37], [.7, .37], [.5, .27], [.5, .73], [.3, .63], [.7, .63], [.3, .84], [.7, .84]]
  },

  // ---------- palos españoles ----------
  PIP_ES: {
    oros: `<g><circle cx="50" cy="50" r="40" fill="#e8b93b" stroke="#8a6410" stroke-width="4"/>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#8a6410" stroke-width="3"/>
      <circle cx="50" cy="50" r="12" fill="none" stroke="#8a6410" stroke-width="3"/>
      <path d="M50 20 L50 32 M50 68 L50 80 M20 50 L32 50 M68 50 L80 50" stroke="#8a6410" stroke-width="3"/></g>`,
    copas: `<g fill="#c0392b" stroke="#7b241c" stroke-width="3">
      <path d="M26 18 h48 l-6 26 a18 18 0 0 1-36 0Z"/>
      <path d="M46 46 h8 v20 h-8Z"/>
      <path d="M30 66 h40 l4 12 H26Z"/>
      <path d="M22 22 c-10 6-8 24 8 26" fill="none"/><path d="M78 22 c10 6 8 24-8 26" fill="none"/></g>`,
    espadas: `<g><path d="M50 8 L58 26 L54 66 H46 L42 26Z" fill="#c9ced6" stroke="#5b6470" stroke-width="3"/>
      <rect x="26" y="64" width="48" height="7" rx="3" fill="#8a6410"/>
      <rect x="45" y="70" width="10" height="20" rx="3" fill="#8a6410"/>
      <circle cx="50" cy="92" r="6" fill="#8a6410"/></g>`,
    bastos: `<g><path d="M38 92 C40 60 44 36 34 12 C48 20 54 34 56 50 C60 34 68 22 80 16 C64 40 60 62 62 92Z"
      fill="#7a5230" stroke="#4a3018" stroke-width="3"/>
      <path d="M44 40 l-14-8 M60 30 l14-6 M48 62 l-16-4" stroke="#4a3018" stroke-width="4" stroke-linecap="round"/></g>`
  },

  // ---------- figuras ----------
  figura(tipo, color) {
    const oro = '#e8b93b', linea = '#3a2a1a';
    const cara = `
      <path d="M36 30 q0-16 14-16 q14 0 14 16 q0 16-14 16 q-14 0-14-16Z" fill="#f2d3b3" stroke="#8a6a4a" stroke-width="2"/>
      <circle cx="45" cy="30" r="2" fill="${linea}"/><circle cx="55" cy="30" r="2" fill="${linea}"/>
      <path d="M45 38 q5 4 10 0" stroke="#8a6a4a" stroke-width="2" fill="none"/>`;
    const cuerpo = `
      <path d="M24 100 q2-32 26-38 q24 6 26 38Z" fill="${color}" stroke="${linea}" stroke-width="2"/>
      <path d="M50 62 v38" stroke="${linea}" stroke-width="1.6" opacity=".6"/>
      <path d="M34 74 q16 8 32 0" stroke="${linea}" stroke-width="1.6" fill="none" opacity=".6"/>
      <path d="M38 62 q12-8 24 0" fill="#f7f2e6" stroke="${linea}" stroke-width="1.6"/>`;
    if (tipo === 'R' || tipo === 'K') return `<g>
      ${cuerpo}${cara}
      <path d="M32 18 l5-14 l6 11 l7-15 l7 15 l6-11 l5 14Z" fill="${oro}" stroke="#8a6410" stroke-width="2"/>
      <circle cx="43" cy="9" r="2" fill="#c0392b"/><circle cx="57" cy="9" r="2" fill="#c0392b"/>
      <path d="M70 66 l14-10 l4 6 l-14 12Z" fill="${oro}" stroke="#8a6410" stroke-width="1.6"/></g>`;
    if (tipo === 'Q') return `<g>
      ${cuerpo}${cara}
      <path d="M34 18 q16-16 32 0 l-3 6 H37Z" fill="${oro}" stroke="#8a6410" stroke-width="2"/>
      <circle cx="50" cy="10" r="3" fill="#c0392b" stroke="#8a6410" stroke-width="1.5"/>
      <path d="M66 70 q8 6 6 16" stroke="${linea}" stroke-width="2" fill="none"/>
      <circle cx="72" cy="88" r="5" fill="#f7f2e6" stroke="${linea}" stroke-width="1.6"/></g>`;
    if (tipo === 'C') return this.caballo(color);
    // sota / jota: figura joven con gorro y lanza
    return `<g>
      ${cuerpo}${cara}
      <path d="M34 22 q16-14 32 0 l-2 4 H36Z" fill="${color}" stroke="${linea}" stroke-width="2"/>
      <path d="M64 12 q10 2 8 12" stroke="${color}" stroke-width="3" fill="none"/>
      <path d="M78 40 v56" stroke="#7a5230" stroke-width="3"/>
      <path d="M78 40 l-5 -12 l5 -6 l5 6Z" fill="#c9ced6" stroke="#5b6470" stroke-width="1.6"/></g>`;
  },
  caballo(color) {
    const linea = '#3a2a1a';
    return `<g>
      <path d="M22 100 q4-26 18-34 q-4-10 2-18 q6 2 9 8 q10-12 26-14 q-4 10 0 16 q10 12 9 42Z"
        fill="#8a6a4a" stroke="${linea}" stroke-width="2"/>
      <path d="M64 22 l4-12 l5 10" fill="#8a6a4a" stroke="${linea}" stroke-width="2"/>
      <circle cx="68" cy="30" r="2.4" fill="${linea}"/>
      <path d="M40 44 q16 8 30 2" stroke="${linea}" stroke-width="2" fill="none"/>
      <path d="M30 62 q18 10 34 2 l2 10 q-18 8-38-2Z" fill="${color}" stroke="${linea}" stroke-width="2"/>
      <path d="M46 40 q-10-12-4-24 q8 4 12 12" fill="${color}" stroke="${linea}" stroke-width="2"/></g>`;
  },

  // ---------- carta completa ----------
  svg(c, w) {
    const h = Math.round(w * 1.45);
    const esp = c.palo !== undefined;
    const rojo = esp ? (c.si === 0 || c.si === 1) : (c.si === 1 || c.si === 2);
    const tinta = rojo ? '#c0392b' : '#1b1b1b';
    const num = esp ? { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7 }[c.r]
      : { A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10 }[c.r];
    const etiqueta = esp ? c.r : c.r;
    let centro = '';

    if (esp) {
      const palo = ['oros', 'copas', 'espadas', 'bastos'][c.si];
      if (num) {
        const puntos = this.LAYOUT[Math.min(num, 7)] || this.LAYOUT[1];
        centro = puntos.map(([x, y]) =>
          `<g transform="translate(${x * 100 - 15},${y * 145 - 15}) scale(0.3)">${this.PIP_ES[palo]}</g>`).join('');
      } else {
        const color = ['#c9a227', '#b03a2e', '#2e6da4', '#7a5230'][c.si];
        centro = `<g transform="translate(14,22) scale(0.72)">${this.figura(c.r, color)}</g>
          <g transform="translate(60,96) scale(0.3)">${this.PIP_ES[palo]}</g>`;
      }
    } else {
      const pip = this.PIP_FR[c.s];
      if (num) {
        const puntos = this.LAYOUT[num];
        centro = puntos.map(([x, y], i) =>
          `<g transform="translate(${x * 100 - 11},${y * 145 - 11}) scale(0.22) ${y > .5 ? 'rotate(180 50 50)' : ''}" fill="${tinta}">${pip}</g>`).join('');
      } else {
        const color = { J: '#2e6da4', Q: '#b03a2e', K: '#7a5230' }[c.r] || tinta;
        centro = `<g transform="translate(14,22) scale(0.72)">${this.figura(c.r, color)}</g>
          <g transform="translate(62,100) scale(0.22)" fill="${tinta}">${pip}</g>`;
      }
    }

    const esquina = (x, y, rot) => `<g transform="translate(${x},${y}) ${rot ? `rotate(180 6 10)` : ''}">
        <text x="6" y="12" font-size="15" font-weight="700" text-anchor="middle" fill="${tinta}"
          font-family="Georgia,serif">${etiqueta}</text>
        ${esp ? `<g transform="translate(0,14) scale(0.12)">${this.PIP_ES[['oros', 'copas', 'espadas', 'bastos'][c.si]]}</g>`
        : `<g transform="translate(1,14) scale(0.1)" fill="${tinta}">${this.PIP_FR[c.s]}</g>`}
      </g>`;

    return `<svg viewBox="0 0 100 145" width="${w}" height="${h}" style="display:block">
      <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fffdf7"/><stop offset="1" stop-color="#f1e8d5"/></linearGradient></defs>
      <rect x="1" y="1" width="98" height="143" rx="8" fill="url(#pg)" stroke="#c3b79c" stroke-width="2"/>
      <rect x="6" y="6" width="88" height="133" rx="6" fill="none" stroke="${esp ? '#d8cbb0' : 'none'}" stroke-width="1"/>
      ${centro}
      ${esquina(4, 4, false)}
      ${esquina(84, 121, true)}
    </svg>`;
  },

  dorso(w) {
    const h = Math.round(w * 1.45);
    return `<svg viewBox="0 0 100 145" width="${w}" height="${h}" style="display:block">
      <defs>
        <pattern id="dp" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="14" height="14" fill="#12406e"/>
          <circle cx="7" cy="7" r="3.4" fill="#1b5c9c"/>
          <path d="M0 0 L14 14" stroke="#0d3157" stroke-width="2"/>
        </pattern>
      </defs>
      <rect x="1" y="1" width="98" height="143" rx="8" fill="#0d2f52" stroke="#0a2440" stroke-width="2"/>
      <rect x="7" y="7" width="86" height="131" rx="6" fill="url(#dp)"/>
      <rect x="7" y="7" width="86" height="131" rx="6" fill="none" stroke="#e8c86a" stroke-width="1.5"/>
      <circle cx="50" cy="72" r="20" fill="#0d2f52" stroke="#e8c86a" stroke-width="1.5"/>
      <text x="50" y="79" font-size="18" text-anchor="middle" fill="#e8c86a" font-family="Georgia,serif" font-weight="700">GS</text>
    </svg>`;
  }
};
