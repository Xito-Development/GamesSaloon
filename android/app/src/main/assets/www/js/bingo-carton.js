/* Generador de cartones de bingo de 90 bolas (norma española):
   3 filas x 9 columnas, 5 números por fila (15 en total),
   columna 1 = 1-9, columnas 2-8 = decenas, columna 9 = 80-90,
   ninguna columna vacía, máximo 3 por columna y ordenadas de arriba a abajo. */
const BingoCarton = {
  rango(c) {
    if (c === 0) return Array.from({ length: 9 }, (_, i) => i + 1);
    if (c === 8) return Array.from({ length: 11 }, (_, i) => 80 + i);
    return Array.from({ length: 10 }, (_, i) => c * 10 + i);
  },
  reparto() {
    // cuántos números lleva cada columna: 9 columnas, 15 números, entre 1 y 3 por columna
    while (true) {
      const cnt = Array(9).fill(1);
      let restan = 15 - 9;
      while (restan > 0) {
        const c = Math.floor(Math.random() * 9);
        if (cnt[c] < 3) { cnt[c]++; restan--; }
      }
      // comprobar que se pueden colocar 5 por fila
      if (cnt.every(n => n >= 1 && n <= 3)) return cnt;
    }
  },
  nuevo() {
    for (let intento = 0; intento < 400; intento++) {
      const cnt = this.reparto();
      const grid = Array.from({ length: 3 }, () => Array(9).fill(null));
      const filas = [0, 0, 0];
      let ok = true;
      // columnas con 3 ocupan las tres filas; el resto se colocan buscando filas con hueco
      const orden = [...Array(9).keys()].sort((a, b) => cnt[b] - cnt[a]);
      for (const c of orden) {
        const libres = [0, 1, 2].filter(r => filas[r] < 5).sort((a, b) => filas[a] - filas[b]);
        if (libres.length < cnt[c]) { ok = false; break; }
        libres.slice(0, cnt[c]).forEach(r => { grid[r][c] = true; filas[r]++; });
      }
      if (!ok || filas.some(f => f !== 5)) continue;
      // rellenar con números ordenados dentro de cada columna
      for (let c = 0; c < 9; c++) {
        const nums = Cards.shuffle(this.rango(c)).slice(0, cnt[c]).sort((a, b) => a - b);
        let k = 0;
        for (let r = 0; r < 3; r++) if (grid[r][c]) grid[r][c] = nums[k++];
      }
      return grid;
    }
    return null;
  }
};
