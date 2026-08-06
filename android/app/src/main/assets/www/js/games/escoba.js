/* Escoba de 15 (1 contra bot). Baraja española de 40: as 1 … siete 7, sota 8, caballo 9, rey 10.
   Se reparten 3 cartas a cada uno y 4 a la mesa. En tu turno tiras una carta: si con ella y una o varias
   de la mesa sumas 15, te las llevas; si dejas la mesa vacía es escoba (1 punto). Si no sumas 15, la carta
   se queda en la mesa. Al acabar el mazo, las cartas que queden en la mesa son para quien capturó por última vez.
   Puntos de la ronda: más cartas, más oros, el siete de oros y más sietes, además de 1 por escoba. Partida a 15. */
const Escoba = {
  id: 'escoba', name: 'Escoba', hasBot: true,
  reglas: 'Tira una carta y llévate las de la mesa que sumen 15 con ella. Vaciar la mesa es escoba. Puntúan más cartas, más oros, el siete de oros y más sietes. Se juega a 15 puntos.',
  VAL: { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'S': 8, 'C': 9, 'R': 10 },

  mount(root, opts) {
    const diff = opts.diff || 'medio';
    const V = this.VAL, LIMITE = 15;
    let deck, me, bot, mesa, capMe, capBot, escMe, escBot, turno, ultimo, over, finPartida = false;
    let total = { me: 0, bot: 0 };

    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud" id="hud"></div></div>
      <div class="board-wrap"><div class="felt">
        <div id="botrow" style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:10px"></div>
        <div id="mesa" style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;min-height:96px;align-items:center"></div>
      </div></div>
      <div class="card"><p id="msg" style="margin:0"></p><p id="sel" style="margin:6px 0 0;color:var(--primary)"></p></div>
      <div id="mano" style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px"></div>
      <div class="row"><button class="btn" id="recoger">Recoger 15</button><button class="btn ghost" id="tirar">Tirar sin recoger</button></div>
      <div class="row"><button class="btn ghost" id="limpiar">Quitar selección</button></div>
      <div class="row"><button class="btn ghost" id="nw">Nueva ronda</button><button class="btn ghost" id="reinicio">Reiniciar partida</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = () => { if (finPartida) return App.toast('Partida terminada, pulsa Reiniciar'); ronda(); };
    $('#reinicio').onclick = () => { total = { me: 0, bot: 0 }; finPartida = false; ronda(); App.toast('Partida nueva a 15 puntos'); };
    $('#limpiar').onclick = () => { elegidas = []; elegidaMano = null; pintar(); };
    $('#tirar').onclick = () => tirarSinRecoger();
    $('#recoger').onclick = () => {
      if (over || turno !== 'me') return;
      if (!elegidaMano) return App.toast('Elige primero una carta de tu mano');
      if (elegidas.length && V[elegidaMano.r] + suma(elegidas) === 15) return jugar(elegidaMano, elegidas.slice());
      const posibles = combinaciones(elegidaMano, mesa);
      if (!posibles.length) return App.toast('Esa carta no suma 15 con nada de la mesa');
      // la mejor: la que más cartas se lleva, priorizando dejar la mesa vacía
      posibles.sort((a, b) => (b.length === mesa.length ? 10 : b.length) - (a.length === mesa.length ? 10 : a.length));
      jugar(elegidaMano, posibles[0]);
    };
    const say = t => $('#msg').textContent = t;

    let elegidas = [], elegidaMano = null;

    function ronda() {
      deck = Cards.shuffle(Cards.spanishDeck());
      mesa = deck.splice(0, 4);
      me = []; bot = [];
      capMe = []; capBot = []; escMe = 0; escBot = 0;
      turno = 'me'; ultimo = null; over = false; elegidas = []; elegidaMano = null;
      repartir();
      say('Suma 15 con una carta tuya y las de la mesa que elijas.');
      pintar();
    }
    function repartir() {
      for (let i = 0; i < 3; i++) { if (deck.length) me.push(deck.pop()); if (deck.length) bot.push(deck.pop()); }
    }
    const suma = cs => cs.reduce((a, c) => a + V[c.r], 0);

    // busca subconjunto de la mesa que con la carta sume 15
    function combinaciones(carta, tablero) {
      const objetivo = 15 - V[carta.r], res = [];
      const rec = (i, acc, s) => {
        if (s === objetivo && acc.length) res.push(acc.slice());
        if (i >= tablero.length || s >= objetivo) return;
        rec(i + 1, acc.concat([tablero[i]]), s + V[tablero[i].r]);
        rec(i + 1, acc, s);
      };
      rec(0, [], 0);
      return res;
    }
    function jugar(carta, recoge) {
      const mano = turno === 'me' ? me : bot;
      mano.splice(mano.indexOf(carta), 1);
      if (recoge && recoge.length) {
        recoge.forEach(c => mesa.splice(mesa.indexOf(c), 1));
        const bolsa = turno === 'me' ? capMe : capBot;
        bolsa.push(carta, ...recoge);
        ultimo = turno;
        Audio2.sfx('chip');
        if (!mesa.length) {
          if (turno === 'me') { escMe++; say('¡ESCOBA! Mesa limpia'); } else { escBot++; say('El bot hace escoba'); }
          Audio2.sfx('win');
        } else say(turno === 'me' ? 'Te llevas ' + (recoge.length + 1) + ' cartas' : 'El bot recoge ' + (recoge.length + 1));
      } else {
        mesa.push(carta); Audio2.sfx('card');
        say(turno === 'me' ? 'Dejas la carta en la mesa' : 'El bot deja carta en la mesa');
      }
      elegidas = []; elegidaMano = null;
      turno = turno === 'me' ? 'bot' : 'me';
      if (!me.length && !bot.length) {
        if (deck.length) { repartir(); pintar(); }
        else return finRonda();
      }
      pintar();
      if (turno === 'bot' && !over) App.timer(turnoBot, 800);
    }
    function tirarSinRecoger() {
      if (over || turno !== 'me') return;
      if (!elegidaMano) return App.toast('Elige primero una carta de tu mano');
      const posibles = combinaciones(elegidaMano, mesa);
      if (posibles.length) return App.toast('Con esa carta puedes sumar 15: recoger es obligatorio');
      jugar(elegidaMano, null);
    }
    function turnoBot() {
      if (over || turno !== 'bot') return;
      let mejor = null;
      bot.forEach(c => combinaciones(c, mesa).forEach(comb => {
        const escoba = comb.length === mesa.length;
        const oros = comb.concat([c]).filter(x => x.si === 0).length;
        const sietes = comb.concat([c]).filter(x => x.r === '7').length;
        const velo = comb.some(x => x.r === '7' && x.si === 0) ? 5 : 0;
        const val = comb.length + 1 + (escoba ? 8 : 0) + oros * 1.5 + sietes * 1.5 + velo;
        if (!mejor || val > mejor.val) mejor = { c, comb, val };
      }));
      if (mejor && (diff !== 'facil' || Math.random() < .7)) return jugar(mejor.c, mejor.comb);
      if (mejor && diff === 'facil') return jugar(mejor.c, mejor.comb);
      // sin jugada: suelta la carta menos útil (evita dejar 15 fácil)
      const orden = bot.slice().sort((a, b) => (V[a.r] === 7 ? 10 : V[a.r]) - (V[b.r] === 7 ? 10 : V[b.r]));
      jugar(orden[0], null);
    }
    function finRonda() {
      over = true;
      if (mesa.length && ultimo) { (ultimo === 'me' ? capMe : capBot).push(...mesa); mesa = []; }
      const oros = b => b.filter(c => c.si === 0).length;
      const sietes = b => b.filter(c => c.r === '7').length;
      const velo = b => b.some(c => c.r === '7' && c.si === 0);
      let pMe = escMe, pBot = escBot;
      const det = [];
      if (capMe.length > capBot.length) { pMe++; det.push('cartas: tú'); } else if (capBot.length > capMe.length) { pBot++; det.push('cartas: bot'); }
      if (oros(capMe) > oros(capBot)) { pMe++; det.push('oros: tú'); } else if (oros(capBot) > oros(capMe)) { pBot++; det.push('oros: bot'); }
      if (velo(capMe)) { pMe++; det.push('siete de oros: tú'); } else if (velo(capBot)) { pBot++; det.push('siete de oros: bot'); }
      if (sietes(capMe) > sietes(capBot)) { pMe++; det.push('sietes: tú'); } else if (sietes(capBot) > sietes(capMe)) { pBot++; det.push('sietes: bot'); }
      total.me += pMe; total.bot += pBot;
      say(`Ronda: tú ${pMe} · bot ${pBot} (${det.join(', ') || 'sin mayorías'}${escMe || escBot ? `, escobas ${escMe}-${escBot}` : ''}). Marcador ${total.me}–${total.bot}`);
      pintar();
      if (total.me >= LIMITE || total.bot >= LIMITE) {
        finPartida = true;
        const gano = total.me > total.bot;
        App.timer(() => say(`Partida terminada ${total.me}–${total.bot}: ${gano ? '¡ganas tú! 🎉' : 'gana el bot'}`), 50);
        Audio2.sfx(gano ? 'win' : 'bad');
        App.record('escoba', gano ? 'win' : 'loss');
      }
    }
    function pintar() {
      $('#hud').innerHTML = `Partida ${total.me}–${total.bot} (a ${LIMITE})<br>Tus cartas: ${capMe.length} · escobas ${escMe}<br>Mazo: ${deck.length}`;
      const br = $('#botrow'); br.innerHTML = '';
      bot.forEach(c => br.appendChild(Cards.el(c, { w: Cards.fit(8, 44), faceDown: !over })));
      const mz = $('#mesa'); mz.innerHTML = '';
      mesa.forEach(c => {
        const e = Cards.el(c, { w: Cards.fit(7, 56) });
        if (elegidas.includes(c)) e.classList.add('sel');
        if (!over && turno === 'me') e.onclick = () => {
          const i = elegidas.indexOf(c);
          if (i >= 0) elegidas.splice(i, 1); else elegidas.push(c);
          Audio2.sfx('tick'); pintar();
        };
        mz.appendChild(e);
      });
      const h = $('#mano'); h.innerHTML = '';
      me.forEach(c => {
        const e = Cards.el(c, { w: Cards.fit(4, 68) });
        if (elegidaMano === c) e.classList.add('sel');
        if (!over && turno === 'me') e.onclick = () => { elegidaMano = elegidaMano === c ? null : c; Audio2.sfx('tick'); pintar(); };
        else e.style.opacity = .7;
        h.appendChild(e);
      });
      // aviso de suma y recogida automática si es válida
      if (elegidaMano) {
        const hay = combinaciones(elegidaMano, mesa).length;
        const s = V[elegidaMano.r] + suma(elegidas);
        $('#sel').textContent = `Suma actual: ${s}` + (s === 15 && elegidas.length ? ' — ¡15!' : hay ? ` · hay ${hay} forma${hay > 1 ? 's' : ''} de sumar 15, pulsa Recoger` : ' · no suma 15 con nada, puedes tirarla');
        if (s === 15 && elegidas.length) {
          const carta = elegidaMano, recoge = elegidas.slice();
          App.timer(() => { if (turno === 'me' && !over) jugar(carta, recoge); }, 350);
        }
      } else $('#sel').textContent = '';
      const hayComb = elegidaMano ? combinaciones(elegidaMano, mesa).length : 0;
      $('#tirar').style.opacity = !over && turno === 'me' && elegidaMano && !hayComb ? 1 : .45;
      $('#recoger').style.opacity = !over && turno === 'me' && hayComb ? 1 : .45;
    }
    ronda();
  }
};
