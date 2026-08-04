/* Animaciones de movimiento: desliza un elemento desde la posición de origen */
const Anim = {
  slideFrom(el, fromRect) {
    if (!el || !fromRect) return;
    const to = el.getBoundingClientRect();
    const dx = fromRect.left - to.left, dy = fromRect.top - to.top;
    if (!dx && !dy) return;
    el.style.setProperty('--dx', dx + 'px');
    el.style.setProperty('--dy', dy + 'px');
    el.classList.add('slide-in');
    el.addEventListener('animationend', () => el.classList.remove('slide-in'), { once: true });
  },
  rectOf(container, index, selector) {
    const els = container.querySelectorAll(selector);
    return els[index] ? els[index].getBoundingClientRect() : null;
  },
  deal(els, step = 55) {
    els.forEach((e, i) => { e.classList.add('deal'); e.style.animationDelay = (i * step) + 'ms'; });
  }
};
