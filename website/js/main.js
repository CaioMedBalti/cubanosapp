// Entry: liga o ScrollBus, o filme scrubado (fundo fullscreen), a camada de
// efeitos (faíscas/halo), o story, o ponteiro, os reveals e a vitrine. A
// fumaça é a do próprio vídeo — nenhuma camada procedural por cima. Ramo
// separado para prefers-reduced-motion (sem partículas, frame por scroll).

import { ScrollBus, clamp01 } from './scroll.js';
import { FilmScrub } from './film.js';
import { Fx } from './fx.js';
import { initReveals, initLazyBackgrounds, initCtaBar } from './reveals.js';
import { Showcase } from './showcase.js';
import { Story } from './story.js';
import { initPointer } from './pointer.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const filmCanvas = document.getElementById('film');
const fxCanvas = document.getElementById('fx');
const progressEl = document.getElementById('burn-progress');
const burnLine = document.getElementById('burn-line');
const header = document.querySelector('.site-header');

// Cromo compartilhado: barra de progresso acessível, linha de brasa e o
// estado "scrolled" do header — tudo quantizado para não escrever à toa.
let _lastPct = -1;
let _lastScrolled = null;
function updateChrome(progress, scrollY) {
  const pct = Math.round(progress * 1000);
  if (pct !== _lastPct) {
    _lastPct = pct;
    progressEl.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    burnLine.style.transform = `scaleX(${(pct / 1000).toFixed(3)})`;
  }
  const scrolled = scrollY > 40;
  if (scrolled !== _lastScrolled) {
    _lastScrolled = scrolled;
    header.classList.toggle('is-scrolled', scrolled);
  }
}

async function init() {
  initReveals();
  initLazyBackgrounds();
  initCtaBar();

  const film = new FilmScrub(filmCanvas);
  const ok = await film.load();
  if (!ok) {
    // Decorativo — a página vive sem o filme (backdrop segura o fundo)
    fxCanvas.hidden = true;
    document.getElementById('film-shade').hidden = true;
    const onScroll = () => {
      const doc = document.scrollingElement;
      const max = doc.scrollHeight - window.innerHeight;
      updateChrome(max > 0 ? clamp01(window.scrollY / max) : 0, window.scrollY);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return;
  }

  if (reducedMotion) {
    // Sem rAF contínuo: frame estático re-resolvido apenas no scroll
    const drawOnce = () => {
      const doc = document.scrollingElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp01(window.scrollY / max) : 0;
      film.drawStatic(p);
      updateChrome(p, window.scrollY);
    };
    let pending = false;
    window.addEventListener(
      'scroll',
      () => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          pending = false;
          drawOnce();
        });
      },
      { passive: true },
    );
    window.addEventListener('resize', () => {
      film.resize();
      drawOnce();
    });
    fxCanvas.hidden = true;
    drawOnce();
    return;
  }

  const fx = new Fx(fxCanvas, film);
  // Ordem importa: o Story estica o #story ANTES das medições da vitrine
  // (o offsetTop do catálogo muda).
  const story = new Story(film, fx);
  const showcase = new Showcase();
  const pointer = initPointer(film, fx);

  const bus = new ScrollBus();
  let elapsed = 0;

  // Um único orquestrador — ordem explícita de tick e de resize
  bus.subscribe({
    tick(state, dt) {
      elapsed += dt;
      film.tick(state, dt);
      fx.tick(state, dt, elapsed);
      updateChrome(state.progress, state.scrollY);
      pointer.tick();
      story.tick(state);
      showcase.tick(state);
    },
    resize() {
      film.resize();
      fx.resize();
      story.applyMode();
      showcase.resize();
    },
  });
  bus.start();

  // Handle de depuração/inspeção (site estático — inofensivo e útil)
  window.__cubanos = { bus, film, fx, story, showcase };
}

init();
