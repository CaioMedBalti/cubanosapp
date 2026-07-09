// Entry: liga o ScrollBus, o charuto, os reveals e a vitrine. Ramo separado
// para prefers-reduced-motion (sem partículas, desenho estático no scroll).

import { ScrollBus, clamp01, lerp, easeInOut } from './scroll.js';
import { BurningCigar } from './cigar.js';
import { initReveals } from './reveals.js';
import { Showcase } from './showcase.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const stage = document.getElementById('cigar-stage');
const canvas = document.getElementById('cigar-canvas');
const progressEl = document.getElementById('burn-progress');

// Palco do charuto: grande no hero, doca no canto inferior-esquerdo depois.
class CigarStage {
  constructor(cigar) {
    this.cigar = cigar;
    this._lastPct = -1;
    this.layout();
  }

  layout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const aspect = this.cigar.aspect;
    // Fração da altura do palco onde fica o centro/fundo do charuto
    const cigarCenterFrac = (this.cigar.cigarY + this.cigar.imgH / 2) / this.cigar.spaceH;
    const cigarBottomFrac = (this.cigar.cigarY + this.cigar.imgH) / this.cigar.spaceH;

    this.isMobile = vw < 720;
    if (this.isMobile) {
      const w = vw * 0.88;
      const h = w * aspect;
      this.heroW = w;
      this.heroH = h;
      this.hero = { x: (vw - w) / 2, y: vh - 8 - h * cigarBottomFrac, s: 1 };
      this.dock = this.hero;
    } else {
      const heroW = Math.min(620, vw * 0.58);
      const heroH = heroW * aspect;
      const dockW = Math.min(360, vw * 0.3);
      this.heroW = heroW;
      this.heroH = heroH;
      this.hero = {
        x: vw - heroW - Math.max(vw * 0.05, 32),
        y: vh * 0.55 - heroH * cigarCenterFrac,
        s: 1,
      };
      this.dock = {
        x: 24,
        y: vh - 16 - heroH * (dockW / heroW) * cigarBottomFrac,
        s: dockW / heroW,
      };
    }

    stage.style.width = `${this.heroW}px`;
    stage.style.height = `${this.heroH}px`;
    this.cigar.resize(this.heroW, this.heroH, window.devicePixelRatio || 1);
    this._dockThreshold = vh * 0.9;
  }

  apply(scrollY) {
    const t = this.isMobile ? 1 : easeInOut(clamp01(scrollY / this._dockThreshold));
    const x = lerp(this.hero.x, this.dock.x, t);
    const y = lerp(this.hero.y, this.dock.y, t);
    const s = lerp(this.hero.s, this.dock.s, t);
    stage.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
  }

  mirrorProgress(progress) {
    const pct = Math.round(progress * 100);
    if (pct !== this._lastPct) {
      this._lastPct = pct;
      progressEl.setAttribute('aria-valuenow', String(pct));
    }
  }
}

async function init() {
  initReveals();

  const cigar = new BurningCigar(canvas);
  try {
    await cigar.load('/assets/cigars/burn-cigar@2x.webp', '/assets/cigars/burn-cigar@2x.png');
  } catch {
    stage.hidden = true; // decorativo — a página vive sem ele
    return;
  }

  if (window.innerWidth < 720) cigar.smoke.setPoolSize(50);
  const cigarStage = new CigarStage(cigar);

  if (reducedMotion) {
    // Sem rAF contínuo: charuto docado, redesenho estático apenas no scroll
    cigarStage.apply(Number.POSITIVE_INFINITY);
    const drawOnce = () => {
      const doc = document.scrollingElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp01(window.scrollY / max) : 0;
      cigar.drawStatic(p);
      cigarStage.mirrorProgress(p);
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
      cigarStage.layout();
      cigarStage.apply(Number.POSITIVE_INFINITY);
      drawOnce();
    });
    drawOnce();
    return;
  }

  const bus = new ScrollBus();
  const showcase = new Showcase();
  let elapsed = 0;

  bus.subscribe({
    tick(state, dt) {
      elapsed += dt;
      cigar.tick(state, dt, elapsed);
      cigarStage.apply(state.scrollY);
      cigarStage.mirrorProgress(state.progress);
    },
    resize() {
      cigarStage.layout();
    },
  });
  bus.subscribe(showcase);
  bus.start();
}

init();
