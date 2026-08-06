/* Brisca 1v1 contra bot — baraja española de 40.
   Reglas: 3 cartas en mano, carta de triunfo bajo el mazo (es la última que se roba),
   libertad total para tirar (no hay que asistir al palo), gana la baza el triunfo más alto
   o si no hay triunfos la carta más alta del palo de salida. Roba primero quien gana la baza
   y ese mismo sale en la siguiente. Cambio del 7 de triunfo permitido tras ganar baza. 120 puntos en juego. */
const Brisca = {
  id: 'brisca', name: 'Brisca', hasBot: true,
  PTS: { '1': 11, '3': 10, 'R': 4, 'C': 3, 'S': 2 },
  POW: { '1': 10, '3': 9, 'R': 8, 'C': 7, 'S': 6, '7': 5, '6': 4, '5': 3, '4': 2, '2': 1 },

  mount(root, opts) {
    const diff = opts.diff || 'medio';
    const PTS = this.PTS, POW = this.POW;
    let deck, triunfo, me, bot, mesa, lider, pMe, pBot, lock, over, dealt;

    root.innerHTML = `
      <div class="board-head">
        <button class="back" id="bk">← Salir</button>
        <div class="hud">Tú <b id="pm">0</b> · Bot <b id="pb">0</b><br><span id="rest"></span></div>
      </div>
      <div class="board-wrap"><div class="felt">
        <div style="display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:12px;flex-wrap:wrap" id="botrow"></div>
        <div style="display:flex;justify-content:center;gap:16px;min-height:112px;align-items:center;flex-wrap:wrap" id="mesa"></div>
        <div style="display:flex;justify-content:center;gap:10px;margin-top:12px;flex-wrap:wrap" id="mano"></div>
      </div></div>
      <div class="card"><p id="msg" style="margin:0"></p></div>
      <div class="row"><button class="btn ghost" id="cambio">Cambiar el 7</button><button class="btn" id="nw">Nueva partida</button></div>`;

    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = start;
    $('#cambio').onclick = cambiarSiete;
    const say = t => $('#msg').textContent = t;
    const pts = c => PTS[c.r] || 0;

    function start() {
      deck = Cards.shuffle(Cards.spanishDeck());
      triunfo = deck.shift();          // sale del mazo: será la última carta en robarse
      triunfo.enMazo = true;
      me = []; bot = []; mesa = [];
      pMe = pBot = 0; lock = false; over = false; dealt = -1;
      for (let i = 0; i < 3; i++) { me.push(deck.pop()); bot.push(deck.pop()); }
      lider = Math.random() < .5 ? 'me' : 'bot';
      render();
      say(`Triunfo: ${triunfo.r} de ${triunfo.palo}. ${lider === 'me' ? 'Sales tú.' : 'Sale el bot.'}`);
      if (lider === 'bot') { lock = true; App.timer(botPlay, 800); }
    }

    // gana la baza: a = carta de salida, b = segunda
    function ganador(a, b) {
      if (b.card.si === a.card.si) return POW[b.card.r] > POW[a.card.r] ? b : a;
      if (b.card.si === triunfo.si) return b;
      return a;
    }
    const cartasSinJugar = () => deck.length + (triunfo.enMazo ? 1 : 0);

    function puedeCambiar() {
      // tras ganar una baza (te toca salir), con el 7 de triunfo y quedando cartas por robar
      return !over && !mesa.length && lider === 'me' && triunfo.enMazo && deck.length > 0
        && me.some(c => c.si === triunfo.si && (c.r === '7' || (POW[triunfo.r] < POW['7'] && c.r === '2')));
    }
    function cambiarSiete() {
      if (!puedeCambiar()) return App.toast('Solo puedes cambiar el 7 de triunfo tras ganar una baza');
      const i = me.findIndex(c => c.si === triunfo.si && (c.r === '7' || c.r === '2'));
      const siete = me[i];
      me[i] = triunfo;
      triunfo = siete; triunfo.enMazo = true;
      Audio2.sfx('chip'); say('Has cambiado el 7 por la carta de triunfo.');
      render();
    }

    function play(i) {
      if (lock || over) return;
      if (mesa.length === 2) return;
      if (lider !== 'me' && mesa.length === 0) return;
      const c = me.splice(i, 1)[0];
      mesa.push({ who: 'me', card: c });
      Audio2.sfx('card'); render();
      if (mesa.length === 2) resolver();
      else { lock = true; App.timer(botPlay, 700); }
    }

    function botPlay() {
      if (over) return;
      const salida = mesa[0];
      let idx;
      if (!salida) {
        // sale el bot: tira la carta más barata que no sea triunfo si puede
        const cand = bot.map((c, i) => ({ c, i }));
        cand.sort((a, x) => (pts(a.c) * 4 + POW[a.c.r] + (a.c.si === triunfo.si ? 40 : 0))
          - (pts(x.c) * 4 + POW[x.c.r] + (x.c.si === triunfo.si ? 40 : 0)));
        idx = cand[0].i;
      } else {
        const valor = pts(salida.card);
        const gana = bot.map((c, i) => ({ c, i })).filter(o => ganador(salida, { who: 'bot', card: o.c }).card === o.c);
        const umbral = diff === 'dificil' ? 2 : diff === 'medio' ? 4 : 10;
        const merece = valor >= umbral || (cartasSinJugar() === 0 && gana.length);
        if (gana.length && merece) {
          // gana con lo más barato posible (prefiere no gastar triunfo si no hace falta)
          gana.sort((a, x) => (POW[a.c.r] + pts(a.c) + (a.c.si === triunfo.si ? 25 : 0))
            - (POW[x.c.r] + pts(x.c) + (x.c.si === triunfo.si ? 25 : 0)));
          idx = gana[0].i;
        } else {
          const cand = bot.map((c, i) => ({ c, i }));
          cand.sort((a, x) => (pts(a.c) * 4 + POW[a.c.r] + (a.c.si === triunfo.si ? 40 : 0))
            - (pts(x.c) * 4 + POW[x.c.r] + (x.c.si === triunfo.si ? 40 : 0)));
          idx = cand[0].i;
        }
        if (diff === 'facil' && Math.random() < .4) idx = Math.floor(Math.random() * bot.length);
      }
      const c = bot.splice(idx, 1)[0];
      mesa.push({ who: 'bot', card: c });
      Audio2.sfx('card');
      if (mesa.length === 2) { render(); resolver(); }
      else { lock = false; render(); }
    }

    function resolver() {
      lock = true;
      App.timer(() => {
        const g = ganador(mesa[0], mesa[1]);
        const total = pts(mesa[0].card) + pts(mesa[1].card);
        if (g.who === 'me') { pMe += total; say(`Ganas la baza (+${total})`); Audio2.sfx('chip'); }
        else { pBot += total; say(`Baza para el bot (+${total})`); Audio2.sfx('tick'); }
        lider = g.who;
        mesa = [];
        // roba primero quien gana la baza; la carta de triunfo es la última en robarse
        [g.who, g.who === 'me' ? 'bot' : 'me'].forEach(w => {
          const mano = w === 'me' ? me : bot;
          if (deck.length) mano.push(deck.pop());
          else if (triunfo.enMazo) { triunfo.enMazo = false; mano.push(triunfo); }
        });
        if (!me.length && !bot.length) { render(); return final(); }
        lock = lider !== 'me';
        render();
        if (lider === 'bot') App.timer(botPlay, 700);
      }, 900);
    }

    function final() {
      over = true;
      const gano = pMe > pBot;
      say(pMe === pBot ? `Empate a 60 — gana quien se llevó la última baza: ${lider === 'me' ? 'tú' : 'el bot'}`
        : gano ? `¡Ganas ${pMe}–${pBot}! 🎉` : `Pierdes ${pMe}–${pBot}`);
      const win = pMe === pBot ? lider === 'me' : gano;
      Audio2.sfx(win ? 'win' : 'bad');
      App.record('brisca', win ? 'win' : 'loss');
      render();
    }

    function render() {
      $('#pm').textContent = pMe; $('#pb').textContent = pBot;
      $('#rest').textContent = over ? `${pMe + pBot} de 120 puntos`
        : `${cartasSinJugar()} por robar · triunfo ${triunfo.r}${triunfo.s}`;

      const br = $('#botrow'); br.innerHTML = '';
      bot.forEach(() => br.appendChild(Cards.el(null, { w: Cards.fit(6, 52) , faceDown: true })));

      const mz = $('#mesa'); mz.innerHTML = '';
      if (triunfo.enMazo) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'position:relative;margin-right:26px;width:92px;height:88px';
        const t = Cards.el(triunfo, { w: 60 });
        t.style.cssText += 'position:absolute;left:0;top:12px;transform:rotate(90deg)';
        wrap.appendChild(t);
        if (deck.length) {
          const d = Cards.el(null, { w: 60, faceDown: true });
          d.style.cssText += 'position:absolute;left:30px;top:0';
          wrap.appendChild(d);
          const n = document.createElement('div');
          n.textContent = deck.length;
          n.style.cssText = 'position:absolute;left:74px;top:-4px;background:var(--surf3);color:var(--on);border-radius:99px;padding:2px 7px;font-size:11px';
          wrap.appendChild(n);
        }
        mz.appendChild(wrap);
      }
      mesa.forEach(m => {
        const e = Cards.el(m.card, { w: Cards.fit(5, 74) });
        e.classList.add('deal');
        e.style.marginTop = m.who === 'bot' ? '-14px' : '14px';
        mz.appendChild(e);
      });

      const mn = $('#mano'); mn.innerHTML = '';
      const puedoTirar = !over && !lock && (mesa.length === 1 || (mesa.length === 0 && lider === 'me'));
      me.forEach((c, i) => {
        const e = Cards.el(c, { w: Cards.fit(4, 78) });
        if (puedoTirar) { e.style.boxShadow = '0 0 0 3px var(--primary),0 5px 12px rgba(0,0,0,.5)'; e.onclick = () => play(i); }
        else e.style.opacity = .75;
        mn.appendChild(e);
      });
      if (dealt !== me.length) { dealt = me.length; Anim.deal([...mn.children], 70); }
      $('#cambio').style.opacity = puedeCambiar() ? 1 : .45;
    }

    start();
  }
};
