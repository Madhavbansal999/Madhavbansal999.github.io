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
  stage.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch') return;
    const bounds = stage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    stage.style.setProperty('--yaw', (x - .5) * 52 + 'deg');
    stage.style.setProperty('--pitch', (.5 - y) * 40 + 'deg');
    stage.style.setProperty('--shift-x', (x - .5) * 96 + 'px');
    stage.style.setProperty('--shift-y', (y - .5) * 76 + 'px');
    stage.style.setProperty('--light-x', x * 100 + '%');
    stage.style.setProperty('--light-y', y * 100 + '%');
  });

  function resetPointer() {
    for (const property of ['--yaw', '--pitch', '--shift-x', '--shift-y', '--light-x', '--light-y']) {
      stage.style.removeProperty(property);
    }
  }

  stage.addEventListener('pointerleave', resetPointer);
  reduced.addEventListener('change', resetPointer);
}

const titleLight = document.querySelector('.title-light');
if (titleLight) {
  let sweep;
  titleLight.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch') return;
    const bounds = titleLight.getBoundingClientRect();
    titleLight.style.setProperty('--title-light-x', `${(event.clientX - bounds.left) / bounds.width * 100}%`);
  });
  titleLight.addEventListener('pointerleave', () => titleLight.style.removeProperty('--title-light-x'));
  titleLight.addEventListener('click', () => {
    sweep?.cancel();
    if (reduced.matches) return;
    sweep = titleLight.animate([
      { '--title-light-x': '-25%' },
      { '--title-light-x': '125%' },
    ], { duration: 950, easing: 'ease-in-out' });
  });
}
