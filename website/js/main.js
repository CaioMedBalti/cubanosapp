// Entry: liga o ScrollBus, o filme scrubado (fundo fullscreen), a camada de
// efeitos (fumaça/faíscas/halo), o story, o ponteiro, a fumaça ambiente, os
// reveals e a vitrine. Ramo separado para prefers-reduced-motion (sem
// partículas, frame estático atualizado no scroll).

import { ScrollBus, clamp01 } from './scroll.js';
import { FilmScrub } from './film.js';
import { Fx } from './fx.js';
import { initReveals, initLazyBackgrounds } from './reveals.js';
import { Showcase } from './showcase.js';
import { Story } from './story.js';
import { initPointer } from './pointer.js';
import { SmokeBackground } from './smokebg.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const filmCanvas = document.getElementById('film');
const fxCanvas = document.getElementById('fx');
const progressEl = document.getElementById('burn-progress');
const smokeBgCanvas = document.getElementById('smoke-bg');

let _lastPct = -1;
function mirrorProgress(progress) {
  const pct = Math.round(progress * 100);
  if (pct !== _lastPct) {
    _lastPct = pct;
    progressEl.setAttribute('aria-valuenow', String(pct));
  }
}

async function init() {
  initReveals();
  initLazyBackgrounds();

  const film = new FilmScrub(filmCanvas);
  const ok = await film.load();
  if (!ok) {
    // Decorativo — a página vive sem o filme (backdrop segura o fundo)
    fxCanvas.hidden = true;
    smokeBgCanvas.hidden = true;
    document.getElementById('film-shade').hidden = true;
    return;
  }

  if (reducedMotion) {
    // Sem rAF contínuo: frame estático re-resolvido apenas no scroll
    const drawOnce = () => {
      const doc = document.scrollingElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp01(window.scrollY / max) : 0;
      film.drawStatic(p);
      mirrorProgress(p);
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
    smokeBgCanvas.hidden = true;
    drawOnce();
    return;
  }

  const fx = new Fx(fxCanvas, film);
  // Ordem importa: o Story estica o #story para 440vh ANTES das medições da
  // vitrine (o offsetTop do catálogo muda).
  const story = new Story(film, fx);
  const showcase = new Showcase();
  const pointer = initPointer(film, fx);
  const smokeBg = new SmokeBackground(smokeBgCanvas, film, fx);

  const bus = new ScrollBus();
  let elapsed = 0;

  // Um único orquestrador — ordem explícita de tick e de resize
  bus.subscribe({
    tick(state, dt) {
      elapsed += dt;
      film.tick(state, dt);
      fx.tick(state, dt, elapsed);
      mirrorProgress(state.progress);
      pointer.tick();
      story.tick(state);
      showcase.tick(state);
      smokeBg.tick(state, dt, elapsed);
    },
    resize() {
      film.resize();
      fx.resize();
      story.applyMode();
      showcase.resize();
      smokeBg.resize();
    },
  });
  bus.start();

  // Handle de depuração/inspeção (site estático — inofensivo e útil)
  window.__cubanos = { bus, film, fx, story, showcase, smokeBg };
}

init();
