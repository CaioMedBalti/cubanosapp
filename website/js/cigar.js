// BurningCigar: desenha o charuto num canvas 2D e o queima conforme o progresso
// da página. A silhueta é escaneada do próprio PNG (alpha), então brasa e cinza
// seguem as curvas de qualquer imagem — nada é hardcoded para uma vitola.

import { SmokeSystem } from './smoke.js';
import { clamp01, lerp, easeOutQuad } from './scroll.js';

const ALPHA_THRESHOLD = 16;
const BAND_STOP_FRACTION = 0.42; // a queima para antes da anilha
const HEADROOM_FACTOR = 2.2; // espaço acima do charuto para a fumaça subir

export class BurningCigar {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.smoke = new SmokeSystem(120);

    this.p = 0; // progresso suavizado
    this.puff = 0; // "tragada" — intensidade vinda da velocidade de scroll
    this.ready = false;

    // Cinza: acumula desde a última queda e despenca de tempos em tempos
    this._ashBase = 0;
    this._dropThresh = 20;
    this._dropT = 1;
    this._dropFrom = 0;
    this._jitterSeed = 7;

    // Degradação automática (one-way): frames lentos → menos partículas, dpr 1
    this._frameAvg = 0.016;
    this._degraded = false;

    this._idleTime = 0;
    this._skipFrame = false;
  }

  async load(srcWebp, srcPng) {
    this.img = await loadImage(srcWebp).catch(() => loadImage(srcPng));
    this._buildProfile();
    this._makeAshPattern();
    this.ready = true;
  }

  _buildProfile() {
    const { img } = this;
    const off = document.createElement('canvas');
    off.width = img.naturalWidth;
    off.height = img.naturalHeight;
    const octx = off.getContext('2d', { willReadFrequently: true });
    octx.drawImage(img, 0, 0);
    const { data } = octx.getImageData(0, 0, off.width, off.height);

    const W = off.width;
    const H = off.height;
    this.top = new Int16Array(W).fill(-1);
    this.bottom = new Int16Array(W).fill(-1);
    let xCap = W;
    let xFoot = -1;
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        if (data[(y * W + x) * 4 + 3] > ALPHA_THRESHOLD) {
          if (this.top[x] < 0) this.top[x] = y;
          this.bottom[x] = y;
        }
      }
      if (this.top[x] >= 0) {
        if (x < xCap) xCap = x;
        if (x > xFoot) xFoot = x;
      }
    }
    this.imgW = W;
    this.imgH = H;
    this.xCap = xCap;
    this.xFoot = xFoot;
    this.xBandStop = xCap + BAND_STOP_FRACTION * (xFoot - xCap);

    // Espaço de desenho: headroom para fumaça em cima, charuto embaixo
    this.spaceW = W;
    this.spaceH = Math.round(H * (1 + HEADROOM_FACTOR)) + 8;
    this.cigarY = this.spaceH - H - 8;
    this._ashBase = xFoot;
  }

  _makeAshPattern() {
    const c = document.createElement('canvas');
    c.width = c.height = 48;
    const ctx = c.getContext('2d');
    for (let i = 0; i < 260; i++) {
      const v = 150 + Math.random() * 80;
      ctx.fillStyle = `rgba(${v}, ${v - 4}, ${v - 10}, ${0.25 + Math.random() * 0.3})`;
      ctx.fillRect(Math.random() * 48, Math.random() * 48, 1.5, 1.5);
    }
    this.ashPattern = this.ctx.createPattern(c, 'repeat');
  }

  get aspect() {
    return this.spaceH / this.spaceW;
  }

  resize(cssW, cssH, dpr) {
    const d = this._degraded ? 1 : Math.min(dpr, 2);
    this.canvas.width = Math.round(cssW * d);
    this.canvas.height = Math.round(cssH * d);
    this._scale = this.canvas.width / this.spaceW;
  }

  // tick de animação completa (chamado pelo ScrollBus)
  tick(state, dt, t) {
    if (!this.ready) return;

    // Suavização independente de framerate
    this.p += (state.progress - this.p) * (1 - Math.exp(-dt * 6));
    const puffTarget = Math.min(1, state.velocity / 1500);
    this.puff = Math.max(this.puff * Math.exp(-dt * 2), puffTarget);

    // Meia-taxa quando ocioso — fumaça a 30fps é imperceptível
    const busy = this.puff > 0.02 || this.smoke.liveCount > 0;
    this._idleTime = busy ? 0 : this._idleTime + dt;
    if (this._idleTime > 3) {
      this._skipFrame = !this._skipFrame;
      if (this._skipFrame) return;
    }

    this._watchPerformance(dt);

    const burnX = this._burnX();
    this._updateAsh(burnX, dt);

    const rate = 5 + 35 * this.puff;
    this.smoke.emit(rate, dt, () => this._smokeSpawnPoint(burnX));
    this.smoke.update(dt, t);

    this.draw(burnX, t);
  }

  // Desenho estático para prefers-reduced-motion: sem partículas nem flicker
  drawStatic(progress) {
    if (!this.ready) return;
    this.p = progress;
    const burnX = this._burnX();
    this._ashLenCache = 12;
    this.draw(burnX, 0, true);
  }

  _burnX() {
    return lerp(this.xFoot, this.xBandStop, easeOutQuad(clamp01(this.p)));
  }

  _updateAsh(burnX, dt) {
    const raw = Math.min(this._ashBase - burnX, 26);
    if (this._dropT < 1) {
      this._dropT = Math.min(this._dropT + dt / 0.3, 1);
      this._ashLenCache = lerp(this._dropFrom, 4, easeOutQuad(this._dropT));
      if (this._dropT >= 1) {
        this._ashBase = burnX + 4;
        this._dropThresh = 18 + Math.random() * 8;
        this._jitterSeed = Math.random() * 100;
      }
    } else if (raw >= this._dropThresh) {
      this._dropT = 0;
      this._dropFrom = raw;
      this._ashLenCache = raw;
    } else {
      this._ashLenCache = Math.max(raw, 0);
    }
  }

  _smokeSpawnPoint(burnX) {
    const x = Math.min(Math.max(Math.round(burnX + (Math.random() - 0.5) * 8), 0), this.imgW - 1);
    const yTop = this.top[x] >= 0 ? this.top[x] : this.imgH * 0.35;
    const yMid = (this.top[x] + this.bottom[x]) / 2 || this.imgH * 0.5;
    return [burnX + (Math.random() - 0.5) * 6, this.cigarY + yTop + Math.random() * (yMid - yTop) * 0.6];
  }

  _watchPerformance(dt) {
    this._frameAvg = this._frameAvg * 0.98 + dt * 0.02;
    if (!this._degraded && this._frameAvg > 0.024) {
      this._degraded = true;
      this.smoke.setPoolSize(Math.floor(this.smoke.pool.length / 2));
      // força dpr 1 no próximo resize externo
      this.resize(this.canvas.width / (window.devicePixelRatio || 1), this.canvas.height / (window.devicePixelRatio || 1), 1);
    }
  }

  draw(burnX, t, isStatic = false) {
    const { ctx } = this;
    const s = this._scale;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.clearRect(0, 0, this.spaceW, this.spaceH);

    const bx = Math.round(burnX);
    const cy = this.cigarY;

    // 1. Corpo não queimado (crop na fonte — sem clip path)
    ctx.drawImage(this.img, 0, 0, bx, this.imgH, 0, cy, bx, this.imgH);

    // 2. Borda carbonizada: strip escura só sobre pixels do charuto
    ctx.globalCompositeOperation = 'source-atop';
    const charG = ctx.createLinearGradient(bx - 7, 0, bx, 0);
    charG.addColorStop(0, 'rgba(20, 12, 8, 0)');
    charG.addColorStop(1, 'rgba(20, 12, 8, 0.85)');
    ctx.fillStyle = charG;
    ctx.fillRect(bx - 7, cy, 7, this.imgH);
    ctx.globalCompositeOperation = 'source-over';

    // 3. Cinza agarrada à ponta
    const ashLen = this._ashLenCache || 0;
    if (ashLen > 1) this._drawAsh(bx, ashLen);

    // 4. Brasa na linha de queima
    const flicker = isStatic ? 0.5 : 0.5 + 0.5 * Math.sin(t * 7 + Math.sin(t * 13));
    const intensity = Math.min(0.55 + 0.25 * flicker + 0.6 * this.puff, 1);
    this._drawEmber(bx, intensity);

    // 5. Fumaça por cima de tudo
    if (!isStatic) this.smoke.draw(ctx, t);
  }

  _drawAsh(bx, ashLen) {
    const { ctx } = this;
    const end = Math.min(bx + ashLen, this.xFoot);
    if (end - bx < 2) return;

    ctx.beginPath();
    let started = false;
    for (let x = bx; x <= end; x += 3) {
      const xi = Math.min(Math.max(Math.round(x), 0), this.imgW - 1);
      if (this.top[xi] < 0) continue;
      // Borda direita (ponta da cinza) recuada com jitter — irregular como cinza real
      const tipT = (x - bx) / Math.max(end - bx, 1);
      const jitter = Math.sin(xi * 0.9 + this._jitterSeed) * 2;
      const inset = 2 + tipT * tipT * 3 + (tipT > 0.75 ? jitter : 0);
      const y = this.cigarY + this.top[xi] + inset;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    for (let x = end; x >= bx; x -= 3) {
      const xi = Math.min(Math.max(Math.round(x), 0), this.imgW - 1);
      if (this.bottom[xi] < 0) continue;
      const tipT = (x - bx) / Math.max(end - bx, 1);
      const jitter = Math.cos(xi * 1.1 + this._jitterSeed) * 2;
      const inset = 2 + tipT * tipT * 3 + (tipT > 0.75 ? jitter : 0);
      ctx.lineTo(x, this.cigarY + this.bottom[xi] - inset);
    }
    ctx.closePath();

    ctx.fillStyle = '#c9c2b8';
    ctx.fill();
    if (this.ashPattern) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = this.ashPattern;
      ctx.fill();
      ctx.restore();
    }
  }

  _drawEmber(bx, intensity) {
    const { ctx } = this;
    const xi = Math.min(Math.max(bx, 0), this.imgW - 1);
    const yTop = this.cigarY + (this.top[xi] >= 0 ? this.top[xi] : 0);
    const yBottom = this.cigarY + (this.bottom[xi] >= 0 ? this.bottom[xi] : this.imgH);
    const midY = (yTop + yBottom) / 2;
    const radius = (yBottom - yTop) / 2;

    ctx.globalCompositeOperation = 'lighter';

    // Anel: stripe vertical seguindo a altura da silhueta na linha de queima
    const g = ctx.createLinearGradient(bx - 6, 0, bx + 9, 0);
    g.addColorStop(0, 'rgba(180, 40, 0, 0)');
    g.addColorStop(0.35, `rgba(239, 159, 39, ${0.75 * intensity})`);
    g.addColorStop(0.55, `rgba(255, 243, 214, ${0.9 * intensity})`);
    g.addColorStop(0.8, `rgba(239, 159, 39, ${0.5 * intensity})`);
    g.addColorStop(1, 'rgba(180, 40, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx - 6, yTop - 1, 15, yBottom - yTop + 2);

    // Halo difuso ao redor da brasa
    const halo = ctx.createRadialGradient(bx, midY, 1, bx, midY, radius * 2.4);
    halo.addColorStop(0, `rgba(239, 159, 39, ${0.1 + 0.18 * this.puff})`);
    halo.addColorStop(1, 'rgba(239, 159, 39, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(bx - radius * 2.4, midY - radius * 2.4, radius * 4.8, radius * 4.8);

    ctx.globalCompositeOperation = 'source-over';
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
