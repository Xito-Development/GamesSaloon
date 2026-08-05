const Brisca = {
  id: 'brisca', name: 'Brisca', hasBot: true,
  mount(root, opts) {
    const diff = opts.diff || 'medio';
    const PTS = { '1': 11, '3': 10, 'R': 4, 'C': 3, 'S': 2 };
    const POW = { '1': 10, '3': 9, 'R': 8, 'C': 7, 'S': 6, '7': 5, '6': 4, '5': 3, '4': 2, '2': 1 };
    let deck, triunfo, me = [], bot = [], mesa = [], turno = 'me', pMe = 0, pBot = 0, lock = false, dealt = -1;

    root.innerHTML = `
      <div class="board-head">
        <button class="back" id="bk">← Salir</button>
        <div class="hud">Tú <b id="pm">0</b> · Bot <b id="pb">0</b><br><span id="rest"></span></div>
      </div>
      <div class="board-wrap"><div class="felt">
        <div style="display:flex;align-items:center;gap:14px;justify-content:center;margin-bottom:12px" id="botrow"></div>
        <div style="display:flex;justify-content:center;gap:16px;min-height:110px;align-items:center" id="mesa"></div>
        <div style="display:flex;justify-content:center;gap:10px;margin-top:12px" id="mano"></div>
      </div></div>
      <div class="card"><p id="msg" style="margin:0">Gana quien pase de 60 puntos. Palo de triunfo abajo a la izquierda.</p></div>
      <div class="row"><button class="btn ghost" id="nw">Nueva partida</button></div>`;
    root.querySelector('#bk').onclick = () => App.go('hub');
    root.querySelector('#nw').onclick = start;

    function start() {
      deck = Cards.shuffle(Cards.spanishDeck());
      triunfo = deck[0]; me = []; bot = []; mesa = []; pMe = pBot = 0; turno = 'me'; lock = false;
      dealt = -1;
      for (let i = 0; i < 3; i++) { me.push(deck.pop()); bot.push(deck.pop()); }
      render(); msg('Empiezas tú. El triunfo es ' + triunfo.palo + ' ' + triunfo.s);
    }
    const msg = t => root.querySelector('#msg').textContent = t;
    const pts = c => PTS[c.r] || 0;

    function wins(a, b) { // a jugada primero
      if (b.si === a.si) return POW[b.r] > POW[a.r] ? b : a;
      if (b.si === triunfo.si) return b;
      return a;
    }
    function render() {
      root.querySelector('#pm').textContent = pMe;
      root.querySelector('#pb').textContent = pBot;
      root.querySelector('#rest').textContent = deck.length ? deck.length + ' cartas · triunfo ' + triunfo.s : 'últimas bazas';
      const br = root.querySelector('#botrow'); br.innerHTML = '';
      bot.forEach(() => br.appendChild(Cards.el(null, { w: 52, faceDown: true })));
      const mz = root.querySelector('#mesa'); mz.innerHTML = '';
      const pile = document.createElement('div'); pile.style.cssText = 'position:relative;margin-right:20px';
      if (deck.length) {
        const t = Cards.el(triunfo, { w: 60 }); t.style.transform = 'rotate(90deg) translateX(16px)';
        pile.appendChild(t);
        const d = Cards.el(null, { w: 60, faceDown: true }); d.style.cssText += 'position:absolute;top:0;left:30px';
        pile.appendChild(d);
      }
      mz.appendChild(pile);
      mesa.forEach(c => { const e = Cards.el(c, { w: 74 }); e.classList.add('deal'); mz.appendChild(e); });
      const mn = root.querySelector('#mano'); mn.innerHTML = '';
      me.forEach((c, i) => {
        const e = Cards.el(c, { w: 78 });
        e.onclick = () => play(i);
        mn.appendChild(e);
      });
      if (dealt !== me.length) { dealt = me.length; Anim.deal([...mn.children], 70); }
    }
    function play(i) {
      if (lock || turno !== 'me') return;
      const c = me.splice(i, 1)[0]; mesa.push(c); Audio2.sfx('card'); render();
      if (mesa.length === 2) resolve(); else { turno = 'bot'; lock = true; App.timer(botPlay, 700); }
    }
    function botPlay() {
      let idx = 0;
      const led = mesa[0];
      if (!led) {
        // sale el bot: tira la más baja sin puntos
        idx = bot.reduce((bi, c, i) => (pts(c) + POW[c.r] / 20 < pts(bot[bi]) + POW[bot[bi].r] / 20 ? i : bi), 0);
      } else {
        const gan = bot.map((c, i) => ({ c, i })).filter(o => wins(led, o.c) === o.c);
        const valor = pts(led);
        const arriesga = diff === 'dificil' ? valor >= 2 : diff === 'medio' ? valor >= 4 : valor >= 10;
        if (gan.length && arriesga) idx = gan.sort((a, b) => (POW[a.c.r] + (a.c.si === triunfo.si ? 20 : 0)) - (POW[b.c.r] + (b.c.si === triunfo.si ? 20 : 0)))[0].i;
        else idx = bot.map((c, i) => ({ c, i })).sort((a, b) => (pts(a.c) * 3 + POW[a.c.r]) - (pts(b.c) * 3 + POW[b.c.r]))[0].i;
      }
      const c = bot.splice(idx, 1)[0]; mesa.push(c); Audio2.sfx('card'); render();
      if (mesa.length === 2) resolve(); else { turno = 'me'; lock = false; }
    }
    function resolve() {
      lock = true;
      App.timer(() => {
        const first = mesa[0], second = mesa[1];
        const w = wins(first, second);
        const total = pts(first) + pts(second);
        const meFirst = turno === 'me';
        const meWins = (meFirst && w === first) || (!meFirst && w === second);
        if (meWins) { pMe += total; msg('Ganas la baza (+' + total + ')'); }
        else { pBot += total; msg('Baza para el bot (+' + total + ')'); }
        Audio2.sfx(meWins ? 'chip' : 'tick');
        mesa = [];
        // robar
        const order = meWins ? ['me', 'bot'] : ['bot', 'me'];
        order.forEach(p => { if (deck.length) (p === 'me' ? me : bot).push(deck.pop()); else if (triunfo && !triunfo.taken) { triunfo.taken = 1; (p === 'me' ? me : bot).push(triunfo); } });
        turno = meWins ? 'me' : 'bot'; lock = false; render();
        if (!me.length && !bot.length) return finish();
        if (turno === 'bot') { lock = true; App.timer(botPlay, 700); }
      }, 800);
    }
    function finish() {
      const win = pMe > pBot;
      msg(win ? `¡Ganas ${pMe}–${pBot}! 🎉` : pMe === pBot ? 'Empate a 60' : `Pierdes ${pMe}–${pBot}`);
      Audio2.sfx(win ? 'win' : 'bad');
      App.record('brisca', win ? 'win' : 'loss');
    }
    start();
  }
};
