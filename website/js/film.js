// FilmScrub: o vídeo do charuto queimando como fundo fullscreen, scrubado
// pelo scroll. Não usa <video> — desenha frames webp pré-extraídos num canvas
// (rewind suave, sem depender de keyframes de codec). Carregamento progressivo:
// poster → conjunto grosso (1 a cada 6) → resto em idle.

import { clamp01 } from './scroll.js';

const COARSE_STEP = 6;

export class FilmScrub {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.meta = null; // { w, h, points } de ember.json
    this.frames = []; // Image | null por índice
    this.n = 0;
    this._idx = 0; // índice fracionário suavizado
    this._drawn = -1; // último frame efetivamente desenhado
    this._poster = null;
    this._fullLoad = false;
    this.mobile = false;
    this.ready = false;
    this._cover = { s: 1, dx: 0, dy: 0 };
  }

  // Resolve true se o filme está utilizável (ember.json + poster carregados)
  async load() {
    try {
      const res = await fetch('/assets/film/ember.json');
      if (!res.ok) throw new Error(String(res.status));
      this.meta = await res.json();
      this.n = this.meta.points.length;
      this.frames = new Array(this.n).fill(null);
      this._poster = await loadImage('/assets/film/poster.webp');
    } catch {
      this.canvas.hidden = true;
      return false;
    }

    this.ready = true;
    this.resize();
    this._draw(this._poster);

    // Mobile fica só no poster (dados); desktop carrega os frames
    if (!this.mobile) this._startLoad();
    return true;
  }

  _startLoad() {
    if (this._loadStarted) return;
    this._loadStarted = true;
    this._loadFrames();
  }

  _frameUrl(i) {
    return `/assets/film/f-${String(i).padStart(3, '0')}.webp`;
  }

  async _loadFrames() {
    const saveData = navigator.connection?.saveData === true;
    const coarse = [];
    for (let i = 0; i < this.n; i += COARSE_STEP) coarse.push(i);
    if (!coarse.includes(this.n - 1)) coarse.push(this.n - 1);

    // Conjunto grosso primeiro (scrub funcional em ~1MB), em lotes de 8
    await this._loadSet(coarse, 8);
    if (saveData) return;

    const rest = [];
    for (let i = 0; i < this.n; i++) if (!this.frames[i]) rest.push(i);
    await this._loadSet(rest, 4);
    this._fullLoad = true;
  }

  async _loadSet(indices, batch) {
    for (let i = 0; i < indices.length; i += batch) {
      await Promise.all(
        indices.slice(i, i + batch).map(async (idx) => {
          try {
            this.frames[idx] = await loadImage(this._frameUrl(idx));
          } catch {
            /* frame perdido — o vizinho cobre */
          }
        }),
      );
    }
  }

  resize() {
    this.mobile = window.innerWidth < 720;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (!this.meta) return;
    // Cover-fit: crop central sem distorção
    const s = Math.max(this.canvas.width / this.meta.w, this.canvas.height / this.meta.h);
    this._cover = {
      s,
      dx: (this.canvas.width - this.meta.w * s) / 2,
      dy: (this.canvas.height - this.meta.h * s) / 2,
    };
    this._drawn = -1; // força redesenho no próximo tick
    if (this.ready && this.mobile) this._draw(this._poster);
    // Virou desktop depois de carregar como mobile (rotação/resize)
    if (this.ready && !this.mobile) this._startLoad();
  }

  // Frame carregado mais próximo do alvo — nunca espera rede
  _nearestLoaded(target) {
    if (this.frames[target]) return target;
    for (let d = 1; d < this.n; d++) {
      if (target - d >= 0 && this.frames[target - d]) return target - d;
      if (target + d < this.n && this.frames[target + d]) return target + d;
    }
    return -1;
  }

  tick(state, dt) {
    if (!this.ready || this.mobile) return;
    const target = state.progress * (this.n - 1);
    // Leve inércia — saltos de scroll viram avanço cinematográfico
    this._idx += (target - this._idx) * (1 - Math.exp(-dt * 10));
    if (Math.abs(target - this._idx) < 0.5) this._idx = target;

    const i = this._nearestLoaded(Math.round(this._idx));
    if (i < 0 || i === this._drawn) return;
    this._drawn = i;
    this._draw(this.frames[i]);
  }

  _draw(img) {
    if (!img) return;
    const { s, dx, dy } = this._cover;
    this.ctx.drawImage(img, dx, dy, this.meta.w * s, this.meta.h * s);
  }

  // Ponto da brasa em coords de viewport [x, y] — fumaça, hairline, hover
  getEmberViewport() {
    if (!this.ready) return null;
    const i = Math.min(Math.max(Math.round(this._idx), 0), this.n - 1);
    const p = this.meta.points[this.mobile ? 0 : i];
    const { s, dx, dy } = this._cover;
    return [dx + p[0] * s, dy + p[1] * s];
  }

  // Segmento aproximado do charuto em viewport {x1,y1,x2,y2} para o hit test:
  // da ponta fria (além do alcance máximo da brasa) até a brasa atual.
  getCigarSegmentViewport() {
    const ember = this.getEmberViewport();
    if (!ember) return null;
    const pts = this.meta.points;
    const first = pts[0];
    const last = pts[this.n - 1];
    // A brasa anda first→last; a ponta fria fica ~35% do percurso além do fim
    const coldX = last[0] + (last[0] - first[0]) * 0.35;
    const coldY = last[1] + (last[1] - first[1]) * 0.35;
    const { s, dx, dy } = this._cover;
    return { x1: dx + coldX * s, y1: dy + coldY * s, x2: ember[0], y2: ember[1] };
  }

  // Desenho estático por progresso (prefers-reduced-motion)
  drawStatic(progress) {
    if (!this.ready || this.mobile) return;
    this._idx = clamp01(progress) * (this.n - 1);
    const i = this._nearestLoaded(Math.round(this._idx));
    if (i < 0 || i === this._drawn) return;
    this._drawn = i;
    this._draw(this.frames[i]);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
