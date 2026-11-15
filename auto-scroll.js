const scrollButton = document.querySelector('.auto-scroll');
const sections = [...document.querySelectorAll('main > section'), document.querySelector('footer')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let timer = null;

function stop() {
  clearInterval(timer);
  timer = null;
  scrollButton.textContent = '▶ Auto-scroll';
}

function advance() {
  const next = sections.find(section => section.getBoundingClientRect().top > 32);
  if (!next || scrollY + innerHeight >= document.documentElement.scrollHeight - 2) {
    stop();
    return;
  }
  next.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  if (!reducedMotion.matches) {
    next.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 650 });
  }
}

scrollButton.addEventListener('click', () => {
  if (timer !== null) {
    stop();
    return;
  }
  scrollButton.textContent = 'Ⅱ Pause auto-scroll';
  timer = setInterval(advance, 6500);
  advance();
});
window.addEventListener('wheel', stop, { passive: true });
window.addEventListener('touchstart', stop, { passive: true });
window.addEventListener('keydown', event => {
  if (['Escape', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(event.key)) stop();
});
scrollButton.hidden = false;
