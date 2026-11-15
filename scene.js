const canvas = document.querySelector('.stage-grid');
const stage = canvas.parentElement;
const context = canvas.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function drawGrid() {
  if (!context) return;
  const { width, height } = stage.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.strokeStyle = '#aaa1eb';
  context.lineWidth = 1;
  for (let layer = 1; layer <= 9; layer += 1) {
    const scale = (layer / 9) ** 2;
    const left = width * (.5 - .85 * scale);
    const top = height * (.5 - .72 * scale);
    context.globalAlpha = .10 + .14 * scale;
    context.strokeRect(left, top, width - left * 2, height - top * 2);
  }
  context.globalAlpha = .18;
  context.beginPath();
  for (let index = 0; index <= 22; index += 1) {
    const x = width * (index / 22);
    context.moveTo(width * .5 + (x - width * .5) * .12, height * .41);
    context.lineTo(x, 0);
    context.moveTo(width * .5 + (x - width * .5) * .12, height * .59);
    context.lineTo(x, height);
  }
  context.stroke();
}

new ResizeObserver(drawGrid).observe(stage);
if (stage.classList.contains('hero')) {
  const tilt = document.querySelector('.hero-tilt');
  const limit = value => Math.max(-1, Math.min(1, value));
  let origin;
  let scrollFrame;
  const set = (property, value, unit) => stage.style.setProperty(property, value + unit);

  function move(x, y) {
    set('--yaw', x * 36, 'deg');
    set('--pitch', -y * 29, 'deg');
    set('--shift-x', x * 74, 'px');
    set('--shift-y', y * 54, 'px');
    set('--light-x', 50 + x * 50, '%');
    set('--light-y', 50 + y * 50, '%');
  }

  function orientation(event) {
    if (reduced.matches || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    origin ||= { beta: event.beta, gamma: event.gamma };
    move(limit((event.gamma - origin.gamma) / 22), limit((event.beta - origin.beta) / 22));
  }

  function stopTilt() {
    window.removeEventListener('deviceorientation', orientation);
    tilt.setAttribute('aria-pressed', 'false');
    origin = undefined;
    move(0, 0);
  }

  function scrollMotion() {
    scrollFrame = undefined;
    const { top, height } = stage.getBoundingClientRect();
    set('--scroll-shift', reduced.matches ? 0 : Math.max(0, Math.min(1, -top / height)) * 155, 'px');
  }

  stage.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch' || origin) return;
    const bounds = stage.getBoundingClientRect();
    move(limit(2 * (event.clientX - bounds.left) / bounds.width - 1),
      limit(2 * (event.clientY - bounds.top) / bounds.height - 1));
  });
  stage.addEventListener('pointerleave', () => { if (!origin) move(0, 0); });
  window.addEventListener('scroll', () => {
    if (scrollFrame === undefined) scrollFrame = requestAnimationFrame(scrollMotion);
  }, { passive: true });
  scrollMotion();

  function updateTilt() {
    tilt.hidden = reduced.matches || !window.DeviceOrientationEvent || !matchMedia('(pointer: coarse)').matches;
    if (tilt.hidden) stopTilt();
    scrollMotion();
  }
  tilt.addEventListener('click', async () => {
    if (tilt.getAttribute('aria-pressed') === 'true') {
      stopTilt();
      return;
    }
    try {
      const request = window.DeviceOrientationEvent.requestPermission;
      if (request && await window.DeviceOrientationEvent.requestPermission() !== 'granted') return;
      if (reduced.matches) return;
      window.addEventListener('deviceorientation', orientation);
      tilt.setAttribute('aria-pressed', 'true');
    } catch {
      stopTilt();
    }
  });
  reduced.addEventListener('change', updateTilt);
  updateTilt();
}

const pageMenu = document.querySelector('.home-pages');
if (pageMenu) {
  const nav = pageMenu.querySelector('nav');
  const links = [...nav.querySelectorAll('a')];
  const currentLink = document.createElement('a');
  const previous = document.createElement('button');
  const next = document.createElement('button');
  const pause = document.createElement('button');
  let index = 0;
  let paused = false;

  function show(offset = 0) {
    index = (index + offset + links.length) % links.length;
    previous.textContent = links[(index + links.length - 1) % links.length].textContent;
    next.textContent = links[(index + 1) % links.length].textContent;
    currentLink.textContent = links[index].textContent;
    currentLink.href = links[index].getAttribute('href');
    if (offset && !reduced.matches) {
      currentLink.animate([{opacity: .5, transform: `translateX(${offset * 12}px)`}, {opacity: 1, transform: 'none'}], 220);
    }
  }

  for (const [button, label, offset] of [[previous, 'Previous page', -1], [next, 'Next page', 1]]) {
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.addEventListener('click', () => show(offset));
  }
  pause.type = 'button';
  pause.className = 'carousel-playback';
  function updatePlayback() {
    pause.textContent = paused ? '▶' : '❚❚';
    pause.setAttribute('aria-label', paused ? 'Play page carousel' : 'Pause page carousel');
  }
  updatePlayback();
  pause.addEventListener('click', () => {
    paused = !paused;
    updatePlayback();
  });
  nav.replaceChildren(previous, currentLink, next, pause);
  nav.classList.add('page-carousel');
  show();
  setInterval(() => {
    if (!paused && !reduced.matches && !nav.matches(':hover, :focus-within')) show(1);
  }, 3000);
}
