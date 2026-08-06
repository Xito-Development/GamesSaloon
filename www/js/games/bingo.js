const Bingo = {
  id: 'bingo', name: 'Bingo', hasBot: true,
  mount(root, opts) {
    const diff = opts.diff || 'medio';
    const speed = { facil: 3200, medio: 2200, dificil: 1300 }[diff];
    const botAuto = { facil: .55, medio: .85, dificil: 1 }[diff];
    const bots = (opts.players || 4) - 1;
    let drawn = [], bag = [], mine, boards = [], running = false, tid, over = false;

    root.innerHTML = `
      <div class="board-head">
        <button class="back" id="bk">← Salir</button>
        <div class="hud">Última bola<br><b id="last" style="font-size:22px;color:var(--primary)">—</b></div>
      </div>
      <div class="card" style="margin-top:0"><div id="rivals" style="display:flex;gap:8px;flex-wrap:wrap"></div></div>
      <div class="board-wrap"><div class="felt" style="margin-top:14px"><div id="mycard"></div></div></div>
      <div class="row"><button class="btn" id="go">Empezar</button><button class="btn ghost" id="linebtn">¡Línea!</button></div>
      <div class="row"><button class="btn sec" id="bingobtn">¡BINGO!</button><button class="btn ghost" id="nuevo">Nuevo cartón</button></div>
      <div class="card"><p id="estado" style="margin:0">Pulsa Empezar para que salgan las bolas.</p></div>
      <div class="card"><p style="margin:0 0 6px">Premios: línea, dos líneas y cartón lleno (15 números).</p><p style="margin:0">Bolas cantadas: <span id="hist"></span></p></div>`;

    root.querySelector('#bk').onclick = () => { clearInterval(tid); App.go('hub'); };
    App.onLeave = () => clearInterval(tid);

    function makeBoard() {
      return { grid: BingoCarton.nuevo(), marks: new Set(), lines: 0, bingo: false };
    }
    const lineasDe = b => b.grid.filter(row => row.filter(x => x !== null).every(x => b.marks.has(x))).length;
    function reset() {
      bag = Cards.shuffle(Array.from({ length: 90 }, (_, i) => i + 1));
      drawn = []; mine = makeBoard();
      boards = Array.from({ length: bots }, makeBoard);
      running = false; over = false; renderAll();
    }
    function renderAll() { renderMine(); renderRivals(); root.querySelector('#hist').textContent = drawn.join(' · ') || '—'; }

    function renderMine() {
      const t = root.querySelector('#mycard');
      t.innerHTML = '';
      const g = document.createElement('div');
      g.style.cssText = 'display:grid;grid-template-columns:repeat(9,1fr);gap:4px';
      mine.grid.forEach((row, r) => row.forEach((n, c) => {
        const d = document.createElement('div');
        const has = n !== null, ok = has && mine.marks.has(n);
        d.textContent = has ? n : '';
        d.style.cssText = `aspect-ratio:1;display:grid;place-items:center;border-radius:8px;font-weight:700;font-size:clamp(13px,3.4vw,20px);
          background:${has ? (ok ? 'var(--primary)' : '#fdf6e6') : 'rgba(255,255,255,.06)'};color:${ok ? 'var(--on-primary)' : '#222'};
          transition:transform .35s cubic-bezier(.22,1,.28,1),background .35s var(--ease);${ok ? 'transform:scale(1.08)' : ''}`;
        if (has) d.onclick = () => {
          if (over) return;
          if (drawn.includes(n) && !mine.marks.has(n)) { mine.marks.add(n); Audio2.sfx('chip'); renderMine(); }
        };
        g.appendChild(d);
      }));
      t.appendChild(g);
    }
    function renderRivals() {
      const r = root.querySelector('#rivals');
      r.innerHTML = boards.map((b, i) =>
        `<div style="background:var(--surf2);border-radius:12px;padding:8px 12px;font-size:12px">
          🤖 Bot ${i + 1}<br><b>${b.marks.size}</b>/15 ${b.lines ? '· línea' : ''}</div>`).join('');
    }
    function draw() {
      if (over) return stop();
      if (!bag.length) return stop('Se acabaron las bolas — aún puedes cantar si tienes el cartón lleno');
      const n = bag.pop(); drawn.push(n);
      root.querySelector('#last').textContent = n;
      Audio2.sfx('chip');
      boards.forEach((b, i) => {
        if (b.grid.flat().includes(n) && Math.random() < botAuto) b.marks.add(n);
        const l = lineasDe(b);
        if (l > b.lines) {
          b.lines = l;
          if (l === 1) App.toast(`Bot ${i + 1} canta LÍNEA`);
          if (l === 2) App.toast(`Bot ${i + 1} canta DOS LÍNEAS`);
        }
        if (b.marks.size === 15 && !over) { stop(`Bot ${i + 1} ha cantado BINGO 😖`, true); App.record('bingo', 'loss'); }
      });
      renderAll();
    }
    function stop(msg, fin) {
      running = false; clearInterval(tid);
      if (fin) over = true;
      const go = root.querySelector('#go');
      go.textContent = over ? 'Partida terminada' : 'Empezar';
      go.style.opacity = over ? .45 : 1;
      if (msg) { App.toast(msg); say(msg); }
    }
    const say = t => { const e = root.querySelector('#estado'); if (e) e.textContent = t; };

    root.querySelector('#go').onclick = e => {
      if (over) { App.toast('Pulsa "Nuevo cartón" para jugar otra partida'); return; }
      if (running) { stop(); return; }
      if (!bag.length) reset();
      running = true; e.target.textContent = 'Pausar'; draw();
      tid = setInterval(draw, speed);
    };
    root.querySelector('#linebtn').onclick = () => {
      if (over) return App.toast('La partida ya ha terminado');
      const l = lineasDe(mine);
      if (l > mine.lines) {
        mine.lines = l; Audio2.sfx('win');
        App.toast(l === 1 ? '¡Línea cantada! Vas a por las dos líneas' : '¡Dos líneas! Ahora el cartón lleno');
      } else if (l) App.toast('Ya has cantado esa jugada');
      else { Audio2.sfx('bad'); App.toast('Aún no tienes ninguna línea completa'); }
    };
    root.querySelector('#bingobtn').onclick = () => {
      if (over) return App.toast('La partida ya ha terminado');
      if (mine.marks.size === 15) { Audio2.sfx('win'); stop('¡BINGO! Has ganado 🎉', true); App.record('bingo', 'win'); }
      else { Audio2.sfx('bad'); App.toast('Te faltan ' + (15 - mine.marks.size) + ' números'); }
    };
    root.querySelector('#nuevo').onclick = () => { clearInterval(tid); reset(); say('Cartón nuevo. Pulsa Empezar.'); root.querySelector('#go').textContent = 'Empezar'; root.querySelector('#go').style.opacity = 1; };
    reset();
  }
};
