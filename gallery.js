(() => {
  const chapter = document.querySelector('.photo-chapter');
  const stage = chapter.querySelector('.photo-stage');
  const cards = [...chapter.querySelectorAll('figure')];
  const images = cards.map(card => card.querySelector('img'));
  const sources = images.map(image => image.dataset.src || image.getAttribute('src'));
  cards.forEach((card, index) => {
    card.querySelector('a').addEventListener('click', event => {
      event.preventDefault();
      const bytes = Uint8Array.from(atob(sources[index].split(',')[1]), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], {type:'image/jpeg'}));
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    });
  });
  const controls = chapter.querySelector('.photo-controls');
  const slider = chapter.querySelector('#photo-position');
  const counter = chapter.querySelector('#photo-count');
  const buttons = [...controls.querySelectorAll('button')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let frame;
  let current = 0;
  let step;


  function render() {
    frame = undefined;
    const progress = Math.max(0, Math.min(cards.length - 1, -chapter.getBoundingClientRect().top / step));
    const previous = current;
    current = Math.round(progress);
    const spacing = innerWidth * .38;
    for (let index = Math.max(0, current - 2); index <= Math.min(cards.length - 1, current + 2); index++) {
      if (!images[index].hasAttribute('src')) images[index].src = sources[index];
    }
    stage.style.setProperty('--wall-image', `url("${sources[current]}")`);
    stage.style.setProperty('--wall-shift', `${progress * -26}px`);
    cards.forEach((card, index) => {
      const offset = index - current;
      const distance = Math.abs(offset);
      card.hidden = preference.matches ? index !== current : distance > 1;
      if (card.hidden) return;
      card.style.transform = `translateX(${offset * spacing}px)`;
      card.classList.toggle('is-neighbor', distance > 0);
      card.style.zIndex = String(100 - Math.round(distance * 30));
      card.querySelector('a').tabIndex = index === current ? 0 : -1;
    });
    if (current !== previous && !preference.matches) {
      cards[current].getAnimations().forEach(animation => animation.cancel());
      cards[current].animate([
        { transform: 'scale(.96)', opacity: .65 },
        { transform: 'scale(1)', opacity: 1 },
      ], { duration: 280, easing: 'ease-out' });
    }
    slider.value = current + 1;
    counter.value = `${current + 1} / ${cards.length}`;
    buttons[0].disabled = current === 0;
    buttons[1].disabled = current === cards.length - 1;
  }

  function queueRender() {
    if (frame === undefined) frame = requestAnimationFrame(render);
  }

  function layout() {
    step = Math.round(Math.min(155, Math.max(85, innerHeight * .15)));
    chapter.style.setProperty('--photo-travel', `${step * (cards.length - 1)}px`);
    chapter.classList.add('is-spatial');
    controls.hidden = false;
    render();
  }

  function goTo(index) {
    const top = chapter.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + Math.max(0, Math.min(cards.length - 1, index)) * step,
      behavior: preference.matches ? "instant" : "smooth",
    });
  }

  buttons.forEach(button => button.addEventListener('click', () => goTo(current + Number(button.dataset.step))));
  slider.addEventListener('input', () => goTo(Number(slider.value) - 1));
  window.addEventListener('scroll', queueRender, { passive: true });
  window.addEventListener('resize', layout);
  preference.addEventListener('change', layout);
  layout();
})();
