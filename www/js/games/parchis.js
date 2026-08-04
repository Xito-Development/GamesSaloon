const Parchis = {
  id: 'parchis', name: 'Parchís', hasBot: true,
  mount(root, opts) {
    const diff = opts.diff || 'medio';
    const NP = opts.players || 4;
    const COL = ['#e63946', '#2a9d8f', '#e9c46a', '#457b9d'];
    const NAME = ['Tú', 'Bot verde', 'Bot amarillo', 'Bot azul'];
    const SAFE = new Set(); for (let k = 0; k < 4; k++) { SAFE.add(k * 17); SAFE.add((k * 17 + 12) % 68); }
    let P, turn, dice, sixes, phase, msg;

    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud" id="hud">Tu turno</div></div>
      <div class="board-wrap"><div class="felt" style="padding:8px"><div id="bd" style="position:relative;width:100%;aspect-ratio:1"></div></div></div>
      <div class="card" style="display:flex;align-items:center;gap:14px">
        <div id="dado" style="width:62px;height:62px;border-radius:16px;background:#fff;color:#111;display:grid;place-items:center;
          font-size:30px;font-weight:800;box-shadow:var(--shadow);transition:transform .3s var(--ease)">–</div>
        <div style="flex:1"><p id="msg" style="margin:0">Tira el dado. Necesitas un 5 para sacar ficha.</p></div>
      </div>
      <div class="row"><button class="btn" id="tirar">Tirar dado</button><button class="btn ghost" id="nw">Nueva</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = init;
    $('#tirar').onclick = () => { if (turn === 0 && phase === 'tirar') roll(); };

    function init() {
      P = Array.from({ length: NP }, (_, k) => ({ k, pieces: [-1, -1, -1, -1] })); // -1 casa, 0..67 track adv, 68..74 pasillo, 75 meta
      turn = 0; dice = 0; sixes = 0; phase = 'tirar'; say('Tira el dado. Con un 5 sacas ficha de casa.');
      render();
    }
    const say = t => $('#msg').textContent = t;
    const abs = (k, adv) => (k * 17 + adv) % 68;

    function cell(t) { // coords 0..17
      if (t < 17) return [t, 0];
      if (t < 34) return [17, t - 17];
      if (t < 51) return [17 - (t - 34), 17];
      return [0, 17 - (t - 51)];
    }
    function corr(k, i) { // pasillo diagonal hacia el centro
      const start = cell((k * 17 + 67) % 68);
      const c = [8.5, 8.5];
      const f = (i + 1) / 8;
      return [start[0] + (c[0] - start[0]) * f, start[1] + (c[1] - start[1]) * f];
    }
    function pos(k, adv) {
      if (adv < 68) return cell(abs(k, adv));
      if (adv < 75) return corr(k, adv - 68);
      return [8.5, 8.5];
    }
    function legal(k, d) {
      const out = [];
      P[k].pieces.forEach((adv, i) => {
        if (adv === -1) { if (d === 5) out.push({ i, to: 0 }); return; }
        if (adv >= 75) return;
        const to = adv + d;
        if (to > 75) return;
        out.push({ i, to });
      });
      return out;
    }
    function move(k, mv) {
      P[k].pieces[mv.i] = mv.to;
      let bonus = 0;
      if (mv.to === 75) { bonus = 10; App.toast(NAME[k] + ' mete ficha (+10)'); Audio2.sfx('win'); }
      else if (mv.to < 68) {
        const sq = abs(k, mv.to);
        if (!SAFE.has(sq)) {
          P.forEach((p, j) => { if (j === k) return; p.pieces.forEach((a, x) => { if (a >= 0 && a < 68 && abs(j, a) === sq) { p.pieces[x] = -1; bonus = 20; App.toast(NAME[k] + ' come ficha de ' + NAME[j] + ' (+20)'); Audio2.sfx('chip'); } }); });
        }
      }
      render();
      if (P[k].pieces.every(a => a === 75)) { finish(k); return; }
      if (bonus) { const b = legal(k, bonus); if (b.length) { App.timer(() => { if (k === 0) { dice = bonus; phase = 'mover'; say('Bonificación de ' + bonus + ': elige ficha'); render(); } else { move(k, pickBot(k, b)); App.timer(next, 500); } }, 500); return; } }
      if (dice === 6 && k === turn) { phase = 'tirar'; if (k === 0) { say('¡Otro 6! Vuelve a tirar'); } else App.timer(() => roll(), 600); return; }
      next();
    }
    function finish(k) {
      phase = 'fin'; say(k === 0 ? '¡Has ganado la partida! 🎉' : NAME[k] + ' ha ganado');
      Audio2.sfx(k === 0 ? 'win' : 'bad'); App.record('parchis', k === 0 ? 'win' : 'loss');
    }
    function next() {
      if (phase === 'fin') return;
      turn = (turn + 1) % NP; phase = 'tirar'; sixes = 0;
      $('#hud').textContent = turn === 0 ? 'Tu turno' : NAME[turn] + ' juega';
      render();
      if (turn !== 0) App.timer(roll, 700);
    }
    function roll() {
      dice = 1 + Math.floor(Math.random() * 6);
      const d = $('#dado'); d.style.transform = 'rotate(360deg) scale(1.15)';
      App.timer(() => { d.style.transform = ''; }, 320);
      d.textContent = dice; Audio2.sfx('tick');
      const ms = legal(turn, dice);
      if (!ms.length) { say(turn === 0 ? 'Sin movimientos posibles' : NAME[turn] + ' no puede mover'); App.timer(next, 800); return; }
      if (turn === 0) { phase = 'mover'; say('Has sacado ' + dice + '. Toca la ficha que quieras mover.'); render(); }
      else { App.timer(() => move(turn, pickBot(turn, ms)), 600); }
    }
    function pickBot(k, ms) {
      const score = mv => {
        let s = mv.to;
        if (mv.to === 75) s += 300;
        if (mv.to < 68) {
          const sq = abs(k, mv.to);
          const come = P.some((p, j) => j !== k && p.pieces.some((a, x) => a >= 0 && a < 68 && abs(j, a) === sq));
          if (come && !SAFE.has(sq)) s += 250;
          if (SAFE.has(sq)) s += 30;
        }
        if (P[k].pieces[mv.i] === -1) s += 120;
        return s;
      };
      const sorted = ms.slice().sort((a, b) => score(b) - score(a));
      if (diff === 'facil') return ms[Math.floor(Math.random() * ms.length)];
      if (diff === 'medio' && Math.random() < .3) return ms[Math.floor(Math.random() * ms.length)];
      return sorted[0];
    }
    function render() {
      const bd = $('#bd'); bd.innerHTML = '';
      const size = bd.clientWidth || 320, u = size / 19;
      const put = (x, y, style) => { const d = document.createElement('div'); d.style.cssText = `position:absolute;left:${(x + .5) * u}px;top:${(y + .5) * u}px;width:${u}px;height:${u}px;${style}`; bd.appendChild(d); return d; };
      for (let t = 0; t < 68; t++) {
        const [x, y] = cell(t);
        const owner = t % 17 === 0 ? t / 17 : -1;
        put(x, y, `border-radius:4px;background:${owner >= 0 ? COL[owner] : SAFE.has(t) ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.16)'};border:1px solid rgba(0,0,0,.18)`);
      }
      for (let k = 0; k < NP; k++) for (let i = 0; i < 7; i++) {
        const [x, y] = corr(k, i);
        put(x, y, `border-radius:4px;background:${COL[k]}88;border:1px solid rgba(0,0,0,.2)`);
      }
      put(8.5, 8.5, 'border-radius:50%;background:radial-gradient(circle,#fff8,#0000);display:grid;place-items:center').textContent = '🏁';
      // casas
      for (let k = 0; k < NP; k++) {
        const home = [[2.5, 2.5], [14.5, 2.5], [14.5, 14.5], [2.5, 14.5]][k];
        P[k].pieces.forEach((adv, i) => {
          let x, y;
          if (adv === -1) { x = home[0] + (i % 2) * 1.3; y = home[1] + Math.floor(i / 2) * 1.3; }
          else {[x, y] = pos(k, adv); x += (i % 2) * .22; y += Math.floor(i / 2) * .22; }
          const p = put(x, y, `width:${u * .82}px;height:${u * .82}px;border-radius:50%;background:radial-gradient(circle at 32% 28%,#fff9,${COL[k]});
            box-shadow:0 3px 6px rgba(0,0,0,.5);border:1px solid rgba(0,0,0,.3);transition:left .5s cubic-bezier(.22,1,.28,1),top .5s cubic-bezier(.22,1,.28,1);z-index:5`);
          if (k === 0 && turn === 0 && phase === 'mover') {
            const mv = legal(0, dice).find(m => m.i === i);
            if (mv) { p.style.boxShadow = '0 0 0 3px var(--primary),0 3px 6px rgba(0,0,0,.5)'; p.onclick = () => { Audio2.sfx('chip'); move(0, mv); }; }
          }
        });
      }
      $('#tirar').style.opacity = (turn === 0 && phase === 'tirar') ? 1 : .45;
    }
    init();
    window.addEventListener('resize', render);
    App.timer(render, 60);
  }
};
