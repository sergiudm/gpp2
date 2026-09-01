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
const slideNavigator = document.querySelector('#slide-navigator');
const slideRailList = document.querySelector('#slide-rail-list');
const slidePeek = document.querySelector('#slide-peek');
const slidePeekStage = document.querySelector('#slide-peek-stage');
const slidePeekNumber = document.querySelector('#slide-peek-number');
const slidePeekKicker = document.querySelector('#slide-peek-kicker');
const slidePeekTitle = document.querySelector('#slide-peek-title');
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

function getSlideLabel(section, index) {
  const title = compactText(section.querySelector('h1, h2')?.textContent) || `Slide ${index + 1}`;
  const kicker = compactText(section.querySelector('.kicker, .eyebrow')?.textContent).split('·')[0].trim() || 'LESSON';
  return { title, kicker };
}

function buildSlideNavigator() {
  const slides = deck.getHorizontalSlides();
  return slides.map((section, index) => {
    const { title } = getSlideLabel(section, index);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'slide-rail-item';
    if (index % 5 === 0) button.classList.add('is-major');
    if (section.classList.contains('quiz-slide')) button.classList.add('is-quiz');
    button.dataset.slideIndex = index;
    button.setAttribute('aria-label', `Go to slide ${index + 1}: ${title}`);
    button.title = title;
    button.addEventListener('pointerenter', () => showSlidePeek(index, button));
    button.addEventListener('focus', () => showSlidePeek(index, button));
    button.addEventListener('click', () => {
      deck.slide(index);
      hideSlidePeek();
      button.blur();
    });
    slideRailList.append(button);
    return button;
  });
}

let navigatorItems = [];
let previewedSlide = null;

function makeSlidePreview(section) {
  const clone = section.cloneNode(true);
  clone.classList.remove('past', 'present', 'future');
  clone.removeAttribute('style');
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('aside.notes').forEach((notes) => notes.remove());
  clone.querySelectorAll('.fragment').forEach((fragment) => fragment.classList.add('visible'));
  clone.querySelectorAll('a, button, input, select, textarea').forEach((element) => {
    element.setAttribute('tabindex', '-1');
  });

  if (section.dataset.backgroundImage) {
    clone.style.backgroundImage = `url("${new URL(section.dataset.backgroundImage, document.baseURI).href}")`;
    clone.style.backgroundPosition = 'center';
    clone.style.backgroundSize = 'cover';
  }
  if (section.dataset.backgroundColor) clone.style.backgroundColor = section.dataset.backgroundColor;
  return clone;
}

function showSlidePeek(index, anchor = navigatorItems[index]) {
  const slides = deck.getHorizontalSlides();
  const section = slides[index];
  if (!section || !anchor) return;
  const { title, kicker } = getSlideLabel(section, index);

  previewedSlide = index;
  slidePeekNumber.textContent = `${pad(index + 1)} / ${pad(slides.length)}`;
  slidePeekKicker.textContent = kicker;
  slidePeekTitle.textContent = title;
  slidePeekStage.replaceChildren(makeSlidePreview(section));
  slidePeek.classList.add('is-visible');
  slidePeek.setAttribute('aria-hidden', 'false');

  requestAnimationFrame(() => {
    const anchorRect = anchor.getBoundingClientRect();
    const peekHeight = slidePeek.getBoundingClientRect().height;
    const preferredTop = anchorRect.top + anchorRect.height / 2 - peekHeight / 2;
    const top = Math.max(16, Math.min(window.innerHeight - peekHeight - 16, preferredTop));
    slidePeek.style.top = `${top}px`;
  });
}

function hideSlidePeek() {
  previewedSlide = null;
  slidePeek.classList.remove('is-visible');
  slidePeek.setAttribute('aria-hidden', 'true');
}

function updateNavigator() {
  const { h } = deck.getIndices();
  navigatorItems.forEach((item, index) => {
    const current = index === h;
    item.classList.toggle('is-current', current);
    if (current) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  if (previewedSlide !== null && slideNavigator.matches(':hover')) {
    showSlidePeek(previewedSlide, navigatorItems[previewedSlide]);
  }
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

slideNavigator.addEventListener('pointerleave', hideSlidePeek);
slideNavigator.addEventListener('focusout', () => {
  requestAnimationFrame(() => {
    if (!slideNavigator.contains(document.activeElement) && !slideNavigator.matches(':hover')) hideSlidePeek();
  });
});

slideRailList.addEventListener('keydown', (event) => {
  const item = event.target.closest('.slide-rail-item');
  if (!item) return;
  const index = Number(item.dataset.slideIndex);
  const moves = {
    ArrowLeft: index - 1,
    ArrowUp: index - 1,
    ArrowRight: index + 1,
    ArrowDown: index + 1,
    Home: 0,
    End: navigatorItems.length - 1
  };
  if (!(event.key in moves)) return;
  event.preventDefault();
  event.stopPropagation();
  const nextItem = navigatorItems[Math.max(0, Math.min(navigatorItems.length - 1, moves[event.key]))];
  nextItem?.focus({ preventScroll: true });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && previewedSlide !== null) {
    hideSlidePeek();
    document.activeElement?.blur?.();
    event.stopPropagation();
    return;
  }
  if (event.key.toLowerCase() === 'm') {
    event.preventDefault();
    const currentItem = navigatorItems[deck.getIndices().h];
    currentItem?.focus({ preventScroll: true });
    showSlidePeek(deck.getIndices().h, currentItem);
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
