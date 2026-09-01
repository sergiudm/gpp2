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
const themeToggle = document.querySelector('#theme-toggle');
const themeToggleLabel = document.querySelector('#theme-toggle-label');
const pad = (n) => String(n).padStart(2, '0');

function setTheme(theme, persist = true) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  const isLight = nextTheme === 'light';
  document.documentElement.dataset.theme = nextTheme;
  themeToggle.setAttribute('aria-pressed', String(isLight));
  themeToggle.setAttribute('aria-label', `Switch to ${isLight ? 'night' : 'day'} mode`);
  themeToggle.title = `Switch to ${isLight ? 'night' : 'day'} mode`;
  themeToggleLabel.textContent = isLight ? 'DAY' : 'NIGHT';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isLight ? '#f3efe6' : '#08111f');
  if (persist) {
    try {
      localStorage.setItem('rl-deck-theme', nextTheme);
    } catch {
      // The theme still works when storage is unavailable.
    }
  }
}

setTheme(document.documentElement.dataset.theme, false);
themeToggle.addEventListener('click', () => {
  setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
});

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

const mazeSlide = document.querySelector('.maze-slide');
const maze = mazeSlide.querySelector('.maze');
const mazeRunner = maze.querySelector('.maze-runner');
const mazeRoutes = [...maze.querySelectorAll('[data-maze-route]')];
const mazeAttempts = [...mazeSlide.querySelectorAll('[data-maze-step]')];
const mazeDurations = [1350, 1750, 2600];
let mazeAnimationFrame = null;

function stopMazeAnimation() {
  if (mazeAnimationFrame) cancelAnimationFrame(mazeAnimationFrame);
  mazeAnimationFrame = null;
}

function mazeRouteLength(route) {
  if (!route.dataset.routeLength) route.dataset.routeLength = String(route.getTotalLength());
  return Number(route.dataset.routeLength);
}

function placeMazeRunner(route, distance) {
  const point = route.getPointAtLength(distance);
  mazeRunner.setAttribute('transform', `translate(${point.x} ${point.y})`);
}

function visibleMazeStep() {
  return mazeAttempts.reduce((latest, attempt) => {
    if (!attempt.classList.contains('visible')) return latest;
    return Math.max(latest, Number(attempt.dataset.mazeStep));
  }, 0);
}

function setMazeState(step, resolved = true) {
  stopMazeAnimation();
  maze.dataset.step = String(step);
  if (resolved && step > 0) maze.dataset.resolvedStep = String(step);
  else delete maze.dataset.resolvedStep;

  mazeRoutes.forEach((route) => {
    const routeStep = Number(route.dataset.mazeRoute);
    const length = mazeRouteLength(route);
    const completed = routeStep < step || (routeStep === step && resolved);
    route.style.strokeDasharray = `${length}`;
    route.style.strokeDashoffset = `${completed ? 0 : length}`;
    route.classList.toggle('is-past', routeStep < step);
    route.classList.toggle('is-active', routeStep === step);
  });

  mazeAttempts.forEach((attempt) => {
    const attemptStep = Number(attempt.dataset.mazeStep);
    attempt.classList.toggle('is-past', attemptStep < step);
    attempt.classList.toggle('is-active', attemptStep === step);
    attempt.classList.toggle('is-resolved', attemptStep < step || (attemptStep === step && resolved));
  });

  const route = step > 0 ? mazeRoutes[step - 1] : mazeRoutes[0];
  placeMazeRunner(route, step > 0 && resolved ? mazeRouteLength(route) : 0);
}

function playMazeStep(step) {
  setMazeState(step, false);
  const route = mazeRoutes[step - 1];
  const attempt = mazeAttempts[step - 1];
  const length = mazeRouteLength(route);
  const duration = mazeDurations[step - 1];

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    route.style.strokeDashoffset = '0';
    placeMazeRunner(route, length);
    maze.dataset.resolvedStep = String(step);
    attempt.classList.add('is-resolved');
    return;
  }

  const startedAt = performance.now();
  function animateRoute(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - ((-2 * progress + 2) ** 2) / 2;
    const distance = length * eased;
    route.style.strokeDashoffset = `${length - distance}`;
    placeMazeRunner(route, distance);

    if (progress < 1) {
      mazeAnimationFrame = requestAnimationFrame(animateRoute);
      return;
    }

    mazeAnimationFrame = null;
    maze.dataset.resolvedStep = String(step);
    attempt.classList.add('is-resolved');
  }
  mazeAnimationFrame = requestAnimationFrame(animateRoute);
}

deckReady.then(() => setMazeState(visibleMazeStep()));
deck.on('fragmentshown', (event) => {
  const step = Number(event.fragment?.dataset.mazeStep);
  if (step) playMazeStep(step);
});
deck.on('fragmenthidden', (event) => {
  if (mazeSlide.contains(event.fragment)) setMazeState(visibleMazeStep());
});
deck.on('slidechanged', (event) => {
  if (event.previousSlide === mazeSlide && event.currentSlide !== mazeSlide) stopMazeAnimation();
  if (event.currentSlide === mazeSlide) requestAnimationFrame(() => setMazeState(visibleMazeStep()));
});

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
  const isLight = document.documentElement.dataset.theme === 'light';
  for (const n of nodes) {
    n.x = (n.x + n.vx + 1) % 1; n.y = (n.y + n.vy + 1) % 1;
    ctx.beginPath(); ctx.arc(n.x * w, n.y * h, n.r * devicePixelRatio, 0, Math.PI * 2);
    ctx.fillStyle = n.coral
      ? (isLight ? 'rgba(185,69,49,.13)' : 'rgba(255,111,89,.18)')
      : (isLight ? 'rgba(12,111,99,.10)' : 'rgba(91,232,209,.13)');
    ctx.fill();
  }
  requestAnimationFrame(draw);
}
window.addEventListener('resize', resize); resize(); draw();

setTimeout(() => document.querySelector('#keyboard-hint')?.classList.add('hide'), 5200);
