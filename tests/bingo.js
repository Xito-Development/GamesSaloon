/* Valida 5000 cartones de bingo de 90 bolas según la norma española */
const fs = require('fs');
const p = require('path').join(__dirname, '..', 'www', 'js', 'bingo-carton.js');
const Cards = { shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; } };
const BingoCarton = new Function('Cards', fs.readFileSync(p, 'utf8') + ';return BingoCarton;')(Cards);

let malos = 0;
for (let n = 0; n < 5000; n++) {
  const g = BingoCarton.nuevo();
  if (!g) { malos++; continue; }
  const nums = g.flat().filter(x => x !== null);
  const filas = g.map(r => r.filter(x => x !== null).length);
  const cols = [...Array(9).keys()].map(c => g.filter(r => r[c] !== null).length);
  const rangos = [...Array(9).keys()].every(c => g.every(r => r[c] === null ||
    (c === 0 ? r[c] >= 1 && r[c] <= 9 : c === 8 ? r[c] >= 80 && r[c] <= 90 : r[c] >= c * 10 && r[c] <= c * 10 + 9)));
  const orden = [...Array(9).keys()].every(c => { const v = g.map(r => r[c]).filter(x => x !== null); return v.every((x, i) => i === 0 || x > v[i - 1]); });
  if (nums.length !== 15 || filas.some(f => f !== 5) || cols.some(c => c < 1 || c > 3) ||
    !rangos || !orden || new Set(nums).size !== 15) malos++;
}
console.log(malos ? `FALLO: ${malos} cartones inválidos de 5000` : 'Bingo: 5000 cartones válidos (15 números, 5 por fila, 1-3 por columna, rangos y orden correctos) ✔');
process.exit(malos ? 1 : 0);
