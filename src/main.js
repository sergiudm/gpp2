import Reveal from 'reveal.js';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js';
import katex from 'katex';
import 'reveal.js/dist/reveal.css';
import 'katex/dist/katex.min.css';
import './styles.css';

document.querySelectorAll('[data-math]').forEach((element) => {
  katex.render(element.dataset.math, element, {
    throwOnError: false,
    strict: false,
    output: 'html'
  });
});

const deck = new Reveal({
  hash: true,
  history: true,
  center: false,
  width: 1600,
  height: 900,
  margin: 0,
  minScale: 0.2,
  maxScale: 2,
  controls: true,
  controlsLayout: 'edges',
  progress: true,
  transition: 'fade',
  backgroundTransition: 'fade',
  plugins: [RevealNotes]
});

deck.initialize();

const counter = document.querySelector('#slide-count');
const pad = (n) => String(n).padStart(2, '0');
function updateCounter() {
  const { h } = deck.getIndices();
  const total = deck.getHorizontalSlides().length;
  counter.textContent = `${pad(h + 1)} / ${pad(total)}`;
}
deck.on('ready', updateCounter);
deck.on('slidechanged', updateCounter);

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'f') {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
});

const canvas = document.querySelector('#ambient');
const ctx = canvas.getContext('2d');
const nodes = Array.from({ length: 34 }, (_, i) => ({
  x: Math.random(), y: Math.random(), r: 0.7 + Math.random() * 1.6,
  vx: (Math.random() - 0.5) * 0.00016, vy: (Math.random() - 0.5) * 0.00016,
  coral: i % 9 === 0
}));
function resize() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
}
function draw() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  for (const n of nodes) {
    n.x = (n.x + n.vx + 1) % 1; n.y = (n.y + n.vy + 1) % 1;
    ctx.beginPath(); ctx.arc(n.x * w, n.y * h, n.r * devicePixelRatio, 0, Math.PI * 2);
    ctx.fillStyle = n.coral ? 'rgba(255,111,89,.18)' : 'rgba(91,232,209,.13)'; ctx.fill();
  }
  requestAnimationFrame(draw);
}
window.addEventListener('resize', resize); resize(); draw();

setTimeout(() => document.querySelector('#keyboard-hint')?.classList.add('hide'), 5200);
