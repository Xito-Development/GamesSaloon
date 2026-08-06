/* Generala: 5 dados, hasta 3 tiradas por turno, 11 casillas de puntuación.
   1-6: suma de los dados de ese número. Escalera 20 (25 servida), Full 30 (35),
   Póker 40 (45), Generala 50 (60 servida y gana la partida). */
const Generala = {
  id: 'generala', name: 'Generala', hasBot: true,
  reglas: 'Tres tiradas por turno: guarda los dados que quieras y vuelve a tirar. Después anota en una casilla libre. Escalera, full, póker y generala dan más si salen servidas en la primera tirada.',
  CATS: [
    { id: '1', n: 'Unos' }, { id: '2', n: 'Doses' }, { id: '3', n: 'Treses' },
    { id: '4', n: 'Cuatros' }, { id: '5', n: 'Cincos' }, { id: '6', n: 'Seises' },
    { id: 'esc', n: 'Escalera' }, { id: 'full', n: 'Full' }, { id: 'poker', n: 'Póker' },
    { id: 'gen', n: 'Generala' }, { id: 'doble', n: 'Doble generala' }
  ],
  mount(root, opts) {
    const NP = Math.min(4, Math.max(2, opts.players || 2));
    const NOMBRES = ['Tú', 'Bot 1', 'Bot 2', 'Bot 3'];
    const CATS = this.CATS;
    let dados, guardados, tiradas, turno, hojas, over, genHecha;

    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud" id="hud"></div></div>
      <div class="board-wrap"><div class="felt">
        <div id="dados" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;min-height:70px;align-items:center"></div>
        <p id="msg" style="text-align:center;margin:10px 0 0;color:#e9f5ef"></p>
      </div></div>
      <div class="row"><button class="btn" id="tirar">Tirar dados</button></div>
      <div class="card" id="hoja" style="font-size:14px"></div>
      <div class="row"><button class="btn ghost" id="nw">Nueva partida</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = init;
    $('#tirar').onclick = () => tirar();
    const say = t => $('#msg').textContent = t;

    function init() {
      hojas = Array.from({ length: NP }, () => ({}));
      turno = 0; over = false; genHecha = false;
      nuevoTurno();
    }
    function nuevoTurno() {
      dados = [0, 0, 0, 0, 0]; guardados = [false, false, false, false, false]; tiradas = 0;
      render();
      say(turno === 0 ? 'Tu turno: tira los dados.' : `Turno de ${NOMBRES[turno]}`);
      if (turno !== 0) App.timer(turnoBot, 700);
    }
    function tirar() {
      if (over || turno !== 0 || tiradas >= 3) return;
      dados = dados.map((d, i) => guardados[i] && tiradas ? d : 1 + Math.floor(Math.random() * 6));
      tiradas++; Audio2.sfx('tick'); render();
      say(tiradas < 3 ? `Tirada ${tiradas} de 3 · toca los dados que quieras guardar` : 'Última tirada: elige dónde anotar');
    }
    const cuenta = ds => { const c = {}; ds.forEach(d => c[d] = (c[d] || 0) + 1); return c; };
    function puntos(cat, ds, servida) {
      const c = cuenta(ds), vals = Object.values(c);
      const ord = ds.slice().sort().join('');
      switch (cat) {
        case '1': case '2': case '3': case '4': case '5': case '6':
          return (c[+cat] || 0) * +cat;
        case 'esc': return (ord === '12345' || ord === '23456' || ord === '13456') ? (servida ? 25 : 20) : 0;
        case 'full': return (vals.includes(3) && vals.includes(2)) || vals.includes(5) ? (servida ? 35 : 30) : 0;
        case 'poker': return vals.some(v => v >= 4) ? (servida ? 45 : 40) : 0;
        case 'gen': return vals.includes(5) ? (servida ? 60 : 50) : 0;
        case 'doble': return vals.includes(5) && genHecha ? 100 : 0;
        default: return 0;
      }
    }
    function anotar(jug, cat) {
      const servida = tiradas === 1;
      const p = puntos(cat, dados, servida);
      hojas[jug][cat] = p;
      if (cat === 'gen' && p) genHecha = true;
      Audio2.sfx(p ? 'chip' : 'bad');
      say(`${NOMBRES[jug]} anota ${p} en ${CATS.find(c => c.id === cat).n}`);
      if (cat === 'gen' && p >= 60) return fin(jug, 'generala servida');
      render();
      if (hojas.every(h => CATS.every(c => h[c.id] !== undefined))) return fin();
      turno = (turno + 1) % NP;
      App.timer(nuevoTurno, 900);
    }
    function turnoBot() {
      if (over || turno === 0) return;
      // tira hasta 3 veces guardando el número más repetido
      dados = dados.map(() => 1 + Math.floor(Math.random() * 6)); tiradas = 1; render();
      App.timer(() => {
        for (let t = 2; t <= 3; t++) {
          const c = cuenta(dados);
          const mejorNum = +Object.keys(c).sort((a, b) => c[b] - c[a] || b - a)[0];
          dados = dados.map(d => d === mejorNum ? d : 1 + Math.floor(Math.random() * 6));
          tiradas = t;
        }
        render();
        const libres = CATS.filter(c => hojas[turno][c.id] === undefined);
        let mejor = libres[0], mp = -1;
        libres.forEach(c => { const p = puntos(c.id, dados, false); if (p > mp) { mp = p; mejor = c; } });
        if (mp === 0) {
          // tacha la casilla menos valiosa
          const orden = ['1', 'doble', 'gen', '2', 'poker', '3', 'esc', 'full', '4', '5', '6'];
          mejor = libres.sort((a, b) => orden.indexOf(a.id) - orden.indexOf(b.id))[0];
        }
        App.timer(() => anotar(turno, mejor.id), 500);
      }, 700);
    }
    function total(h) { return CATS.reduce((a, c) => a + (h[c.id] || 0), 0); }
    function fin(jug, motivo) {
      over = true;
      const totales = hojas.map(total);
      const ganador = jug !== undefined ? jug : totales.indexOf(Math.max(...totales));
      say(`${motivo ? NOMBRES[ganador] + ' hace ' + motivo + '. ' : ''}Gana ${NOMBRES[ganador]} con ${totales[ganador]} puntos.`);
      Audio2.sfx(ganador === 0 ? 'win' : 'bad');
      App.record('generala', ganador === 0 ? 'win' : 'loss');
      render();
    }
    function caraDado(v, guardado, i) {
      const d = document.createElement('div');
      const w = Cards.fit(6, 56, 34);
      d.style.cssText = `width:${w}px;height:${w}px;border-radius:14px;background:linear-gradient(150deg,#fff,#e6e1d5);
        box-shadow:0 5px 12px rgba(0,0,0,.5)${guardado ? ',0 0 0 3px var(--primary)' : ''};display:grid;
        grid-template-columns:repeat(3,1fr);gap:2px;padding:${Math.round(w * 0.14)}px;transition:transform .3s var(--ease)`;
      const patron = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[v] || [];
      for (let k = 0; k < 9; k++) {
        const p = document.createElement('div');
        p.style.cssText = `border-radius:50%;background:${patron.includes(k) ? '#1b1b1b' : 'transparent'}`;
        d.appendChild(p);
      }
      if (!over && turno === 0 && tiradas > 0 && tiradas < 3) d.onclick = () => { guardados[i] = !guardados[i]; Audio2.sfx('tick'); render(); };
      return d;
    }
    function render() {
      $('#hud').innerHTML = NOMBRES.slice(0, NP).map((n, i) =>
        `${turno === i ? '▶ ' : ''}${n}: ${total(hojas[i])}`).join('<br>');
      const dd = $('#dados'); dd.innerHTML = '';
      dados.forEach((v, i) => dd.appendChild(caraDado(v || 1, guardados[i], i)));
      if (!dados.some(Boolean)) dd.style.opacity = .4; else dd.style.opacity = 1;
      const h = $('#hoja'); h.innerHTML = '';
      CATS.forEach(c => {
        const fila = document.createElement('div');
        fila.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--outline)';
        const usado = hojas[0][c.id] !== undefined;
        const posible = !over && turno === 0 && tiradas > 0 && !usado;
        fila.innerHTML = `<span style="flex:1">${c.n}</span>` +
          hojas.map((hh, i) => `<b style="width:36px;text-align:right;color:${i === 0 ? 'var(--on)' : 'var(--on-dim)'}">${hh[c.id] !== undefined ? hh[c.id] : '–'}</b>`).join('');
        if (posible) {
          const btn = document.createElement('button');
          btn.className = 'btn';
          btn.style.cssText = 'width:auto;padding:6px 12px;font-size:13px';
          btn.textContent = 'Anotar ' + puntos(c.id, dados, tiradas === 1);
          btn.onclick = () => anotar(0, c.id);
          fila.appendChild(btn);
        }
        h.appendChild(fila);
      });
      $('#tirar').style.opacity = (!over && turno === 0 && tiradas < 3) ? 1 : .45;
      $('#tirar').textContent = tiradas === 0 ? 'Tirar dados' : `Volver a tirar (${3 - tiradas})`;
    }
    init();
  }
};
