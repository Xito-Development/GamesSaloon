/* Cinquillo — baraja española, 2 a 6 jugadores. Modo bots y modo online. */
const Cinquillo = {
  id: 'cinquillo', name: 'Cinquillo', hasBot: true,
  ORDER: ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'],

  mount(root, opts) {
    const NP = opts.players || 4, diff = opts.diff || 'medio';
    const online = !!opts.online;
    const NAMES = online ? opts.names : ['Tú', ...Array.from({ length: NP - 1 }, (_, i) => 'Bot ' + (i + 1))];
    const ORDER = this.ORDER;
    let hands = [], mesa = [[], [], [], []], turn = 0, pass = [], over = false;

    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud" id="hud"></div></div>
      <div class="board-wrap"><div class="felt"><div id="mesa" style="display:grid;gap:8px"></div></div></div>
      <div class="card"><p id="msg" style="margin:0"></p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px" id="mano"></div>
      <div class="row"><button class="btn ghost" id="paso">Paso</button><button class="btn" id="nw">Nueva partida</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = () => { if (!online) start(); };
    if (online) $('#nw').style.display = 'none';
    $('#paso').onclick = () => tryPass(0);
    const say = t => $('#msg').textContent = t;

    function start() {
      const d = Cards.shuffle(Cards.spanishDeck());
      hands = Array.from({ length: NP }, () => []);
      d.forEach((c, i) => hands[i % NP].push(c));
      hands.forEach(h => h.sort((a, b) => a.si - b.si || a.ri - b.ri));
      mesa = [[], [], [], []]; pass = Array(NP).fill(0); over = false;
      turn = hands.findIndex(h => h.some(c => c.r === '5' && c.si === 0));
      if (turn < 0) turn = 0;
      say(NAMES[turn] + ' empieza con el cinco de oros.');
      render();
      if (turn !== 0) App.timer(botTurn, 800);
    }
    function playable(c) {
      const m = mesa[c.si];
      if (!m.length) return c.r === '5';
      const idx = ORDER.indexOf(c.r);
      const lo = ORDER.indexOf(m[0].r), hi = ORDER.indexOf(m[m.length - 1].r);
      return idx === lo - 1 || idx === hi + 1;
    }
    function place(c) {
      const m = mesa[c.si];
      if (!m.length) m.push(c);
      else if (ORDER.indexOf(c.r) < ORDER.indexOf(m[0].r)) m.unshift(c); else m.push(c);
    }
    function play(p, i) {
      const c = hands[p].splice(i, 1)[0];
      place(c); Audio2.sfx('card');
      if (!hands[p].length) { over = true; render(); say('¡' + NAMES[p] + ' se queda sin cartas y gana!'); Audio2.sfx(p === 0 ? 'win' : 'bad'); App.record('cinquillo', p === 0 ? 'win' : 'loss'); return; }
      next();
    }
    function tryPass(p) {
      if (turn !== p || over) return;
      if (hands[p].some(playable)) { Audio2.sfx('bad'); return App.toast('Tienes carta jugable, hay que tirar'); }
      say(NAMES[p] + ' pasa.'); next();
    }
    function next() { turn = (turn + 1) % NP; render(); if (!over && turn !== 0) App.timer(botTurn, 700); else if (!over) hint(); }
    function hint() {
      const can = hands[0].filter(playable);
      say(can.length ? 'Tu turno: toca una carta iluminada.' : 'No puedes tirar, pulsa Paso.');
    }
    function botTurn() {
      if (over) return;
      const opts = hands[turn].map((c, i) => ({ c, i })).filter(o => playable(o.c));
      if (!opts.length) { say(NAMES[turn] + ' pasa.'); return next(); }
      let pick;
      if (diff === 'facil') pick = opts[Math.floor(Math.random() * opts.length)];
      else {
        // guarda extremos (1 y R) y suelta las cercanas al 5
        pick = opts.sort((a, b) => Math.abs(ORDER.indexOf(a.c.r) - 4) - Math.abs(ORDER.indexOf(b.c.r) - 4))[0];
        if (diff === 'medio' && Math.random() < .35) pick = opts[Math.floor(Math.random() * opts.length)];
      }
      say(NAMES[turn] + ' juega ' + pick.c.r + pick.c.s);
      play(turn, pick.i);
    }
    function render() {
      $('#hud').innerHTML = NAMES.map((n, i) => `${i === turn ? '▶ ' : ''}${n}: ${hands[i] ? hands[i].length : 0}`).join('<br>');
      const m = $('#mesa'); m.innerHTML = '';
      mesa.forEach((row, si) => {
        const line = document.createElement('div');
        line.style.cssText = 'display:flex;gap:4px;align-items:center;min-height:52px';
        const lab = document.createElement('div');
        lab.style.cssText = 'width:26px;font-size:20px;text-align:center';
        lab.textContent = Cards.ES_SUITS[si].s;
        line.appendChild(lab);
        if (!row.length) {
          const s = document.createElement('div');
          s.style.cssText = 'height:46px;flex:1;border:2px dashed rgba(255,255,255,.2);border-radius:8px;display:grid;place-items:center;font-size:12px;color:#ffffff88';
          s.textContent = 'empieza el 5'; line.appendChild(s);
        } else row.forEach((c, k) => { const e = Cards.el(c, { w: 38 }); e.style.height = '54px'; if (k === row.length - 1 || k === 0) e.classList.add('pop-in'); line.appendChild(e); });
        m.appendChild(line);
      });
      const h = $('#mano'); const first = !h.dataset.done; h.innerHTML = '';
      (hands[0] || []).forEach((c, i) => {
        const e = Cards.el(c, { w: 54 });
        const ok = turn === 0 && !over && playable(c);
        if (ok) { e.style.boxShadow = '0 0 0 3px var(--primary),0 4px 10px rgba(0,0,0,.5)'; e.onclick = () => play(0, i); }
        else e.style.opacity = turn === 0 ? .55 : 1;
        h.appendChild(e);
      });
      if (first) { h.dataset.done = '1'; Anim.deal([...h.children], 22); }
      $('#paso').style.opacity = turn === 0 && !over ? 1 : .45;
    }
    start();
  }
};
