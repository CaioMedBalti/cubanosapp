// Entry: liga o ScrollBus, o charuto, o story, o ponteiro, a fumaça ambiente,
// os reveals e a vitrine. Ramo separado para prefers-reduced-motion (sem
// partículas, desenho estático no scroll).

import { ScrollBus, clamp01, lerp, easeInOut } from './scroll.js';
import { BurningCigar } from './cigar.js';
import { initReveals } from './reveals.js';
import { Showcase } from './showcase.js';
import { Story } from './story.js';
import { initPointer } from './pointer.js';
import { SmokeBackground } from './smokebg.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const stage = document.getElementById('cigar-stage');
const canvas = document.getElementById('cigar-canvas');
const progressEl = document.getElementById('burn-progress');
const smokeBgCanvas = document.getElementById('smoke-bg');

// Palco do charuto: três keyframes (hero à direita → GRANDE no centro durante
// o story → doca no canto inferior-esquerdo) com duas zonas de transição
// medidas do DOM. Rotação sutil (±3°) aplicada no canvas interno, em torno do
// eixo do próprio charuto.
class CigarStage {
  constructor(cigar) {
    this.cigar = cigar;
    this._lastPct = -1;
    this.pose = null;
    this.layout();
  }

  layout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const aspect = this.cigar.aspect;
    const cigarCenterFrac = (this.cigar.cigarY + this.cigar.imgH / 2) / this.cigar.spaceH;
    const cigarBottomFrac = (this.cigar.cigarY + this.cigar.imgH) / this.cigar.spaceH;
    this.cigarCenterFrac = cigarCenterFrac;

    this.isMobile = vw < 720;
    if (this.isMobile) {
      const w = vw * 0.88;
      const h = w * aspect;
      this.baseW = w;
      this.baseH = h;
      const pose = { x: (vw - w) / 2, y: vh - 8 - h * cigarBottomFrac, s: 1 };
      this.keys = { hero: pose, center: pose, dock: pose };
      this.storyTop = 1;
      this.pinEnd = 2;
      this.segA = [0, 1];
      this.segB = [0, 1];
    } else {
      const heroW = Math.min(620, vw * 0.58);
      const centerW = Math.min(900, vw * 0.72);
      const dockW = Math.min(360, vw * 0.3);
      // Canvas dimensionado pelo maior keyframe — nunca upscale
      const baseW = Math.max(heroW, centerW);
      const baseH = baseW * aspect;
      this.baseW = baseW;
      this.baseH = baseH;

      const sHero = heroW / baseW;
      const sCenter = centerW / baseW;
      const sDock = dockW / baseW;

      this.keys = {
        hero: {
          x: vw - heroW - Math.max(vw * 0.05, 32),
          y: vh * 0.55 - baseH * sHero * cigarCenterFrac,
          s: sHero,
        },
        center: {
          x: (vw - centerW) / 2,
          y: vh * 0.66 - baseH * sCenter * cigarCenterFrac,
          s: sCenter,
        },
        dock: {
          x: 24,
          y: vh - 16 - baseH * sDock * cigarBottomFrac,
          s: sDock,
        },
      };

      // Zonas de transição amarradas à seção #story (medida com .is-anim já aplicado)
      const story = document.getElementById('story');
      const storyTop = story.offsetTop;
      const pinEnd = storyTop + story.offsetHeight - vh;
      this.storyTop = storyTop;
      this.pinEnd = pinEnd;
      this.segA = [storyTop * 0.15, storyTop];
      // Começa a docar só depois do último painel sair (sp≈0.93)
      this.segB = [pinEnd - vh * 0.2, pinEnd + vh * 0.55];
    }

    stage.style.width = `${this.baseW}px`;
    stage.style.height = `${this.baseH}px`;
    canvas.style.transformOrigin = `50% ${(this.cigarCenterFrac * 100).toFixed(2)}%`;
    this.cigar.resize(this.baseW, this.baseH, window.devicePixelRatio || 1);
  }

  _resolve(scrollY) {
    const { hero, center, dock } = this.keys;
    if (this.isMobile) return { x: hero.x, y: hero.y, s: hero.s, rot: 0 };

    const tA = easeInOut(clamp01((scrollY - this.segA[0]) / (this.segA[1] - this.segA[0])));
    const tB = easeInOut(clamp01((scrollY - this.segB[0]) / (this.segB[1] - this.segB[0])));
    // hero→center com tA; center→dock com tB (as zonas não se sobrepõem)
    const x = lerp(lerp(hero.x, center.x, tA), dock.x, tB);
    const y = lerp(lerp(hero.y, center.y, tA), dock.y, tB);
    const s = lerp(lerp(hero.s, center.s, tA), dock.s, tB);

    // Rotação sutil só dentro do story (janela = tA e ainda não docando)
    const sp = clamp01((scrollY - this.storyTop) / Math.max(this.pinEnd - this.storyTop, 1));
    const rot = Math.sin(sp * Math.PI * 2) * 3 * (tA * (1 - tB));
    return { x, y, s, rot };
  }

  apply(scrollY) {
    const pose = this._resolve(scrollY);
    this.pose = pose;
    stage.style.transform = `translate(${pose.x.toFixed(1)}px, ${pose.y.toFixed(1)}px) scale(${pose.s.toFixed(4)})`;
    canvas.style.transform = pose.rot ? `rotate(${pose.rot.toFixed(2)}deg)` : '';
  }

  // Hit test em coords de viewport contra a silhueta real (só a parte não queimada)
  hitTest(cx, cy) {
    const pose = this.pose;
    const c = this.cigar;
    if (!pose || !c.ready) return false;
    let lx = (cx - pose.x) / pose.s;
    let ly = (cy - pose.y) / pose.s;
    if (pose.rot) {
      const pvx = this.baseW / 2;
      const pvy = this.baseH * this.cigarCenterFrac;
      const rad = (-pose.rot * Math.PI) / 180;
      const dx = lx - pvx;
      const dy = ly - pvy;
      lx = pvx + dx * Math.cos(rad) - dy * Math.sin(rad);
      ly = pvy + dx * Math.sin(rad) + dy * Math.cos(rad);
    }
    const ix = Math.round((lx / this.baseW) * c.spaceW);
    const iy = (ly / this.baseH) * c.spaceH;
    if (ix < c.xCap || ix > c._lastBurnX) return false;
    if (ix < 0 || ix >= c.imgW) return false;
    const top = c.top[ix];
    const bottom = c.bottom[ix];
    if (top < 0) return false;
    const pad = 10;
    const y = iy - c.cigarY;
    return y >= top - pad && y <= bottom + pad;
  }

  // Ponto da brasa em coords de viewport [x, y] — hairline e fumaça ambiente
  getBurnPointViewport() {
    const pose = this.pose;
    const c = this.cigar;
    if (!pose || !c.ready) return null;
    const [sx, sy] = c.burnPoint;
    let lx = (sx / c.spaceW) * this.baseW;
    let ly = (sy / c.spaceH) * this.baseH;
    if (pose.rot) {
      const pvx = this.baseW / 2;
      const pvy = this.baseH * this.cigarCenterFrac;
      const rad = (pose.rot * Math.PI) / 180;
      const dx = lx - pvx;
      const dy = ly - pvy;
      lx = pvx + dx * Math.cos(rad) - dy * Math.sin(rad);
      ly = pvy + dx * Math.sin(rad) + dy * Math.cos(rad);
    }
    return [pose.x + lx * pose.s, pose.y + ly * pose.s];
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
    smokeBgCanvas.hidden = true;
    return;
  }

  if (window.innerWidth < 720) cigar.smoke.setPoolSize(50);

  if (reducedMotion) {
    // Sem rAF contínuo: charuto docado, redesenho estático apenas no scroll
    const cigarStage = new CigarStage(cigar);
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

  // Ordem importa: o Story estica o #story para 440vh ANTES das medições do
  // palco e da vitrine (o offsetTop do catálogo muda).
  const story = new Story(cigar);
  const cigarStage = new CigarStage(cigar);
  story.stage = cigarStage;
  const showcase = new Showcase();
  const pointer = initPointer(cigarStage, cigar);
  const smokeBg = new SmokeBackground(smokeBgCanvas, cigarStage, cigar);

  const bus = new ScrollBus();
  let elapsed = 0;

  // Um único orquestrador — ordem explícita de tick e de resize
  bus.subscribe({
    tick(state, dt) {
      elapsed += dt;
      cigar.tick(state, dt, elapsed);
      cigarStage.apply(state.scrollY);
      cigarStage.mirrorProgress(state.progress);
      pointer.tick();
      story.tick(state);
      showcase.tick(state);
      smokeBg.tick(state, dt, elapsed);
    },
    resize() {
      story.applyMode();
      cigarStage.layout();
      showcase.resize();
      smokeBg.resize();
    },
  });
  bus.start();

  // Handle de depuração/inspeção (site estático — inofensivo e útil)
  window.__cubanos = { bus, cigar, cigarStage, story, showcase, smokeBg };
}

init();
