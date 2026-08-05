/* Chinchón 1v1 contra bot — baraja española de 40 */
const Chinchon = {
  id: 'chinchon', name: 'Chinchón', hasBot: true,
  VAL: { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, 'S': 8, 'C': 9, 'R': 10 },
  ORD: ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'],

  mount(root, opts) {
    const diff = opts.diff || 'medio';
    const V = this.VAL, O = this.ORD;
    let deck, me, bot, pile, turn, drawn, over, score = { me: 0, bot: 0 };

    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud">Tú <b id="sm">0</b> · Bot <b id="sb">0</b><br><span id="rest"></span></div></div>
      <div class="board-wrap"><div class="felt">
        <div style="display:flex;justify-content:center;gap:10px;margin-bottom:10px" id="botrow"></div>
        <div style="display:flex;justify-content:center;gap:22px;align-items:center" id="centro"></div>
      </div></div>
      <div class="card"><p id="msg" style="margin:0"></p><p id="dw" style="margin:6px 0 0;color:var(--primary)"></p></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:14px" id="mano"></div>
      <div class="row"><button class="btn ghost" id="cerrar">Cerrar</button><button class="btn" id="nw">Nueva ronda</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = deal;
    $('#cerrar').onclick = () => close(0);
    const say = t => $('#msg').textContent = t;

    function deal() {
      deck = Cards.shuffle(Cards.spanishDeck());
      me = deck.splice(0, 7); bot = deck.splice(0, 7);
      pile = [deck.pop()]; turn = 0; drawn = false; over = false;
      sortHand(); say('Roba del mazo o del descarte, y luego tira una carta.');
      render();
    }
    const sortHand = () => me.sort((a, b) => a.si - b.si || O.indexOf(a.r) - O.indexOf(b.r));

    /* --- combinaciones --- */
    function melds(cards) {
      const out = [];
      // tríos/cuartos
      O.forEach(r => {
        const g = cards.filter(c => c.r === r);
        if (g.length >= 3) { out.push(g.slice(0, 3)); if (g.length >= 4) out.push(g); }
      });
      // escaleras
      [0, 1, 2, 3].forEach(si => {
        const s = cards.filter(c => c.si === si).sort((a, b) => O.indexOf(a.r) - O.indexOf(b.r));
        for (let i = 0; i < s.length; i++) {
          let run = [s[i]];
          for (let j = i + 1; j < s.length; j++) {
            if (O.indexOf(s[j].r) === O.indexOf(run[run.length - 1].r) + 1) { run.push(s[j]); if (run.length >= 3) out.push(run.slice()); }
            else break;
          }
        }
      });
      return out;
    }
    function best(cards) { // devuelve puntos muertos mínimos
      const ms = melds(cards);
      let bestPts = cards.reduce((a, c) => a + V[c.r], 0);
      const rec = (rest, used) => {
        const opts = melds(rest);
        if (!opts.length) { bestPts = Math.min(bestPts, rest.reduce((a, c) => a + V[c.r], 0)); return; }
        opts.forEach(m => rec(rest.filter(c => !m.includes(c)), used.concat([m])));
        bestPts = Math.min(bestPts, rest.reduce((a, c) => a + V[c.r], 0));
      };
      rec(cards, []);
      return bestPts;
    }
    function isChinchon(cards) {
      if (cards.length !== 7) return false;
      const s = cards.slice().sort((a, b) => O.indexOf(a.r) - O.indexOf(b.r));
      return s.every(c => c.si === s[0].si) && s.every((c, i) => i === 0 || O.indexOf(c.r) === O.indexOf(s[i - 1].r) + 1);
    }

    function draw(from) {
      if (turn !== 0 || drawn || over) return;
      const c = from === 'pile' ? pile.pop() : deck.pop();
      if (!c) { say('Mazo agotado, ronda en tablas'); over = true; return render(); }
      me.push(c); drawn = true; sortHand(); Audio2.sfx('card');
      say('Ahora descarta una carta (o cierra si tienes 5 puntos o menos).');
      render();
    }
    function discard(i) {
      if (turn !== 0 || !drawn || over) return;
      pile.push(me.splice(i, 1)[0]); drawn = false; turn = 1; Audio2.sfx('card'); render();
      App.timer(botTurn, 900);
    }
    function close(who) {
      const hand = who === 0 ? me : bot;
      if (who === 0) {
        if (!drawn || me.length !== 8) return App.toast('Cierra después de robar, tirando la carta que sobra');
        // cierra descartando la mejor
        let bi = 0, bp = 999;
        me.forEach((c, i) => { const p = best(me.filter((_, j) => j !== i)); if (p < bp) { bp = p; bi = i; } });
        if (bp > 5 && !isChinchon(me.filter((_, j) => j !== bi))) return App.toast('Necesitas 5 puntos o menos para cerrar (tienes ' + bp + ')');
        pile.push(me.splice(bi, 1)[0]);
      }
      const mine = best(me), his = best(bot);
      const chin = isChinchon(who === 0 ? me : bot);
      over = true;
      score.me += mine; score.bot += his;
      const gano = chin ? who === 0 : (who === 0 ? mine <= his : his <= mine);
      say(`Cierre de ${who === 0 ? 'tu parte' : 'el bot'}${chin ? ' con CHINCHÓN' : ''}: tú ${mine} · bot ${his}. ${gano ? 'Ganas la ronda 🎉' : 'Gana el bot'}`);
      Audio2.sfx(gano ? 'win' : 'bad');
      App.record('chinchon', gano ? 'win' : 'loss');
      render();
    }
    function botTurn() {
      if (over) return;
      const top = pile[pile.length - 1];
      const conPila = best(bot.concat([top]));
      const sinPila = best(bot);
      let c;
      if (top && conPila < sinPila && diff !== 'facil') { c = pile.pop(); }
      else { c = deck.pop(); if (!c) { say('Mazo agotado, ronda en tablas'); over = true; return render(); } }
      bot.push(c);
      let bi = 0, bp = 999;
      bot.forEach((x, i) => { const p = best(bot.filter((_, j) => j !== i)); if (p < bp) { bp = p; bi = i; } });
      if (diff === 'facil') bi = Math.floor(Math.random() * bot.length);
      if (bp <= 5 || isChinchon(bot.filter((_, j) => j !== bi))) { pile.push(bot.splice(bi, 1)[0]); return close(1); }
      pile.push(bot.splice(bi, 1)[0]);
      turn = 0; Audio2.sfx('card'); say('Tu turno: roba del mazo o del descarte.');
      render();
    }
    function render() {
      $('#sm').textContent = score.me; $('#sb').textContent = score.bot;
      $('#rest').textContent = deck.length + ' en el mazo';
      const br = $('#botrow'); br.innerHTML = '';
      bot.forEach(c => br.appendChild(Cards.el(c, { w: 42, faceDown: !over })));
      const ce = $('#centro'); ce.innerHTML = '';
      const mz = Cards.el(null, { w: 68, faceDown: true }); mz.onclick = () => draw('deck'); ce.appendChild(mz);
      const pl = pile.length ? Cards.el(pile[pile.length - 1], { w: 68 }) : document.createElement('div');
      pl.onclick = () => draw('pile'); ce.appendChild(pl);
      const h = $('#mano'); const first = !h.dataset.done; h.innerHTML = '';
      me.forEach((c, i) => {
        const e = Cards.el(c, { w: 56 });
        if (turn === 0 && drawn && !over) { e.onclick = () => discard(i); e.style.cursor = 'pointer'; }
        h.appendChild(e);
      });
      if (first) { h.dataset.done = '1'; Anim.deal([...h.children], 60); }
      $('#dw').textContent = over ? '' : 'Puntos muertos ahora: ' + best(me);
      $('#cerrar').style.opacity = turn === 0 && drawn && !over ? 1 : .45;
    }
    deal();
  }
};
