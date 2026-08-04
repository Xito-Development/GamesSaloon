const CLRS = ['#e63946','#2a9d8f','#e9c46a','#457b9d','#b07ae0'];
/* Sala online: lobby por código + Bingo hasta 6 jugadores */
const Sala = {
  mount(root, { code, game }) {
    let players = [], room = null, poll;
    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud">Código<br><b style="font-size:20px;letter-spacing:3px;color:var(--primary)">${code}</b></div></div>
      <div class="card" style="margin-top:0"><h2>Sala de ${game}</h2>
        <p>Comparte el código para que se unan. Máximo 6 jugadores.</p>
        <div id="pl" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"></div>
        <div class="row"><button class="btn" id="start">Empezar partida</button></div>
        <div class="row"><button class="btn ghost" id="copy">Copiar código</button></div>
      </div>
      <div id="table"></div>
      <div id="torneo"></div>
      <div class="card"><div id="chat" style="min-height:26px;font-size:13px;color:var(--on-dim)">Chat rápido</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px" id="chatbtns">
          ${['👋', '😂', '😮', '🔥', '😭', '🍀', '👏', '🤝'].map(e => `<button class="emo" data-e="${e}" style="font-size:20px;width:42px;height:42px;border-radius:12px;border:1px solid var(--outline);background:var(--surf2)">${e}</button>`).join('')}
        </div></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = async () => { clearInterval(poll); await Net.leave(); App.go('hub'); };
    App.onLeave = () => { clearInterval(poll); Net.leave(); };
    root.querySelectorAll('.emo').forEach(b => b.onclick = () => { Net.send({ type: 'chat', e: b.dataset.e }); Audio2.sfx('tick'); });
    $('#copy').onclick = () => { navigator.clipboard?.writeText(code); App.toast('Código copiado'); };

    const isHost = () => Net.me && Net.me.seat === 1;
    if (!isHost()) { $('#start').textContent = 'Esperando al anfitrión…'; $('#start').disabled = true; $('#start').style.opacity = .5; }

    function drawPlayers() {
      $('#pl').innerHTML = players.map(p => `<div style="background:var(--surf2);border-radius:12px;padding:9px 13px;font-size:13px;
        border-left:5px solid ${CLRS[p.color || 0]}">${p.avatar || '🙂'} ${p.name}${p.is_host ? ' 👑' : ''}${p.id === Net.me.id ? ' (tú)' : ''}</div>`).join('')
        + `<div style="color:var(--on-dim);font-size:12px;align-self:center">${players.length}/6</div>`;
    }
    async function refresh() { players = await Net.players(); drawPlayers(); }

    $('#start').onclick = async () => {
      if (!isHost()) return;
      const g = game.toLowerCase();
      const min = g === 'cinquillo' ? 3 : 2;
      if (g === 'brisca' && players.length !== 2) return App.toast('La brisca online es de 2 jugadores');
      if (g === 'parchis' && players.length > 4) return App.toast('El parchís online es de 2 a 4 jugadores');
      if (players.length < min) return App.toast(`Hacen falta al menos ${min} jugadores`);
      const st = g === 'cinquillo' ? CinquilloOnline.deal(players)
        : g === 'parchis' ? ParchisOnline.deal(players)
        : g === 'brisca' ? BriscaOnline.deal(players)
        : { started: true, game: 'bingo', drawn: [] };
      await Net.setState(st, { status: 'playing' });
    };

    function torneo(r) {
      const box = $('#torneo');
      const st = r.state || {};
      const tally = st.tally || {};
      const nameOf = id => (players.find(p => p.id === id) || {}).name || '—';
      if (!st.over) { if (Object.keys(tally).length) box.innerHTML = marcador(tally, nameOf); return; }
      box.innerHTML = marcador(tally, nameOf) +
        (isHost() ? '<div class="row"><button class="btn" id="otra">Otra ronda</button></div>'
          : '<div class="card"><p style="margin:0">Esperando a que el anfitrión empiece otra ronda…</p></div>');
      const btn = $('#otra');
      if (btn) btn.onclick = async () => {
        const g = st.game;
        const t = { ...tally };
        if (st.over && st.over !== 'empate') t[st.over] = (t[st.over] || 0) + 1;
        const ns = g === 'cinquillo' ? CinquilloOnline.deal(players)
          : g === 'brisca' ? BriscaOnline.deal(players)
            : g === 'parchis' ? ParchisOnline.deal(players) : null;
        if (!ns) return;
        [CinquilloOnline, BriscaOnline, ParchisOnline].forEach(m => { m.started = false; m._done = false; });
        $('#table').innerHTML = '';
        await Net.setState({ ...ns, tally: t }, { status: 'playing' });
      };
    }
    function marcador(tally, nameOf) {
      const rows = Object.entries(tally).sort((a, b) => b[1] - a[1]);
      if (!rows.length) return '';
      return `<div class="card"><h2>Torneo</h2>${rows.map(([id, n]) =>
        `<p style="display:flex;justify-content:space-between;color:var(--on);margin:4px 0"><span>${nameOf(id)}</span><b>${n} ronda${n > 1 ? 's' : ''}</b></p>`).join('')}</div>`;
    }

    Net.subscribe({
      onPlayers: p => { players = p; drawPlayers(); },
      onRoom: r => {
        room = r;
        if (!r.state || !r.state.started) return;
        if (r.state.game === 'cinquillo') CinquilloOnline.run(root, r, players);
        else if (r.state.game === 'brisca') BriscaOnline.run(root, r, players);
        else if (r.state.game === 'parchis') ParchisOnline.run(root, r, players);
        else BingoOnline.run(root, r, isHost());
        torneo(r);
      },
      onMove: m => {
        if (m.payload.type === 'bingo') {
          const who = players.find(p => p.id === m.player_id);
          App.toast(`¡${who ? who.name : 'Alguien'} ha cantado BINGO!`);
          Audio2.sfx(m.player_id === Net.me.id ? 'win' : 'bad');
          App.record('bingo', m.player_id === Net.me.id ? 'win' : 'loss');
          BingoOnline.stop();
        } else if (m.payload.type === 'chat') {
          const who = players.find(p => p.id === m.player_id);
          const box = $('#chat');
          const line = document.createElement('div');
          line.innerHTML = `<span style="font-size:18px">${m.payload.e}</span> ${who ? who.name : ''}`;
          line.style.animation = 'rise .3s var(--ease)';
          if (box.textContent === 'Chat rápido') box.textContent = '';
          box.appendChild(line);
          while (box.children.length > 4) box.removeChild(box.firstChild);
        } else if (m.payload.type === 'linea') {
          const who = players.find(p => p.id === m.player_id);
          App.toast(`${who ? who.name : 'Alguien'} canta línea`);
        }
      }
    });
    refresh();
    poll = setInterval(refresh, 8000);
  }
};

const BingoOnline = {
  board: null, tid: null, started: false,
  stop() { clearInterval(this.tid); this.tid = null; },
  run(root, room, isHost) {
    const t = root.querySelector('#table');
    if (!this.started) {
      this.started = true;
      this.board = this.make();
      root.querySelector('#start').style.display = 'none';
      t.innerHTML = `<div class="felt" style="margin-top:14px">
          <div style="text-align:center;margin-bottom:10px">Última bola <b id="ob" style="font-size:26px;color:var(--primary)">—</b></div>
          <div id="ocard"></div></div>
        <div class="row"><button class="btn ghost" id="ol">¡Línea!</button><button class="btn sec" id="obg">¡BINGO!</button></div>`;
      root.querySelector('#ol').onclick = () => {
        const line = this.board.grid.some(r => r.filter(x => x !== null).every(x => this.board.marks.has(x)));
        line ? Net.send({ type: 'linea' }) : App.toast('Aún no tienes línea');
      };
      root.querySelector('#obg').onclick = () => {
        if (this.board.marks.size === 15) Net.send({ type: 'bingo' });
        else App.toast('Te faltan ' + (15 - this.board.marks.size) + ' números');
      };
      if (isHost) {
        this.tid = setInterval(async () => {
          const r = await Net.roomInfo();
          const drawn = r.state.drawn || [];
          const left = Array.from({ length: 90 }, (_, i) => i + 1).filter(n => !drawn.includes(n));
          if (!left.length) return this.stop();
          drawn.push(left[Math.floor(Math.random() * left.length)]);
          await Net.setState({ ...r.state, drawn });
        }, 2600);
      }
    }
    const drawn = (room.state && room.state.drawn) || [];
    if (drawn.length) { root.querySelector('#ob').textContent = drawn[drawn.length - 1]; Audio2.sfx('chip'); }
    this.render(root, drawn);
  },
  make() {
    const grid = Array.from({ length: 3 }, () => Array(9).fill(null));
    const cols = Array.from({ length: 9 }, (_, c) => Cards.shuffle(
      Array.from({ length: c === 8 ? 11 : 10 }, (_, i) => c * 10 + i + (c === 0 ? 1 : 0))));
    for (let r = 0; r < 3; r++) Cards.shuffle([...Array(9).keys()]).slice(0, 5).forEach(c => grid[r][c] = cols[c].pop());
    return { grid, marks: new Set() };
  },
  render(root, drawn) {
    const t = root.querySelector('#ocard'); if (!t) return;
    t.innerHTML = '';
    const g = document.createElement('div');
    g.style.cssText = 'display:grid;grid-template-columns:repeat(9,1fr);gap:4px';
    this.board.grid.forEach(row => row.forEach(n => {
      const d = document.createElement('div');
      const has = n !== null, ok = has && this.board.marks.has(n);
      d.textContent = has ? n : '';
      d.style.cssText = `aspect-ratio:1;display:grid;place-items:center;border-radius:8px;font-weight:700;font-size:14px;
        background:${has ? (ok ? 'var(--primary)' : '#fdf6e6') : 'rgba(255,255,255,.06)'};color:${ok ? 'var(--on-primary)' : '#222'};transition:.25s var(--ease)`;
      if (has) d.onclick = () => { if (drawn.includes(n)) { this.board.marks.add(n); Audio2.sfx('chip'); this.render(root, drawn); } };
      g.appendChild(d);
    }));
    t.appendChild(g);
  }
};

/* ---- Cinquillo online (3-6 jugadores) ---- */
const CinquilloOnline = {
  started: false, myId: null,
  ORDER: ['1', '2', '3', '4', '5', '6', '7', 'S', 'C', 'R'],

  deal(players) {
    const d = Cards.shuffle(Cards.spanishDeck());
    const hands = {}; players.forEach(p => hands[p.id] = []);
    d.forEach((c, i) => hands[players[i % players.length].id].push(c));
    Object.values(hands).forEach(h => h.sort((a, b) => a.si - b.si || this.ORDER.indexOf(a.r) - this.ORDER.indexOf(b.r)));
    const order = players.map(p => p.id);
    const first = order.findIndex(id => hands[id].some(c => c.r === '5' && c.si === 0));
    return { started: true, game: 'cinquillo', hands, mesa: [[], [], [], []], order, turn: first < 0 ? 0 : first, over: null, last: null };
  },
  playable(c, mesa) {
    const m = mesa[c.si];
    if (!m.length) return c.r === '5';
    const i = this.ORDER.indexOf(c.r);
    return i === this.ORDER.indexOf(m[0].r) - 1 || i === this.ORDER.indexOf(m[m.length - 1].r) + 1;
  },
  run(root, room, players) {
    const st = room.state;
    if (!this.started) {
      this.started = true;
      root.querySelector('#start').style.display = 'none';
      root.querySelector('#table').innerHTML = `
        <div class="card" id="chud" style="font-size:13px;line-height:1.6"></div>
        <div class="felt" style="margin-top:14px"><div id="cmesa" style="display:grid;gap:8px"></div></div>
        <div class="card"><p id="cmsg" style="margin:0"></p></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:12px" id="cmano"></div>
        <div class="row"><button class="btn ghost" id="cpaso">Paso</button></div>`;
      root.querySelector('#cpaso').onclick = () => this.pass(room, players);
    }
    this.render(root, st, players);
  },
  mine(st) { return (st.hands && st.hands[Net.me.id]) || []; },
  isMyTurn(st) { return st.order[st.turn] === Net.me.id; },

  async play(st, i, players) {
    const hand = this.mine(st).slice();
    const c = hand.splice(i, 1)[0];
    const mesa = st.mesa.map(a => a.slice());
    const m = mesa[c.si];
    if (!m.length) m.push(c);
    else if (this.ORDER.indexOf(c.r) < this.ORDER.indexOf(m[0].r)) m.unshift(c); else m.push(c);
    const hands = { ...st.hands, [Net.me.id]: hand };
    const over = hand.length === 0 ? Net.me.id : null;
    Audio2.sfx('card');
    await Net.setState({ ...st, hands, mesa, turn: (st.turn + 1) % st.order.length, over, last: Net.me.id },
      over ? { status: 'finished' } : {});
  },
  async pass(room, players) {
    const st = room.state;
    if (!this.isMyTurn(st)) return;
    if (this.mine(st).some(c => this.playable(c, st.mesa))) return App.toast('Tienes carta jugable');
    await Net.setState({ ...st, turn: (st.turn + 1) % st.order.length, last: null });
  },
  render(root, st, players) {
    const nameOf = id => (players.find(p => p.id === id) || {}).name || '—';
    const me = this.mine(st), mine = this.isMyTurn(st);
    const mz = root.querySelector('#cmesa'); if (!mz) return;
    mz.innerHTML = '';
    st.mesa.forEach((row, si) => {
      const line = document.createElement('div');
      line.style.cssText = 'display:flex;gap:4px;align-items:center;min-height:52px';
      const lab = document.createElement('div');
      lab.style.cssText = 'width:26px;font-size:20px;text-align:center';
      lab.textContent = Cards.ES_SUITS[si].s; line.appendChild(lab);
      if (!row.length) {
        const s = document.createElement('div');
        s.style.cssText = 'height:46px;flex:1;border:2px dashed rgba(255,255,255,.2);border-radius:8px;display:grid;place-items:center;font-size:12px;color:#ffffff88';
        s.textContent = 'empieza el 5'; line.appendChild(s);
      } else row.forEach(c => { const e = Cards.el(c, { w: 32 }); e.style.height = '46px'; line.appendChild(e); });
      mz.appendChild(line);
    });
    const h = root.querySelector('#cmano'); h.innerHTML = '';
    me.forEach((c, i) => {
      const e = Cards.el(c, { w: 46 });
      const ok = mine && !st.over && this.playable(c, st.mesa);
      if (ok) { e.style.boxShadow = '0 0 0 3px var(--primary),0 4px 10px rgba(0,0,0,.5)'; e.onclick = () => this.play(st, i, players); }
      else e.style.opacity = mine ? .55 : 1;
      h.appendChild(e);
    });
    const msg = root.querySelector('#cmsg');
    if (st.over) {
      const win = st.over === Net.me.id;
      msg.textContent = win ? '¡Te has quedado sin cartas y ganas! 🎉' : `Gana ${nameOf(st.over)}`;
      Audio2.sfx(win ? 'win' : 'bad');
      if (!this._done) { this._done = true; App.record('cinquillo', win ? 'win' : 'loss'); }
    } else msg.textContent = mine ? (me.some(c => this.playable(c, st.mesa)) ? 'Tu turno: toca una carta iluminada' : 'No puedes tirar, pulsa Paso') : 'Juega ' + nameOf(st.order[st.turn]);
    root.querySelector('#cpaso').style.opacity = mine && !st.over ? 1 : .45;
    const hud = root.querySelector('#chud');
    if (hud) hud.innerHTML = st.order.map(id => `${st.order[st.turn] === id ? '▶ ' : ''}${nameOf(id)}: ${(st.hands[id] || []).length}`).join('<br>');
  }
};

/* ---- Brisca online (2 jugadores) ---- */
const BriscaOnline = {
  started: false, _done: false,
  PTS: { '1': 11, '3': 10, 'R': 4, 'C': 3, 'S': 2 },
  POW: { '1': 10, '3': 9, 'R': 8, 'C': 7, 'S': 6, '7': 5, '6': 4, '5': 3, '4': 2, '2': 1 },

  deal(players) {
    const d = Cards.shuffle(Cards.spanishDeck());
    const triunfo = d[0];
    const order = players.slice(0, 2).map(p => p.id);
    const hands = {}; const points = {};
    order.forEach(id => { hands[id] = []; points[id] = 0; });
    for (let i = 0; i < 3; i++) order.forEach(id => hands[id].push(d.pop()));
    return { started: true, game: 'brisca', deck: d, triunfo, taken: false, hands, points, mesa: [], order, turn: 0, over: null, msg: 'Empieza la partida' };
  },
  wins(a, b, triunfo) {
    if (b.card.si === a.card.si) return this.POW[b.card.r] > this.POW[a.card.r] ? b : a;
    if (b.card.si === triunfo.si) return b;
    return a;
  },
  run(root, room, players) {
    if (!this.started) {
      this.started = true;
      root.querySelector('#start').style.display = 'none';
      root.querySelector('#table').innerHTML = `
        <div class="card" id="bhud" style="font-size:13px"></div>
        <div class="felt" style="margin-top:14px">
          <div style="display:flex;justify-content:center;gap:16px;min-height:110px;align-items:center" id="bmesa"></div>
        </div>
        <div class="card"><p id="bmsg" style="margin:0"></p></div>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:12px" id="bmano"></div>`;
    }
    this.render(root, room.state, players);
  },
  async play(st, i) {
    const hand = st.hands[Net.me.id].slice();
    const card = hand.splice(i, 1)[0];
    let s = { ...st, hands: { ...st.hands, [Net.me.id]: hand }, mesa: st.mesa.concat([{ id: Net.me.id, card }]) };
    Audio2.sfx('card');
    if (s.mesa.length < 2) {
      s.turn = (st.turn + 1) % 2;
      return Net.setState(s);
    }
    // resolver baza
    const w = this.wins(s.mesa[0], s.mesa[1], s.triunfo);
    const total = s.mesa.reduce((a, m) => a + (this.PTS[m.card.r] || 0), 0);
    const points = { ...s.points, [w.id]: s.points[w.id] + total };
    const deck = s.deck.slice();
    const hands = { ...s.hands };
    let taken = s.taken;
    const orderDraw = [w.id, s.order.find(x => x !== w.id)];
    orderDraw.forEach(id => {
      if (deck.length) hands[id] = hands[id].concat([deck.pop()]);
      else if (!taken) { taken = true; hands[id] = hands[id].concat([s.triunfo]); }
    });
    const fin = Object.values(hands).every(h => h.length === 0);
    s = {
      ...s, deck, hands, points, taken, mesa: [], turn: s.order.indexOf(w.id),
      msg: `Baza para ${w.id === Net.me.id ? 'ti' : 'el rival'} (+${total})`,
      over: fin ? (points[s.order[0]] > points[s.order[1]] ? s.order[0] : points[s.order[1]] > points[s.order[0]] ? s.order[1] : 'empate') : null
    };
    await Net.setState(s, fin ? { status: 'finished' } : {});
  },
  render(root, st, players) {
    const nameOf = id => (players.find(p => p.id === id) || {}).name || 'Rival';
    const rival = st.order.find(x => x !== Net.me.id);
    const mine = st.order[st.turn] === Net.me.id;
    const hud = root.querySelector('#bhud'); if (!hud) return;
    hud.innerHTML = `Tú <b>${st.points[Net.me.id]}</b> · ${nameOf(rival)} <b>${st.points[rival]}</b><br>
      ${st.deck.length} cartas en el mazo · triunfo ${st.triunfo.r}${st.triunfo.s}`;
    const mz = root.querySelector('#bmesa'); mz.innerHTML = '';
    if (st.deck.length && !st.taken) {
      const wrap = document.createElement('div'); wrap.style.cssText = 'position:relative;margin-right:20px';
      const t = Cards.el(st.triunfo, { w: 50 }); t.style.transform = 'rotate(90deg) translateX(15px)'; wrap.appendChild(t);
      const d = Cards.el(null, { w: 50, faceDown: true }); d.style.cssText += 'position:absolute;top:0;left:25px'; wrap.appendChild(d);
      mz.appendChild(wrap);
    }
    st.mesa.forEach(m => { const e = Cards.el(m.card, { w: 62 }); e.style.animation = 'rise .3s var(--ease)'; mz.appendChild(e); });
    const h = root.querySelector('#bmano'); h.innerHTML = '';
    (st.hands[Net.me.id] || []).forEach((c, i) => {
      const e = Cards.el(c, { w: 64 });
      if (mine && !st.over) { e.style.boxShadow = '0 0 0 3px var(--primary),0 4px 10px rgba(0,0,0,.5)'; e.onclick = () => this.play(st, i); }
      else e.style.opacity = .7;
      h.appendChild(e);
    });
    const msg = root.querySelector('#bmsg');
    if (st.over) {
      const win = st.over === Net.me.id;
      msg.textContent = st.over === 'empate' ? 'Empate a 60' : (win ? '¡Ganas la partida! 🎉' : `Gana ${nameOf(rival)}`);
      if (!this._done) { this._done = true; Audio2.sfx(win ? 'win' : 'bad'); App.record('brisca', win ? 'win' : 'loss'); }
    } else msg.textContent = (st.msg ? st.msg + ' · ' : '') + (mine ? 'Tu turno' : 'Juega ' + nameOf(rival));
  }
};

/* ---- Parchís online (2-4 jugadores) ---- */
const ParchisOnline = {
  started: false, _done: false,
  COL: ['#e63946', '#2a9d8f', '#e9c46a', '#457b9d'],
  SAFE: (() => { const s = new Set(); for (let k = 0; k < 4; k++) { s.add(k * 17); s.add((k * 17 + 12) % 68); } return s; })(),

  deal(players) {
    const order = players.slice(0, 4).map(p => p.id);
    const pieces = {}; const seat = {};
    order.forEach((id, i) => { pieces[id] = [-1, -1, -1, -1]; seat[id] = i; });
    return { started: true, game: 'parchis', order, seat, pieces, turn: 0, dice: 0, phase: 'tirar', over: null, msg: 'Empieza la partida' };
  },
  abs(k, adv) { return (k * 17 + adv) % 68; },
  cell(t) { if (t < 17) return [t, 0]; if (t < 34) return [17, t - 17]; if (t < 51) return [17 - (t - 34), 17]; return [0, 17 - (t - 51)]; },
  corr(k, i) { const s = this.cell((k * 17 + 67) % 68), f = (i + 1) / 8; return [s[0] + (8.5 - s[0]) * f, s[1] + (8.5 - s[1]) * f]; },
  pos(k, adv) { if (adv < 68) return this.cell(this.abs(k, adv)); if (adv < 75) return this.corr(k, adv - 68); return [8.5, 8.5]; },
  legal(st, id, d) {
    const out = [];
    (st.pieces[id] || []).forEach((adv, i) => {
      if (adv === -1) { if (d === 5) out.push({ i, to: 0 }); return; }
      if (adv >= 75) return;
      if (adv + d <= 75) out.push({ i, to: adv + d });
    });
    return out;
  },
  run(root, room, players) {
    if (!this.started) {
      this.started = true;
      root.querySelector('#start').style.display = 'none';
      root.querySelector('#table').innerHTML = `
        <div class="card" id="phud" style="font-size:13px"></div>
        <div class="felt" style="padding:8px;margin-top:12px"><div id="pbd" style="position:relative;width:100%;aspect-ratio:1"></div></div>
        <div class="card" style="display:flex;align-items:center;gap:14px">
          <div id="pdado" style="width:58px;height:58px;border-radius:16px;background:#fff;color:#111;display:grid;place-items:center;font-size:28px;font-weight:800;box-shadow:var(--shadow)">–</div>
          <p id="pmsg" style="margin:0;flex:1"></p></div>
        <div class="row"><button class="btn" id="ptirar">Tirar dado</button></div>`;
      root.querySelector('#ptirar').onclick = () => this.roll(this._st);
      window.addEventListener('resize', () => this._root && this.render(this._root, this._st, this._players));
    }
    this._root = root; this._st = room.state; this._players = players;
    this.render(root, room.state, players);
  },
  async roll(st) {
    if (st.order[st.turn] !== Net.me.id || st.phase !== 'tirar' || st.over) return;
    const d = 1 + Math.floor(Math.random() * 6);
    Audio2.sfx('tick');
    const ms = this.legal(st, Net.me.id, d);
    if (!ms.length) return Net.setState({ ...st, dice: d, phase: 'tirar', turn: (st.turn + 1) % st.order.length, msg: 'Sin movimientos, pasa turno' });
    await Net.setState({ ...st, dice: d, phase: 'mover', msg: 'Ha salido un ' + d });
  },
  async move(st, mv) {
    const id = Net.me.id, k = st.seat[id];
    const pieces = JSON.parse(JSON.stringify(st.pieces));
    pieces[id][mv.i] = mv.to;
    let bonus = 0, msg = '';
    if (mv.to === 75) { bonus = 10; msg = 'Ficha en meta (+10)'; Audio2.sfx('win'); }
    else if (mv.to < 68 && !this.SAFE.has(this.abs(k, mv.to))) {
      const sq = this.abs(k, mv.to);
      st.order.forEach(oid => {
        if (oid === id) return;
        pieces[oid].forEach((a, x) => { if (a >= 0 && a < 68 && this.abs(st.seat[oid], a) === sq) { pieces[oid][x] = -1; bonus = 20; msg = 'Has comido ficha (+20)'; Audio2.sfx('chip'); } });
      });
    }
    const gano = pieces[id].every(a => a === 75);
    let s = { ...st, pieces, msg: msg || 'Ficha movida', over: gano ? id : null };
    if (gano) return Net.setState(s, { status: 'finished' });
    if (bonus && this.legal(s, id, bonus).length) s = { ...s, dice: bonus, phase: 'mover', msg: msg + ' — mueve la bonificación' };
    else if (st.dice === 6) s = { ...s, phase: 'tirar', msg: '¡Otro 6! Vuelve a tirar' };
    else s = { ...s, phase: 'tirar', turn: (st.turn + 1) % st.order.length };
    await Net.setState(s);
  },
  render(root, st, players) {
    const nameOf = id => (players.find(p => p.id === id) || {}).name || '—';
    const mine = st.order[st.turn] === Net.me.id && !st.over;
    root.querySelector('#phud').innerHTML = st.order.map((id, i) =>
      `<span style="color:${this.COL[st.seat[id]]}">●</span> ${st.order[st.turn] === id ? '<b>' : ''}${nameOf(id)}${st.order[st.turn] === id ? '</b>' : ''}: ${st.pieces[id].filter(a => a === 75).length}/4 en meta`).join('<br>');
    root.querySelector('#pdado').textContent = st.dice || '–';
    root.querySelector('#pmsg').textContent = st.over
      ? (st.over === Net.me.id ? '¡Has ganado la partida! 🎉' : 'Gana ' + nameOf(st.over))
      : (st.msg || '') + (mine ? (st.phase === 'tirar' ? ' · te toca tirar' : ' · elige ficha') : ' · juega ' + nameOf(st.order[st.turn]));
    if (st.over && !this._done) { this._done = true; Audio2.sfx(st.over === Net.me.id ? 'win' : 'bad'); App.record('parchis', st.over === Net.me.id ? 'win' : 'loss'); }
    root.querySelector('#ptirar').style.opacity = mine && st.phase === 'tirar' ? 1 : .45;

    const bd = root.querySelector('#pbd'); bd.innerHTML = '';
    const size = bd.clientWidth || 320, u = size / 19;
    const put = (x, y, css) => { const d = document.createElement('div'); d.style.cssText = `position:absolute;left:${(x + .5) * u}px;top:${(y + .5) * u}px;width:${u}px;height:${u}px;${css}`; bd.appendChild(d); return d; };
    for (let t = 0; t < 68; t++) {
      const [x, y] = this.cell(t), owner = t % 17 === 0 ? t / 17 : -1;
      put(x, y, `border-radius:4px;background:${owner >= 0 ? this.COL[owner] : this.SAFE.has(t) ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.16)'};border:1px solid rgba(0,0,0,.18)`);
    }
    st.order.forEach(id => { const k = st.seat[id]; for (let i = 0; i < 7; i++) { const [x, y] = this.corr(k, i); put(x, y, `border-radius:4px;background:${this.COL[k]}88`); } });
    put(8.5, 8.5, 'border-radius:50%;background:radial-gradient(circle,#fff8,#0000);display:grid;place-items:center').textContent = '🏁';
    const homes = [[2.5, 2.5], [14.5, 2.5], [14.5, 14.5], [2.5, 14.5]];
    st.order.forEach(id => {
      const k = st.seat[id];
      st.pieces[id].forEach((adv, i) => {
        let x, y;
        if (adv === -1) { x = homes[k][0] + (i % 2) * 1.3; y = homes[k][1] + Math.floor(i / 2) * 1.3; }
        else { const p = this.pos(k, adv); x = p[0] + (i % 2) * .22; y = p[1] + Math.floor(i / 2) * .22; }
        const el = put(x, y, `width:${u * .82}px;height:${u * .82}px;border-radius:50%;background:radial-gradient(circle at 32% 28%,#fff9,${this.COL[k]});
          box-shadow:0 3px 6px rgba(0,0,0,.5);transition:left .35s var(--ease),top .35s var(--ease);z-index:5`);
        if (id === Net.me.id && mine && st.phase === 'mover') {
          const mv = this.legal(st, id, st.dice).find(m => m.i === i);
          if (mv) { el.style.boxShadow = '0 0 0 3px var(--primary),0 3px 6px rgba(0,0,0,.5)'; el.onclick = () => this.move(st, mv); }
        }
      });
    });
  }
};
