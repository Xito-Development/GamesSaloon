const Solitario = {
  id: 'solitario', name: 'Solitario', hasBot: false,
  mount(root, opts) {
    let stock = [], waste = [], found = [[], [], [], []], tab = [[], [], [], [], [], [], []];
    let sel = null, moves = 0, t0 = Date.now(), timer;

    root.innerHTML = `
      <div class="board-head">
        <button class="back" id="bk">← Salir</button>
        <div class="hud"><b id="mv">0</b> movimientos<br><span id="tm">0:00</span></div>
      </div>
      <div class="board-wrap"><div class="felt" id="felt"></div></div>
      <div class="row"><button class="btn ghost" id="nw">Nueva partida</button></div>`;
    root.querySelector('#bk').onclick = () => { clearInterval(timer); App.go('hub'); };
    root.querySelector('#nw').onclick = () => deal();
    const felt = root.querySelector('#felt');
    timer = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      root.querySelector('#tm').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }, 1000);
    App.onLeave = () => clearInterval(timer);

    function deal() {
      const d = Cards.shuffle(Cards.frenchDeck());
      found = [[], [], [], []]; tab = [[], [], [], [], [], [], []]; waste = []; sel = null; moves = 0; t0 = Date.now();
      for (let i = 0; i < 7; i++) for (let j = 0; j <= i; j++) { const c = d.pop(); c.up = (j === i); tab[i].push(c); }
      stock = d.map(c => (c.up = false, c));
      render();
    }
    const val = c => c.ri + 1;
    const canTab = (c, pile) => pile.length ? (pile[pile.length - 1].red !== c.red && val(pile[pile.length - 1]) === val(c) + 1) : c.ri === 12;
    const canFound = (c, f) => f.length ? (f[0].si === c.si && val(f[f.length - 1]) === val(c) - 1) : c.ri === 0;

    function render() {
      const avail = (felt.clientWidth || 320) - 16;
      const gap = 6;
      const w = Math.max(30, Math.min(78, Math.floor((avail - gap * 6) / 7)));
      const h = Math.round(w * 1.45);
      const overlapUp = Math.round(h * 0.36), overlapDown = Math.round(h * 0.16);
      felt.innerHTML = '';
      const top = document.createElement('div');
      top.style.cssText = `display:flex;gap:${gap}px;margin-bottom:14px;align-items:flex-start;flex-wrap:nowrap`;
      // stock
      const st = document.createElement('div'); st.style.cssText = `display:flex;gap:${gap}px`;
      const sc = stock.length ? Cards.el(null, { w, faceDown: true }) : slot(w);
      sc.onclick = () => { Audio2.sfx('card'); if (stock.length) { const c = stock.pop(); c.up = 1; waste.push(c); } else { stock = waste.reverse().map(c => (c.up = 0, c)); waste = []; } sel = null; render(); };
      st.appendChild(sc);
      const wc = waste.length ? Cards.el(waste[waste.length - 1], { w }) : slot(w);
      if (waste.length) wc.onclick = () => pick({ from: 'w' }, waste[waste.length - 1], wc);
      if (sel && sel.from === 'w') wc.classList.add('sel');
      st.appendChild(wc);
      top.appendChild(st);
      const sp = document.createElement('div'); sp.style.cssText = 'flex:1;min-width:4px'; top.appendChild(sp);
      // foundations
      found.forEach((f, i) => {
        const e = f.length ? Cards.el(f[f.length - 1], { w }) : slot(w);
        e.onclick = () => drop({ t: 'f', i });
        top.appendChild(e);
      });
      felt.appendChild(top);
      // tableau
      const cols = document.createElement('div'); cols.style.cssText = `display:flex;gap:${gap}px;justify-content:center;align-items:flex-start`;
      tab.forEach((p, i) => {
        const col = document.createElement('div');
        const colH = h + p.reduce((a, c, j) => a + (j ? (p[j - 1].up ? overlapUp : overlapDown) : 0), 0);
        col.style.cssText = `position:relative;width:${w}px;height:${Math.max(h, colH)}px`;
        if (!p.length) { const s = slot(w); s.onclick = () => drop({ t: 't', i }); col.appendChild(s); }
        p.forEach((c, j) => {
          const e = Cards.el(c, { w, faceDown: !c.up });
          e.style.cssText += 'position:absolute;left:0';
          e.style.top = p.slice(0, j).reduce((a, x) => a + (x.up ? overlapUp : overlapDown), 0) + 'px';
          if (sel && sel.from === 't' && sel.i === i && sel.j <= j) e.classList.add('sel');
          e.onclick = () => {
            if (!c.up) { if (j === p.length - 1) { c.up = 1; Audio2.sfx('card'); render(); } return; }
            if (sel) { drop({ t: 't', i }); } else pick({ from: 't', i, j }, c, e);
          };
          col.appendChild(e);
        });
        cols.appendChild(col);
      });
      felt.appendChild(cols);
      root.querySelector('#mv').textContent = moves;
      if (found.every(f => f.length === 13)) { Audio2.sfx('win'); App.toast('¡Solitario resuelto en ' + moves + ' movimientos!'); App.record('solitario', 'win'); }
    }
    function slot(w) {
      const d = document.createElement('div');
      d.style.cssText = `width:${w}px;height:${Math.round(w * 1.45)}px;border:2px dashed rgba(255,255,255,.22);border-radius:8px;flex:0 0 auto`;
      return d;
    }
    function pick(s, c, e) { sel = s; Audio2.sfx('tick'); render(); }
    function drop(dst) {
      if (!sel) return;
      const moving = sel.from === 'w' ? [waste[waste.length - 1]] : tab[sel.i].slice(sel.j);
      const head = moving[0];
      let ok = false;
      if (dst.t === 'f' && moving.length === 1 && canFound(head, found[dst.i])) { found[dst.i].push(head); ok = true; }
      else if (dst.t === 't' && canTab(head, tab[dst.i])) { tab[dst.i].push(...moving); ok = true; }
      if (ok) {
        if (sel.from === 'w') waste.pop(); else tab[sel.i].length = sel.j;
        if (sel.from === 't' && tab[sel.i].length) tab[sel.i][tab[sel.i].length - 1].up = 1;
        moves++; Audio2.sfx('card');
      } else Audio2.sfx('bad');
      sel = null; render();
    }
    deal();
    const onResize = () => { if (root.isConnected) render(); };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    const prevLeave = App.onLeave;
    App.onLeave = () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (prevLeave) prevLeave();
    };
  }
};
