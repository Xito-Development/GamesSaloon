/* Dominó doble-seis, 2 a 4 jugadores contra bots.
   Se reparten 7 fichas a cada uno, sale quien tenga el doble seis (o el doble más alto).
   Se encadenan fichas por los extremos; si no puedes, robas del pozo y si no hay, pasas.
   Gana quien se queda sin fichas o, si se cierra el juego, quien menos puntos tenga. */
const Domino = {
  id: 'domino', name: 'Dominó', hasBot: true,
  reglas: 'Encadena fichas por los extremos. Si no puedes, roba del pozo; si está vacío, pasas. Gana quien se queda sin fichas o quien menos puntos tenga si el juego se cierra.',
  mount(root, opts) {
    const NP = Math.min(4, Math.max(2, opts.players || 4));
    const diff = opts.diff || 'medio';
    const NOMBRES = ['Tú', 'Bot 1', 'Bot 2', 'Bot 3'];
    let manos, mesa, pozo, turno, sel, over, pases;

    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud" id="hud"></div></div>
      <div class="board-wrap"><div class="felt">
        <div id="mesa" style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-items:center;min-height:120px"></div>
      </div></div>
      <div class="card"><p id="msg" style="margin:0"></p></div>
      <div id="mano" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px"></div>
      <div class="row"><button class="btn ghost" id="pasar">Robar / pasar</button><button class="btn" id="nw">Nueva partida</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = start;
    $('#pasar').onclick = () => robarOPasar(0);
    const say = t => $('#msg').textContent = t;
    const puntos = m => m.reduce((a, f) => a + f[0] + f[1], 0);

    function start() {
      const fichas = [];
      for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) fichas.push([a, b]);
      Cards.shuffle(fichas);
      manos = Array.from({ length: NP }, () => fichas.splice(0, 7));
      pozo = fichas; mesa = []; sel = null; over = false; pases = 0;
      // sale el doble más alto
      let mejor = -1;
      manos.forEach((m, i) => m.forEach(f => { if (f[0] === f[1] && f[0] > mejor) { mejor = f[0]; turno = i; } }));
      if (mejor < 0) turno = 0;
      render();
      say(mejor >= 0 ? `Sale ${NOMBRES[turno]} con el doble ${mejor}.` : 'Empieza la partida.');
      if (turno !== 0) App.timer(turnoBot, 800);
    }
    const extremos = () => mesa.length ? [mesa[0][0], mesa[mesa.length - 1][1]] : null;
    function encaja(f) {
      if (!mesa.length) return { izq: true, der: true };
      const [i, d] = extremos();
      return { izq: f[0] === i || f[1] === i, der: f[0] === d || f[1] === d };
    }
    const puedeJugar = mano => mano.some(f => { const e = encaja(f); return e.izq || e.der; });

    function colocar(jug, idx, lado) {
      const f = manos[jug].splice(idx, 1)[0];
      if (!mesa.length) mesa.push(f.slice());
      else if (lado === 'izq') {
        const i = mesa[0][0];
        mesa.unshift(f[1] === i ? [f[0], f[1]] : [f[1], f[0]]);
      } else {
        const d = mesa[mesa.length - 1][1];
        mesa.push(f[0] === d ? [f[0], f[1]] : [f[1], f[0]]);
      }
      pases = 0; Audio2.sfx('chip');
      if (!manos[jug].length) return fin(jug, 'se ha quedado sin fichas');
      siguiente();
    }
    function robarOPasar(jug) {
      if (over || turno !== jug) return;
      if (puedeJugar(manos[jug])) return App.toast('Tienes ficha jugable');
      if (pozo.length) {
        manos[jug].push(pozo.pop()); Audio2.sfx('card');
        say(jug === 0 ? 'Robas una ficha del pozo.' : `${NOMBRES[jug]} roba del pozo.`);
        render();
        if (jug !== 0) App.timer(turnoBot, 500);
        return;
      }
      pases++;
      say(`${NOMBRES[jug]} pasa.`);
      if (pases >= NP) return cierre();
      siguiente();
    }
    function siguiente() {
      turno = (turno + 1) % NP; sel = null; render();
      if (over) return;
      if (turno !== 0) App.timer(turnoBot, 700);
      else if (!puedeJugar(manos[0]) && !pozo.length) App.timer(() => robarOPasar(0), 500);
      else say(puedeJugar(manos[0]) ? 'Tu turno: elige ficha.' : 'No tienes jugada, roba del pozo.');
    }
    function turnoBot() {
      if (over || turno === 0) return;
      const mano = manos[turno];
      const jugables = mano.map((f, i) => ({ f, i, e: encaja(f) })).filter(o => o.e.izq || o.e.der);
      if (!jugables.length) return robarOPasar(turno);
      let elegida;
      if (diff === 'facil') elegida = jugables[Math.floor(Math.random() * jugables.length)];
      else {
        // suelta primero las de más puntos y los dobles comprometidos
        jugables.sort((a, b) => (b.f[0] + b.f[1] + (b.f[0] === b.f[1] ? 3 : 0)) - (a.f[0] + a.f[1] + (a.f[0] === a.f[1] ? 3 : 0)));
        elegida = jugables[0];
        if (diff === 'medio' && Math.random() < .35) elegida = jugables[Math.floor(Math.random() * jugables.length)];
      }
      say(`${NOMBRES[turno]} juega ${elegida.f[0]}|${elegida.f[1]}`);
      colocar(turno, elegida.i, elegida.e.der ? 'der' : 'izq');
    }
    function cierre() {
      const totales = manos.map(puntos);
      const min = Math.min(...totales);
      const ganador = totales.indexOf(min);
      fin(ganador, `cierra el juego con ${min} puntos`);
    }
    function fin(jug, motivo) {
      over = true; render();
      const gano = jug === 0;
      say(`${NOMBRES[jug]} ${motivo}. ${gano ? '¡Ganas! 🎉' : 'Gana el bot.'}`);
      Audio2.sfx(gano ? 'win' : 'bad');
      App.record('domino', gano ? 'win' : 'loss');
    }

    function ficha(f, vertical) {
      const d = document.createElement('div');
      const w = Cards.fit(9, 46, 26);
      d.style.cssText = `width:${vertical ? w : w * 0.6}px;height:${vertical ? w * 0.6 : w}px;
        background:linear-gradient(150deg,#fffdf6,#e8e0cd);border:1px solid #b9ad92;border-radius:6px;
        box-shadow:0 3px 7px rgba(0,0,0,.45);display:flex;${vertical ? 'flex-direction:row' : 'flex-direction:column'};
        align-items:center;justify-content:space-around;font-weight:800;color:#1b1b1b;font-size:${Math.round(w * 0.34)}px`;
      d.innerHTML = `<span>${f[0]}</span><span style="opacity:.35">•</span><span>${f[1]}</span>`;
      return d;
    }
    function render() {
      $('#hud').innerHTML = NOMBRES.slice(0, NP).map((n, i) =>
        `${turno === i ? '▶ ' : ''}${n}: ${manos[i].length}`).join('<br>') + `<br>Pozo: ${pozo.length}`;
      const m = $('#mesa'); m.innerHTML = '';
      mesa.forEach(f => m.appendChild(ficha(f, true)));
      const h = $('#mano'); h.innerHTML = '';
      manos[0].forEach((f, i) => {
        const e = ficha(f, false);
        const enc = encaja(f);
        if (!over && turno === 0 && (enc.izq || enc.der)) {
          e.style.boxShadow = '0 0 0 3px var(--primary),0 4px 10px rgba(0,0,0,.5)';
          e.onclick = () => {
            if (enc.izq && enc.der && mesa.length) elegirLado(i);
            else colocar(0, i, enc.der ? 'der' : 'izq');
          };
        } else e.style.opacity = .6;
        h.appendChild(e);
      });
      $('#pasar').style.opacity = !over && turno === 0 && !puedeJugar(manos[0]) ? 1 : .45;
    }
    function elegirLado(i) {
      const [izq, der] = extremos();
      const box = document.createElement('div');
      box.className = 'card'; box.id = 'lado';
      box.innerHTML = `<p style="margin:0 0 8px">¿Por qué extremo la pones?</p>
        <div class="row"><button class="btn ghost" data-l="izq">Izquierda (${izq})</button><button class="btn ghost" data-l="der">Derecha (${der})</button></div>`;
      $('#mano').before(box);
      box.querySelectorAll('button').forEach(b => b.onclick = () => { box.remove(); colocar(0, i, b.dataset.l); });
    }
    start();
  }
};
