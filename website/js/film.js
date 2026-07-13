// FilmScrub: o vídeo do charuto queimando como fundo fullscreen, scrubado
// pelo scroll. Não usa <video> — desenha frames webp pré-extraídos num canvas
// (rewind suave, sem depender de keyframes de codec).
//
// Fluidez: CROSS-FADE entre os dois frames carregados vizinhos do índice
// fracionário — o degrau entre frames desaparece e conjuntos esparsos (mobile
// carrega só 1 a cada 6) continuam parecendo contínuos.
// Nitidez: canvas em device pixels (dpr ≤ 2) — sem o borrão de esticamento.
// Carga: poster → conjunto grosso (todos os breakpoints) → fino (só desktop);
// saveData fica no poster.

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
    this._lastDraw = ''; // chave do último par desenhado (evita redraws)
    this._poster = null;
    this.mobile = false;
    this.ready = false;
    this._dpr = 1;
    this._cover = { s: 1, dx: 0, dy: 0 }; // em device px
    this._loading = false;
    this._coarseDone = false;
    this._fineStarted = false;
    this._saveData = navigator.connection?.saveData === true;
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
    if (!this._saveData) this._loadCoarse();
    return true;
  }

  _frameUrl(i) {
    return `/assets/film/f-${String(i).padStart(3, '0')}.webp`;
  }

  // Conjunto grosso (1 a cada 6 ≈ 1MB): scrub funcional em qualquer tela
  async _loadCoarse() {
    if (this._loading) return;
    this._loading = true;
    const coarse = [];
    for (let i = 0; i < this.n; i += COARSE_STEP) coarse.push(i);
    if (!coarse.includes(this.n - 1)) coarse.push(this.n - 1);
    await this._loadSet(coarse, 8);
    this._coarseDone = true;
    this._maybeLoadFine();
  }

  // O conjunto completo só no desktop (mobile fica no grosso + crossfade)
  _maybeLoadFine() {
    if (!this._coarseDone || this._fineStarted || this.mobile || this._saveData) return;
    this._fineStarted = true;
    (async () => {
      const rest = [];
      for (let i = 0; i < this.n; i++) if (!this.frames[i]) rest.push(i);
      await this._loadSet(rest, 4);
    })();
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
    this._dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.round(w * this._dpr);
    this.canvas.height = Math.round(h * this._dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    if (!this.meta) return;
    // Cover-fit em device px: crop central sem distorção
    const s = Math.max(this.canvas.width / this.meta.w, this.canvas.height / this.meta.h);
    this._cover = {
      s,
      dx: (this.canvas.width - this.meta.w * s) / 2,
      dy: (this.canvas.height - this.meta.h * s) / 2,
    };
    this._lastDraw = '';
    if (this.ready) this._redraw();
    this._maybeLoadFine(); // rotação mobile→desktop completa o conjunto
  }

  // Frame carregado mais próximo numa direção (-1 para trás, +1 para frente)
  _loadedFrom(start, dir) {
    for (let i = start; i >= 0 && i < this.n; i += dir) {
      if (this.frames[i]) return i;
    }
    return -1;
  }

  tick(state, dt) {
    if (!this.ready) return;
    const target = state.progress * (this.n - 1);
    // Leve inércia — saltos de scroll viram avanço cinematográfico
    this._idx += (target - this._idx) * (1 - Math.exp(-dt * 10));
    if (Math.abs(target - this._idx) < 0.02) this._idx = target;
    this._redraw();
  }

  _redraw() {
    // Vizinhos CARREGADOS ao redor do índice — crossfade proporcional entre
    // eles cobre tanto o passo de 1 frame quanto os buracos do conjunto grosso
    const lo = this._loadedFrom(Math.floor(this._idx), -1);
    const hi = this._loadedFrom(Math.ceil(this._idx), 1);
    if (lo < 0 && hi < 0) {
      if (this._poster && this._lastDraw !== 'poster') {
        this._draw(this._poster, 1);
        this._lastDraw = 'poster';
      }
      return;
    }
    const i0 = lo >= 0 ? lo : hi;
    const i1 = hi >= 0 ? hi : lo;
    const a = i1 > i0 ? clamp01((this._idx - i0) / (i1 - i0)) : 0;
    const a64 = Math.round(a * 64); // quantiza p/ não redesenhar à toa
    const key = `${i0}:${i1}:${a64}`;
    if (key === this._lastDraw) return;
    this._lastDraw = key;
    this._draw(this.frames[i0], 1);
    if (i1 !== i0 && a64 > 0) this._draw(this.frames[i1], a64 / 64);
  }

  _draw(img, alpha) {
    const { s, dx, dy } = this._cover;
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(img, dx, dy, this.meta.w * s, this.meta.h * s);
    this.ctx.globalAlpha = 1;
  }

  // Ponto da brasa em coords CSS de viewport [x, y] — faíscas, hairline, hover
  getEmberViewport() {
    if (!this.ready) return null;
    const i = Math.min(Math.max(Math.round(this._idx), 0), this.n - 1);
    const p = this.meta.points[i];
    const { s, dx, dy } = this._cover;
    return [(dx + p[0] * s) / this._dpr, (dy + p[1] * s) / this._dpr];
  }

  // Segmento aproximado do charuto em coords CSS {x1,y1,x2,y2} para o hit
  // test: da ponta fria (além do alcance máximo da brasa) até a brasa atual.
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
    return {
      x1: (dx + coldX * s) / this._dpr,
      y1: (dy + coldY * s) / this._dpr,
      x2: ember[0],
      y2: ember[1],
    };
  }

  // Desenho estático por progresso (prefers-reduced-motion)
  drawStatic(progress) {
    if (!this.ready) return;
    this._idx = clamp01(progress) * (this.n - 1);
    this._redraw();
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
