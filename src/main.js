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

const deckReady = deck.initialize();

const counter = document.querySelector('#slide-count');
const navigator = document.querySelector('#slide-navigator');
const navigatorTrigger = document.querySelector('#slide-nav-trigger');
const navigatorPanel = document.querySelector('#slide-nav-panel');
const navigatorGrid = document.querySelector('#slide-nav-grid');
const navigatorCount = document.querySelector('#slide-nav-count');
const pad = (n) => String(n).padStart(2, '0');

function compactText(value) {
  return value?.replace(/\s+/g, ' ').trim() || '';
}

function getThumbnailTheme(section) {
  if (section.classList.contains('quiz-slide')) return 'quiz';
  if (section.classList.contains('grpo-slide')) return 'grpo';
  if (section.classList.contains('hinge-slide')) return 'light';
  if (section.classList.contains('post-assessment-slide')) return 'assessment';
  if (section.classList.contains('takeaway-slide')) return 'summary';
  if (section.classList.contains('sources-slide')) return 'sources';
  return 'lesson';
}

function buildSlideNavigator() {
  const slides = deck.getHorizontalSlides();
  const items = slides.map((section, index) => {
    const titleElement = section.querySelector('h1, h2');
    const kickerElement = section.querySelector('.kicker, .eyebrow');
    const title = compactText(titleElement?.textContent) || `Slide ${index + 1}`;
    const kicker = compactText(kickerElement?.textContent).split('·')[0].trim() || 'LESSON';
    const backgroundImage = section.dataset.backgroundImage;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `slide-thumb slide-thumb--${getThumbnailTheme(section)}`;
    button.dataset.slideIndex = index;
    button.setAttribute('aria-label', `Go to slide ${index + 1}: ${title}`);
    button.title = title;

    const visual = document.createElement('span');
    visual.className = 'slide-thumb-visual';
    if (backgroundImage) {
      const imageUrl = new URL(backgroundImage, document.baseURI).href;
      visual.classList.add('has-image');
      visual.style.backgroundImage = `linear-gradient(90deg, rgba(8,17,31,.94), rgba(8,17,31,.40)), url("${imageUrl}")`;
    }

    const number = document.createElement('span');
    number.className = 'slide-thumb-number';
    number.textContent = pad(index + 1);

    const category = document.createElement('span');
    category.className = 'slide-thumb-kicker';
    category.textContent = kicker;

    const previewTitle = document.createElement('span');
    previewTitle.className = 'slide-thumb-title';
    previewTitle.textContent = title;

    const caption = document.createElement('span');
    caption.className = 'slide-thumb-caption';
    const captionNumber = document.createElement('b');
    captionNumber.textContent = pad(index + 1);
    const captionTitle = document.createElement('span');
    captionTitle.textContent = title;
    caption.append(captionNumber, captionTitle);

    visual.append(number, category, previewTitle);
    button.append(visual, caption);
    button.addEventListener('click', () => {
      deck.slide(index);
      navigator.dataset.pinned = 'false';
      navigatorTrigger.focus({ preventScroll: true });
      setNavigatorOpen(false);
    });

    navigatorGrid.append(button);
    return button;
  });

  return items;
}

let navigatorItems = [];
let navigatorOpen = false;

function setNavigatorOpen(open) {
  navigatorOpen = open;
  navigator.classList.toggle('is-open', open);
  navigatorTrigger.setAttribute('aria-expanded', String(open));
  if (open) {
    const { h } = deck.getIndices();
    requestAnimationFrame(() => navigatorItems[h]?.scrollIntoView({ block: 'nearest' }));
  }
}

function updateNavigator() {
  const { h } = deck.getIndices();
  const total = deck.getHorizontalSlides().length;
  navigatorCount.textContent = `${pad(h + 1)} / ${pad(total)}`;
  navigatorItems.forEach((item, index) => {
    const current = index === h;
    item.classList.toggle('is-current', current);
    if (current) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  if (navigatorOpen) navigatorItems[h]?.scrollIntoView({ block: 'nearest' });
}

function updateCounter() {
  const { h } = deck.getIndices();
  const total = deck.getHorizontalSlides().length;
  counter.textContent = `${pad(h + 1)} / ${pad(total)}`;
  updateNavigator();
}
deckReady.then(() => {
  navigatorItems = buildSlideNavigator();
  updateCounter();
});
deck.on('slidechanged', updateCounter);

navigator.dataset.pinned = 'false';
navigator.addEventListener('pointerenter', () => setNavigatorOpen(true));
navigator.addEventListener('pointerleave', () => {
  if (navigator.dataset.pinned !== 'true') setNavigatorOpen(false);
});
navigator.addEventListener('focusin', () => setNavigatorOpen(true));
navigator.addEventListener('focusout', () => {
  requestAnimationFrame(() => {
    const retainsFocus = navigator.contains(document.activeElement);
    const hovered = navigator.matches(':hover');
    if (!retainsFocus && !hovered && navigator.dataset.pinned !== 'true') setNavigatorOpen(false);
  });
});

navigatorTrigger.addEventListener('click', () => {
  const pinned = navigator.dataset.pinned !== 'true';
  navigator.dataset.pinned = String(pinned);
  setNavigatorOpen(pinned || navigator.matches(':hover'));
});

navigatorTrigger.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    setNavigatorOpen(true);
    const { h } = deck.getIndices();
    navigatorItems[h]?.focus();
  }
});

navigatorPanel.addEventListener('keydown', (event) => {
  const item = event.target.closest('.slide-thumb');
  if (!item) return;
  const index = Number(item.dataset.slideIndex);
  const columns = window.matchMedia('(max-width: 720px)').matches ? 2 : 4;
  const moves = {
    ArrowLeft: index - 1,
    ArrowRight: index + 1,
    ArrowUp: index - columns,
    ArrowDown: index + columns,
    Home: 0,
    End: navigatorItems.length - 1
  };
  if (!(event.key in moves)) return;
  event.preventDefault();
  event.stopPropagation();
  navigatorItems[Math.max(0, Math.min(navigatorItems.length - 1, moves[event.key]))]?.focus();
});

document.addEventListener('pointerdown', (event) => {
  if (!navigator.contains(event.target)) {
    navigator.dataset.pinned = 'false';
    setNavigatorOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigatorOpen) {
    navigator.dataset.pinned = 'false';
    setNavigatorOpen(false);
    navigatorTrigger.focus({ preventScroll: true });
    return;
  }
  if (event.key.toLowerCase() === 'm') {
    const open = !navigatorOpen;
    navigator.dataset.pinned = String(open);
    setNavigatorOpen(open);
    if (open) navigatorItems[deck.getIndices().h]?.focus();
    return;
  }
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
