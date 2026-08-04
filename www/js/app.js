const GAMES = [
  { id: 'ajedrez', name: 'Ajedrez', mod: () => Ajedrez, bot: true, badge: null, color: '#f0d9b5', art: 'chess', tag: 'Clásico' },
  { id: 'bingo', name: 'Bingo', mod: () => Bingo, bot: true, online: true, badge: { t: '¡LO MÁS POPULAR!', c: 'pop' }, color: '#ffd166', art: 'bingo', tag: 'Fiesta' },
  { id: 'brisca', name: 'Brisca', mod: () => Brisca, bot: true, badge: { t: '¡NUEVO!' }, color: '#ffb4a2', art: 'brisca', tag: 'Baraja española' },
  { id: 'solitario', name: 'Solitario', mod: () => Solitario, bot: false, badge: null, color: '#9ae6b4', art: 'solit', tag: 'En solitario' },
  { id: 'parchis', name: 'Parchís', mod: () => Parchis, bot: true, badge: { t: '¡NUEVO!' }, color: '#90cdf4', art: 'parchis', tag: 'Hasta 4' },
  { id: 'cinquillo', name: 'Cinquillo', mod: () => Cinquillo, bot: true, badge: { t: '¡NUEVO!' }, color: '#d6bcfa', art: 'cinq', tag: 'Hasta 6' },
  { id: 'chinchon', name: 'Chinchón', mod: () => Chinchon, bot: true, color: '#fbb6ce', art: 'chin', tag: 'Baraja española' },
  { id: 'damas', name: 'Damas', mod: () => Damas, bot: true, badge: { t: '¡NUEVO!' }, color: '#e2c39a', art: 'damas', tag: 'Clásico' }
];

const ART = {
  chess: `
    <div style="position:absolute;inset:0;background:linear-gradient(160deg,#8b5a3c,#5a3520)"></div>
    <div style="position:absolute;left:-12%;right:-12%;top:26%;bottom:-14%;transform:rotate(-9deg);
      background:repeating-conic-gradient(#f0d9b5 0 25%,#b58863 0 50%) 0 0/34px 34px;
      box-shadow:0 -8px 22px rgba(0,0,0,.45) inset,0 8px 20px rgba(0,0,0,.4)"></div>
    <div style="position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;gap:2px;padding-bottom:16%">
      <span style="font-size:44px;color:#141414;text-shadow:0 6px 8px rgba(0,0,0,.45),0 1px 0 #555;transform:translateY(4px)">♞</span>
      <span style="font-size:56px;color:#fdfaf4;text-shadow:0 7px 10px rgba(0,0,0,.5),0 1px 0 #b9ab90">♛</span>
      <span style="font-size:40px;color:#141414;text-shadow:0 5px 8px rgba(0,0,0,.45)">♜</span>
    </div>
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,rgba(255,240,200,.22),transparent 60%)"></div>`,

  bingo: `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 15%,#25507a,#0b1626 70%)"></div>
    <div style="position:absolute;inset:0;display:flex;flex-wrap:wrap;gap:9px;align-content:center;justify-content:center;padding:20px 12px">
      ${[['7', '#e63946'], ['23', '#2a9d8f'], ['45', '#e9c46a'], ['61', '#4895ef'], ['88', '#f4a261'], ['12', '#b07ae0']].map(([n, c], i) => `
      <div style="width:46px;height:46px;border-radius:50%;position:relative;
        background:radial-gradient(circle at 34% 26%,#ffffff,${c} 58%,#00000055 130%);
        box-shadow:0 6px 12px rgba(0,0,0,.55),inset 0 -6px 10px rgba(0,0,0,.35);transform:rotate(${(i % 3 - 1) * 7}deg)">
        <div style="position:absolute;inset:24%;border-radius:50%;background:#fffdf6;display:grid;place-items:center;
          color:#1b1b1b;font-weight:800;font-size:15px;box-shadow:inset 0 2px 4px rgba(0,0,0,.25)">${n}</div>
        <div style="position:absolute;left:22%;top:12%;width:26%;height:16%;border-radius:50%;background:rgba(255,255,255,.75);filter:blur(1px)"></div>
      </div>`).join('')}
    </div>`,

  brisca: `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 55%,#1f7a5a,#08251c 75%)"></div>
    <div style="position:absolute;inset:0;display:grid;place-items:center">
      ${[['🌰', -26, '#c9a227'], ['🍺', -9, '#b8452f'], ['⚔️', 9, '#4a6fa5'], ['🏑', 26, '#6b8e23']].map(([g, r, c], i) => `
      <div style="position:absolute;width:52px;height:76px;border-radius:7px;
        background:linear-gradient(155deg,#fffdf5 0%,#f3e8d0 55%,#e2d4b6 100%);
        border:1px solid #b9a880;box-shadow:0 ${6 + i}px 14px rgba(0,0,0,.55);
        transform:rotate(${r}deg) translate(${r * 1.6}px,${Math.abs(r) / 3}px);
        display:flex;flex-direction:column;justify-content:space-between;padding:4px">
        <div style="font-size:10px;font-weight:800;color:${c}">${[1, 3, 12, 10][i]}</div>
        <div style="text-align:center;font-size:22px">${g}</div>
        <div style="font-size:10px;font-weight:800;color:${c};transform:rotate(180deg)">${[1, 3, 12, 10][i]}</div>
      </div>`).join('')}
    </div>
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 90%,rgba(0,0,0,.5),transparent 55%)"></div>`,

  solit: `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 35%,#1a6b3f,#062615 75%)"></div>
    <div style="position:absolute;inset:0">
      ${[['K', '♠', '#151515'], ['Q', '♥', '#c62828'], ['J', '♦', '#c62828']].map((x, i) => `
      <div style="position:absolute;left:${26 + i * 16}px;top:${34 + i * 24}px;width:54px;height:78px;border-radius:7px;
        background:linear-gradient(155deg,#fff,#efe7d8);border:1px solid #c3b79c;box-shadow:0 7px 16px rgba(0,0,0,.55);
        display:flex;flex-direction:column;justify-content:space-between;padding:5px;color:${x[2]};font-weight:800">
        <div style="font-size:12px">${x[0]}${x[1]}</div>
        <div style="text-align:center;font-size:26px">${x[1]}</div>
      </div>`).join('')}
    </div>`,

  parchis: `
    <div style="position:absolute;inset:0;background:linear-gradient(160deg,#fffaf0,#e8dcc4)"></div>
    <div style="position:absolute;inset:12px;border-radius:10px;overflow:hidden;box-shadow:0 6px 16px rgba(0,0,0,.28) inset;
      display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr">
      ${['#e63946', '#2a9d8f', '#457b9d', '#e9c46a'].map(c => `<div style="background:linear-gradient(150deg,${c},${c}bb)"></div>`).join('')}
    </div>
    <div style="position:absolute;inset:0;display:grid;place-items:center">
      <div style="width:46px;height:46px;border-radius:10px;background:linear-gradient(150deg,#fff,#ddd);
        box-shadow:0 8px 16px rgba(0,0,0,.45);display:grid;grid-template-columns:repeat(3,1fr);gap:3px;padding:7px;transform:rotate(-12deg)">
        ${[1, 0, 1, 0, 1, 0, 1, 0, 1].map(v => `<div style="border-radius:50%;background:${v ? '#1b1b1b' : 'transparent'}"></div>`).join('')}
      </div>
    </div>`,

  cinq: `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,#4b2a72,#180a2e 75%)"></div>
    <div style="position:absolute;inset:0;display:grid;place-items:center">
      <div style="width:64px;height:92px;border-radius:8px;background:linear-gradient(155deg,#fffdf5,#eadfc4);
        border:1px solid #b9a880;box-shadow:0 10px 20px rgba(0,0,0,.6);display:grid;place-items:center;transform:rotate(-6deg)">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;place-items:center">
          ${[0, 1, 2, 3].map(() => '<div style="font-size:15px">🌰</div>').join('')}
        </div>
      </div>
    </div>
    <div style="position:absolute;left:16px;bottom:14px;font-size:34px;color:#fff;text-shadow:0 4px 10px #000">5</div>`,

  chin: `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 40% 40%,#7a2f52,#25091a 75%)"></div>
    <div style="position:absolute;inset:0;display:grid;place-items:center">
      ${[0, 1, 2].map(i => `<div style="position:absolute;width:48px;height:70px;border-radius:7px;
        background:linear-gradient(155deg,#fffdf5,#ecdfc6);border:1px solid #b9a880;box-shadow:0 6px 14px rgba(0,0,0,.55);
        transform:translate(${(i - 1) * 26}px,${Math.abs(i - 1) * 8}px) rotate(${(i - 1) * 12}deg);
        display:grid;place-items:center;font-size:20px;font-weight:800;color:#8a1c3b">${['S', 'C', 'R'][i]}</div>`).join('')}
    </div>`,

  damas: `
    <div style="position:absolute;inset:0;background:repeating-conic-gradient(#7b4a2d 0 25%,#e8c9a0 0 50%) 0 0/38px 38px"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.28),transparent 40%)"></div>
    <div style="position:absolute;inset:0;display:grid;place-items:center">
      <div style="position:absolute;transform:translate(-26px,10px);width:46px;height:46px;border-radius:50%;
        background:radial-gradient(circle at 32% 26%,#fff,#c9c0ae);box-shadow:0 6px 12px rgba(0,0,0,.55)"></div>
      <div style="position:absolute;transform:translate(20px,-12px);width:46px;height:46px;border-radius:50%;
        background:radial-gradient(circle at 32% 26%,#6a6a6a,#141414);box-shadow:0 6px 12px rgba(0,0,0,.6);
        display:grid;place-items:center;color:#f0b429;font-size:18px">★</div>
    </div>`
};

const App = {
  onLeave: null,
  state: JSON.parse(localStorage.getItem('gamessaloon') || '{"name":"","theme":"dark","music":true,"stats":{},"points":0}'),
  save() { localStorage.setItem('gamessaloon', JSON.stringify(this.state)); },

  init() {
    document.body.dataset.theme = this.state.theme;
    setTimeout(() => document.getElementById('splash').classList.add('gone'), 1600);
    const $ = s => document.querySelector(s);
    $('#menuBtn').onclick = () => this.drawer(true);
    $('#scrim').onclick = () => this.drawer(false);
    $('#themeBtn').onclick = () => {
      this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
      document.body.dataset.theme = this.state.theme; this.save(); Audio2.sfx('tick');
    };
    $('#musicBtn').onclick = e => {
      const on = Audio2.toggle();
      e.currentTarget.classList.toggle('on', Audio2.playing);
      this.state.music = Audio2.playing; this.save();
    };
    document.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => { this.drawer(false); this.go(b.dataset.nav); });
    document.body.addEventListener('click', function once() {
      if (App.state.music !== false) { Audio2.start(); $('#musicBtn').classList.add('on'); }
      document.body.removeEventListener('click', once);
    }, { once: true });
    this.go('hub');
    this.refreshDrawer();
  },
  drawer(o) { document.getElementById('drawer').classList.toggle('open', o); document.getElementById('scrim').classList.toggle('open', o); },
  refreshDrawer() {
    const n = this.state.name || 'Invitado';
    document.getElementById('drawerName').textContent = n;
    document.getElementById('avatarInit').textContent = n[0].toUpperCase();
    const total = Object.values(this.state.stats).reduce((a, s) => a + s.w + s.l, 0);
    document.getElementById('drawerStats').textContent = total + ' partidas · ' + this.level().name;
  },
  toast(t) {
    const el = document.getElementById('toast');
    el.textContent = t; el.classList.add('show');
    clearTimeout(this._tt); this._tt = setTimeout(() => el.classList.remove('show'), 2600);
  },
  record(game, res) {
    const s = this.state.stats[game] || { w: 0, l: 0 };
    res === 'win' ? s.w++ : s.l++;
    this.state.stats[game] = s;
    const gain = res === 'win' ? 10 : 2;
    this.state.points = (this.state.points || 0) + gain;
    if (this.state.name) Net.addPoints(this.state.name, gain, this.state.avatar, this.state.color);
    this.save(); this.refreshDrawer();
    const lv = this.level();
    if (lv.n !== this._lv) { if (this._lv !== undefined) { this.toast('¡Nuevo rango: ' + lv.name + '!'); Audio2.sfx('win'); } this._lv = lv.n; }
  },
  LEVELS: [[0, 'Novato de mesa'], [50, 'Habitual'], [150, 'Jugador de barra'], [300, 'Tahúr'], [600, 'Maestro del salón'], [1000, 'Leyenda']],
  level() {
    const p = this.state.points || 0;
    let n = 0; this.LEVELS.forEach((l, i) => { if (p >= l[0]) n = i; });
    const next = this.LEVELS[n + 1];
    return { n, name: this.LEVELS[n][1], p, next: next ? next[0] : null };
  },
  gen: 0,
  route: 'hub',
  // botón atrás de Android: true = lo gestiona la app, false = salir
  back() {
    if (document.getElementById('drawer').classList.contains('open')) { this.drawer(false); return true; }
    if (this.route !== 'hub') { this.go('hub'); return true; }
    return false;
  },
  // temporizadores que se cancelan solos al cambiar de pantalla
  timer(fn, ms) {
    const g = this.gen;
    return setTimeout(() => { if (g === this.gen) { try { fn(); } catch (e) { console.warn(e); } } }, ms);
  },
  go(route, data) {
    this.gen++;
    if (this.onLeave) { try { this.onLeave(); } catch (e) { } this.onLeave = null; }
    this.route = route;
    const v = document.getElementById('view');
    v.innerHTML = ''; window.scrollTo(0, 0);
    ({ hub: this.hub, setup: this.setup, online: this.online, stats: this.stats, settings: this.settings, play: this.play, sala: this.sala, ranking: this.ranking })[route].call(this, v, data);
  },

  hub(v) {
    v.innerHTML = `<div class="section-title">ELIGE MESA</div><div class="grid" id="g"></div>`;
    const g = v.querySelector('#g');
    GAMES.forEach((game, i) => {
      const c = document.createElement('div');
      c.className = 'gcard' + (game.soon ? ' soon' : '');
      c.style.animationDelay = (i * 55) + 'ms';
      c.innerHTML = `<div class="art">${ART[game.art] || ''}</div><div class="veil"></div>
        <div class="lbl" style="color:${game.color}">${game.name}</div>
        ${game.badge ? `<div class="badge ${game.badge.c || ''}">${game.badge.t}</div>` : ''}`;
      if (!game.soon) c.onclick = () => { Audio2.sfx('tick'); this.go('setup', game); };
      else c.onclick = () => this.toast(game.name + ' llega en la próxima actualización');
      g.appendChild(c);
    });
  },

  setup(v, game) {
    const diffs = [['facil', 'Fácil'], ['medio', 'Medio'], ['dificil', 'Difícil']];
    v.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Juegos</button></div>
      <div class="card"><h2>${game.name}</h2><p>${game.tag} · elige cómo quieres jugar.</p>
        ${game.bot ? `<label class="fl">DIFICULTAD DEL BOT</label><div class="seg" id="dif">
          ${diffs.map(([k, n], i) => `<button data-d="${k}" class="${i === 1 ? 'on' : ''}">${n}</button>`).join('')}</div>` : ''}
        ${(game.id === 'parchis' || game.id === 'cinquillo') ? `<label class="fl">JUGADORES</label><div class="seg" id="pl">
          ${(game.id === 'cinquillo' ? [3, 4, 6] : [2, 3, 4]).map((n, i) => `<button data-p="${n}" class="${i === 2 ? 'on' : ''}">${n}</button>`).join('')}</div>` : ''}
        ${game.id === 'bingo' ? `<label class="fl">JUGADORES</label><div class="seg" id="pl">
          ${[2, 4, 6].map((n, i) => `<button data-p="${n}" class="${i === 1 ? 'on' : ''}">${n}</button>`).join('')}</div>` : ''}
        <div class="row"><button class="btn" id="solo">Jugar contra el bot</button></div>
        <div class="row"><button class="btn ghost" id="onl">Sala online</button></div>
      </div>`;
    let diff = 'medio', players = game.id === 'cinquillo' ? 6 : 4;
    v.querySelector('#bk').onclick = () => this.go('hub');
    v.querySelectorAll('#dif button').forEach(b => b.onclick = () => {
      v.querySelectorAll('#dif button').forEach(x => x.classList.remove('on')); b.classList.add('on'); diff = b.dataset.d; Audio2.sfx('tick');
    });
    v.querySelectorAll('#pl button').forEach(b => b.onclick = () => {
      v.querySelectorAll('#pl button').forEach(x => x.classList.remove('on')); b.classList.add('on'); players = +b.dataset.p; Audio2.sfx('tick');
    });
    v.querySelector('#solo').onclick = () => this.go('play', { game, diff, players });
    v.querySelector('#onl').onclick = () => this.go('online', game);
  },

  play(v, { game, diff, players }) { game.mod().mount(v, { diff, players }); },

  online(v, game) {
    const g = game || GAMES.find(x => x.id === 'bingo');
    v.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Juegos</button></div>
      <div class="card"><h2>Jugar online</h2>
        <p>Salas privadas por código, hasta 6 jugadores.</p>
        <label class="fl">JUEGO DE LA SALA</label><div class="seg" id="og">
          <button data-g="bingo" class="on">Bingo</button><button data-g="cinquillo">Cinquillo</button><button data-g="brisca">Brisca</button><button data-g="parchis">Parchís</button></div>
        <label class="fl">TU NOMBRE</label><input type="text" id="nm" maxlength="14" placeholder="Cómo te verán en la mesa" value="${this.state.name}">
        <label class="fl">TU AVATAR</label><div id="av" style="display:flex;gap:8px;flex-wrap:wrap">
          ${['🙂','😎','🐺','🦊','🐼','🐲','👑','🤖'].map(a => `<button data-a="${a}" class="avpick" style="font-size:22px;width:44px;height:44px;border-radius:14px;border:2px solid var(--outline);background:var(--surf2)">${a}</button>`).join('')}
        </div>
        <label class="fl">TU COLOR</label><div id="cl" style="display:flex;gap:8px">
          ${['#e63946','#2a9d8f','#e9c46a','#457b9d','#b07ae0'].map((c, i) => `<button data-c="${i}" class="clpick" style="width:38px;height:38px;border-radius:50%;border:2px solid var(--outline);background:${c}"></button>`).join('')}
        </div>
        <div class="row"><button class="btn" id="crear">Crear sala</button></div>
        <label class="fl">O ENTRA CON UN CÓDIGO</label><input type="text" id="cd" maxlength="6" placeholder="Ej. 4KJ9ZQ" style="text-transform:uppercase">
        <div class="row"><button class="btn ghost" id="unir">Unirse a la sala</button></div>
      </div>`;
    v.querySelector('#bk').onclick = () => this.go('hub');
    const nm = v.querySelector('#nm');
    nm.oninput = () => { this.state.name = nm.value; this.save(); this.refreshDrawer(); };
    const name = () => (nm.value || 'Jugador').trim();
    let og = 'bingo';
    let look = { avatar: this.state.avatar || '🙂', color: this.state.color || 0 };
    const paint = () => {
      v.querySelectorAll('.avpick').forEach(b => b.style.borderColor = b.dataset.a === look.avatar ? 'var(--primary)' : 'var(--outline)');
      v.querySelectorAll('.clpick').forEach(b => b.style.borderColor = +b.dataset.c === look.color ? 'var(--primary)' : 'var(--outline)');
    };
    v.querySelectorAll('.avpick').forEach(b => b.onclick = () => { look.avatar = b.dataset.a; this.state.avatar = look.avatar; this.save(); paint(); Audio2.sfx('tick'); });
    v.querySelectorAll('.clpick').forEach(b => b.onclick = () => { look.color = +b.dataset.c; this.state.color = look.color; this.save(); paint(); Audio2.sfx('tick'); });
    paint();
    v.querySelectorAll('#og button').forEach(b => b.onclick = () => {
      v.querySelectorAll('#og button').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); og = b.dataset.g; Audio2.sfx('tick');
    });
    const ERR = { offline: 'Sin conexión a internet', no_room: 'No existe esa sala', full: 'La sala está llena', started: 'La partida ya ha empezado' };
    v.querySelector('#crear').onclick = async () => {
      this.toast('Creando sala…');
      const r = await Net.create(og, name(), 6, look);
      if (r.error) return this.toast(ERR[r.error] || 'No se pudo crear la sala');
      this.go('sala', { code: r.code, game: og.charAt(0).toUpperCase() + og.slice(1) });
    };
    v.querySelector('#unir').onclick = async () => {
      const c = v.querySelector('#cd').value.trim();
      if (c.length < 4) return this.toast('Escribe el código de la sala');
      this.toast('Entrando…');
      const r = await Net.join(c, name(), look);
      if (r.error) return this.toast(ERR[r.error] || 'No se pudo entrar');
      this.go('sala', { code: r.code, game: (r.game || 'bingo').charAt(0).toUpperCase() + (r.game || 'bingo').slice(1) });
    };
  },

  sala(v, data) { [BingoOnline, CinquilloOnline, BriscaOnline, ParchisOnline].forEach(m => { m.started = false; m._done = false; }); Sala.mount(v, data); },

  stats(v) {
    const s = this.state.stats;
    const rows = Object.entries(s);
    v.innerHTML = `<div class="board-head"><button class="back" id="bk">← Juegos</button></div>
      <div class="card"><h2>Tu rango</h2>
        <p style="color:var(--on)"><b style="color:var(--primary);font-size:18px">${this.level().name}</b><br>${this.level().p} puntos de salón</p>
        <div style="height:10px;border-radius:99px;background:var(--surf3);overflow:hidden">
          <div style="height:100%;width:${this.level().next ? Math.min(100, Math.round(this.level().p / this.level().next * 100)) : 100}%;background:var(--primary);transition:width .6s var(--ease)"></div></div>
        <p style="margin-top:8px">${this.level().next ? 'Siguiente rango a los ' + this.level().next + ' puntos' : 'Rango máximo alcanzado'}</p>
      </div>
      <div class="card"><h2>Estadísticas</h2>
      ${rows.length ? rows.map(([k, r]) => `<p style="display:flex;justify-content:space-between;color:var(--on)">
        <span style="text-transform:capitalize">${k}</span><b>${r.w}V · ${r.l}D</b></p>`).join('')
        : '<p>Todavía no has terminado ninguna partida. Empieza por una mesa fácil.</p>'}</div>`;
    v.querySelector('#bk').onclick = () => this.go('hub');
  },

  async ranking(v) {
    v.innerHTML = `<div class="board-head"><button class="back" id="bk">← Juegos</button></div>
      <div class="card"><h2>Ranking global</h2><p>Puntos de todos los jugadores de GamesSaloon.</p>
      <div id="lst">Cargando…</div></div>`;
    v.querySelector('#bk').onclick = () => this.go('hub');
    const CLR = ['#e63946', '#2a9d8f', '#e9c46a', '#457b9d', '#b07ae0'];
    const rows = await Net.top(20);
    const lst = v.querySelector('#lst');
    if (!rows.length) { lst.textContent = 'Todavía no hay puntuaciones (o no hay conexión). Pon tu nombre en Ajustes y juega una partida.'; return; }
    lst.innerHTML = rows.map((r, i) => `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--outline)">
      <b style="width:26px;color:var(--on-dim)">${i + 1}</b>
      <span style="font-size:20px">${r.avatar}</span>
      <span style="flex:1;border-left:4px solid ${CLR[r.color] || CLR[0]};padding-left:8px${r.name === this.state.name ? ';font-weight:700;color:var(--primary)' : ''}">${r.name}</span>
      <b>${r.points}</b></div>`).join('');
  },

  settings(v) {
    v.innerHTML = `<div class="board-head"><button class="back" id="bk">← Juegos</button></div>
      <div class="card"><h2>Ajustes</h2>
        <label class="fl">NOMBRE DE JUGADOR</label><input type="text" id="nm" maxlength="14" value="${this.state.name}" placeholder="Invitado">
        <label class="fl">TEMA</label><div class="seg" id="th">
          <button data-t="dark" class="${this.state.theme === 'dark' ? 'on' : ''}">Oscuro</button>
          <button data-t="light" class="${this.state.theme === 'light' ? 'on' : ''}">Claro</button></div>
        <div class="row"><button class="btn ghost" id="reset">Borrar estadísticas</button></div>
      </div>
      <div class="card"><p style="margin:0">GamesSaloon · Xito Development · v1.1</p></div>`;
    v.querySelector('#bk').onclick = () => this.go('hub');
    const nm = v.querySelector('#nm');
    nm.oninput = () => { this.state.name = nm.value; this.save(); this.refreshDrawer(); };
    v.querySelectorAll('#th button').forEach(b => b.onclick = () => {
      this.state.theme = b.dataset.t; document.body.dataset.theme = b.dataset.t; this.save();
      v.querySelectorAll('#th button').forEach(x => x.classList.toggle('on', x === b));
    });
    v.querySelector('#reset').onclick = () => { this.state.stats = {}; this.save(); this.refreshDrawer(); this.toast('Estadísticas borradas'); };
  }
};
document.addEventListener('DOMContentLoaded', () => App.init());
