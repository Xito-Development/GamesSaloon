/* Comprueba el motor de ajedrez con perft (recuento de posiciones legales) */
const R = require('../www/js/games/ajedrez-reglas.js');

const esperado = { 1: 20, 2: 400, 3: 8902, 4: 197281 };
const fails = [];
for (const d of [1, 2, 3, 4]) {
  const n = R.perft(R.inicial(), 'w', +d);
  if (n !== esperado[d]) fails.push(`perft(${d}) = ${n}, debería ser ${esperado[d]}`);
}

// posición concreta: enroque corto blanco disponible y captura al paso
const pos = {
  b: ('r...k..r' + 'pppppppp' + '........'.repeat(4) + 'PPPPPPPP' + 'R...K..R').split(''),
  rights: { K: true, Q: true, k: true, q: true }, ep: -1, half: 0
};
const enroques = R.legales(pos, 'w').filter(m => m.enroque).length;
if (enroques !== 2) fails.push(`enroques blancos disponibles: ${enroques}, deberían ser 2`);

// tras mover el rey se pierden los derechos
const trasRey = R.aplicar(pos, { from: 60, to: 61 });
if (trasRey.rights.K || trasRey.rights.Q) fails.push('mover el rey no quita los derechos de enroque');

// captura al paso
const ep = {
  b: ('....k...' + '........' + '........' + '...pP...' + '........'.repeat(3) + '....K...').split(''),
  rights: { K: false, Q: false, k: false, q: false }, ep: 2 * 8 + 3, half: 0  // casilla al paso detrás del peón negro
};
const alPaso = R.legales(ep, 'w').filter(m => m.alPaso);
if (alPaso.length !== 1) fails.push(`capturas al paso encontradas: ${alPaso.length}, debería ser 1`);
else {
  const res = R.aplicar(ep, alPaso[0]);
  if (res.b[2 * 8 + 3] !== 'P' || res.b[3 * 8 + 3] !== '.') fails.push('la captura al paso no retira el peón capturado');
}

console.log(fails.length ? 'FALLOS:\n' + fails.join('\n')
  : 'Ajedrez: perft 1-4 correcto (20/400/8902/197281), enroque, pérdida de derechos y captura al paso ✔');
process.exit(fails.length ? 1 : 0);
