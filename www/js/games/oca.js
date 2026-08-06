/* La Oca (63 casillas) para 2 a 4 jugadores contra bots, con todas las casillas especiales:
   ocas (de oca a oca y tiro porque me toca), puentes 6 y 12, posada 19, dados 26 y 53,
   pozo 31, laberinto 42, cárcel 56, muerte 58 y meta exacta en la 63. */
const Oca = {
  id: 'oca', name: 'La Oca', hasBot: true,
  reglas: 'Tira el dado y avanza. Las ocas te llevan a la siguiente oca y repites tirada; los puentes se comunican entre sí; posada, pozo y cárcel te hacen esperar; el laberinto te devuelve a la 30 y la muerte a la casilla 1. Para ganar hay que caer justo en la 63.',
  OCAS: [5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59],
  mount(root, opts) {
    const NP = Math.min(4, Math.max(2, opts.players || 4));
    const NOMBRES = ['Tú', 'Bot 1', 'Bot 2', 'Bot 3'];
    const COL = ['#e63946', '#2a9d8f', '#e9c46a', '#457b9d'];
    const OCAS = this.OCAS;
    let pos, espera, turno, over, pozoOcupado;

    root.innerHTML = `
      <div class="board-head"><button class="back" id="bk">← Salir</button>
        <div class="hud" id="hud"></div></div>
      <div class="board-wrap"><div class="felt" style="padding:8px"><div id="bd"></div></div></div>
      <div class="card" style="display:flex;align-items:center;gap:14px">
        <div id="dado" style="width:58px;height:58px;border-radius:16px;background:#fff;color:#111;display:grid;place-items:center;
          font-size:28px;font-weight:800;box-shadow:var(--shadow);transition:transform .3s var(--ease)">–</div>
        <p id="msg" style="margin:0;flex:1">Tira el dado para empezar.</p>
      </div>
      <div class="row"><button class="btn" id="tirar">Tirar dado</button><button class="btn ghost" id="nw">Nueva partida</button></div>`;
    const $ = s => root.querySelector(s);
    $('#bk').onclick = () => App.go('hub');
    $('#nw').onclick = init;
    $('#tirar').onclick = () => { if (turno === 0) tirar(); };
    const say = t => $('#msg').textContent = t;

    function init() {
      pos = Array(NP).fill(0); espera = Array(NP).fill(0); pozoOcupado = -1;
      turno = 0; over = false; render(); say('Empiezas tú. Tira el dado.');
    }
    const siguienteOca = c => OCAS.find(o => o > c) || 63;

    function especial(j) {
      const c = pos[j], quien = NOMBRES[j];
      if (OCAS.includes(c)) {
        pos[j] = siguienteOca(c);
        Audio2.sfx('chip');
        say(`${quien}: de oca a oca y tiro porque me toca (a la ${pos[j]})`);
        return 'repite';
      }
      if (c === 6) { pos[j] = 12; say(`${quien}: de puente a puente y tiro porque me lleva la corriente`); return 'repite'; }
      if (c === 12) { pos[j] = 6; say(`${quien}: de puente a puente y tiro porque me lleva la corriente`); return 'repite'; }
      if (c === 19) { espera[j] = 1; say(`${quien} cae en la posada y pierde un turno`); return 'fin'; }
      if (c === 26) { pos[j] = 53; say(`${quien}: de dado a dado y tiro porque me ha tocado`); return 'repite'; }
      if (c === 53) { pos[j] = 26; say(`${quien}: de dado a dado y tiro porque me ha tocado`); return 'repite'; }
      if (c === 31) {
        if (pozoOcupado >= 0 && pozoOcupado !== j) { espera[pozoOcupado] = 0; say(`${quien} cae en el pozo y libera a ${NOMBRES[pozoOcupado]}`); }
        else say(`${quien} cae en el pozo y espera a que otro lo rescate`);
        pozoOcupado = j; espera[j] = 99; return 'fin';
      }
      if (c === 42) { pos[j] = 30; say(`${quien} se pierde en el laberinto y vuelve a la 30`); return 'fin'; }
      if (c === 56) { espera[j] = 2; say(`${quien} va a la cárcel y pierde dos turnos`); return 'fin'; }
      if (c === 58) { pos[j] = 1; say(`${quien} cae en la muerte y vuelve a empezar`); Audio2.sfx('bad'); return 'fin'; }
      if (c === 63) {
        over = true;
        say(`${quien} llega a la meta. ${j === 0 ? '¡Has ganado! 🎉' : 'Gana el bot.'}`);
        Audio2.sfx(j === 0 ? 'win' : 'bad');
        App.record('oca', j === 0 ? 'win' : 'loss');
        return 'gana';
      }
      return 'fin';
    }
    function tirar() {
      if (over) return;
      const j = turno;
      const d = 1 + Math.floor(Math.random() * 6);
      const dado = $('#dado');
      dado.textContent = d; dado.style.transform = 'rotate(360deg) scale(1.15)';
      App.timer(() => { dado.style.transform = ''; }, 320);
      Audio2.sfx('tick');
      let destino = pos[j] + d;
      if (destino > 63) { destino = 63 - (destino - 63); say(`${NOMBRES[j]} se pasa y retrocede a la ${destino}`); }
      pos[j] = destino;
      render();
      const r = especial(j);
      render();
      if (r === 'gana') { $('#tirar').style.opacity = .45; return; }
      if (r === 'repite') { App.timer(() => { if (turno === 0) say($('#msg').textContent + ' · vuelve a tirar'); else tirar(); }, 700); return; }
      App.timer(siguiente, 700);
    }
    function siguiente() {
      if (over) return;
      let vueltas = 0;
      do {
        turno = (turno + 1) % NP;
        vueltas++;
        if (espera[turno] > 0 && espera[turno] < 99) { espera[turno]--; say(`${NOMBRES[turno]} pierde el turno`); }
        else if (espera[turno] === 99) say(`${NOMBRES[turno]} sigue en el pozo`);
        else break;
      } while (vueltas < NP * 4);
      render();
      if (turno !== 0) App.timer(tirar, 800);
      else say('Tu turno: tira el dado.');
    }
    function render() {
      $('#hud').innerHTML = NOMBRES.slice(0, NP).map((n, i) =>
        `<span style="color:${COL[i]}">●</span> ${turno === i ? '<b>' : ''}${n}: casilla ${pos[i]}${turno === i ? '</b>' : ''}`).join('<br>');
      const bd = $('#bd'); bd.innerHTML = '';
      const g = document.createElement('div');
      g.style.cssText = 'display:grid;grid-template-columns:repeat(9,1fr);gap:3px';
      for (let c = 1; c <= 63; c++) {
        const d = document.createElement('div');
        const esOca = OCAS.includes(c);
        const especialTxt = { 6: '🌉', 12: '🌉', 19: '🏠', 26: '🎲', 53: '🎲', 31: '🕳️', 42: '🌀', 56: '🔒', 58: '💀', 63: '🏁' }[c];
        d.style.cssText = `aspect-ratio:1;border-radius:6px;display:grid;place-items:center;position:relative;font-size:11px;
          background:${esOca ? '#2a9d8f' : especialTxt ? '#7c5cbf' : 'rgba(255,255,255,.14)'};color:#fff;font-weight:700`;
        d.textContent = esOca ? '🦢' : (especialTxt || c);
        const aqui = pos.map((p, i) => p === c ? i : -1).filter(i => i >= 0);
        if (aqui.length) {
          const fichas = document.createElement('div');
          fichas.style.cssText = 'position:absolute;inset:0;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1px';
          aqui.forEach(i => {
            const f = document.createElement('div');
            f.style.cssText = `width:9px;height:9px;border-radius:50%;background:${COL[i]};box-shadow:0 1px 3px #000a;
              transition:transform .3s var(--ease)`;
            fichas.appendChild(f);
          });
          d.appendChild(fichas);
        }
        g.appendChild(d);
      }
      bd.appendChild(g);
      $('#tirar').style.opacity = !over && turno === 0 ? 1 : .45;
    }
    init();
  }
};
