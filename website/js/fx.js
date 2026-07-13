// Fx: camada de efeitos ACIMA do conteúdo (z:30) — fumaça de 1º plano,
// faíscas e halo pulsante da brasa, tudo ancorado no ponto da brasa do filme.
// A fumaça só é emitida ao scrollar PARA BAIXO (o rewind do vídeo não deve
// mostrar fumaça "voltando"); flare (tragada/painel) e warmth (hover) somam.

import { SmokeSystem } from './smoke.js';
import { perlin3 } from './noise.js';

const FG_OPTS = {
  sizeMin: 8,
  sizeMax: 15,
  lifeMin: 3.4,
  lifeMax: 5.2,
  alphaMax: 0.38,
  riseMin: 40,
  riseMax: 80,
  drift: 6,
  buoyancy: 26,
  growth: 3,
  noiseScale: 0.006,
  noiseForce: 62,
  drag: 0.9,
};

export class Fx {
  constructor(canvas, film) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.film = film;
    this.smoke = new SmokeSystem(110, FG_OPTS);
    this._sparks = Array.from({ length: 28 }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, alive: false,
    }));
    this._flare = 0;
    this.warmth = 0;
    this._warmthTarget = 0;
    this.puff = 0; // "calor de leitura": velocidade de descida suavizada
    this._prevY = null;
    this._wasEmpty = true;
    this.enabled = false;
    this.resize();
  }

  resize() {
    this.enabled = window.innerWidth >= 720;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this._wasEmpty = true;
  }

  // Surto de brasa (~1.2s): tragada (click) ou painel do story tocando a brasa
  flare(strength = 1) {
    this._flare = Math.min(1, Math.max(this._flare, strength));
    this._emitSparks(3 + Math.round(strength * 5));
  }

  setWarmth(v) {
    this._warmthTarget = v;
  }

  get heat() {
    return Math.min(this.puff + this._flare + 0.35 * this.warmth, 1);
  }

  // Rajada de fumaça na brasa (a "tragada" do click)
  burstAtEmber(n) {
    const pt = this.film.getEmberViewport();
    if (!pt) return;
    this.smoke.burst(n, () => [pt[0] + (Math.random() - 0.5) * 10, pt[1] + (Math.random() - 0.5) * 8]);
  }

  _emitSparks(n) {
    const pt = this.film.getEmberViewport();
    if (!pt) return;
    for (let i = 0; i < n; i++) {
      const s = this._sparks.find((q) => !q.alive);
      if (!s) break;
      s.x = pt[0] + (Math.random() - 0.5) * 8;
      s.y = pt[1] + (Math.random() - 0.5) * 10;
      s.vx = (Math.random() - 0.5) * 40;
      s.vy = -(50 + Math.random() * 90);
      s.age = 0;
      s.life = 0.5 + Math.random() * 0.7;
      s.alive = true;
    }
  }

  tick(state, dt, t) {
    if (!this.enabled) return;

    // Direção do scroll: só a descida "acende" (dy > 0)
    const dy = this._prevY === null ? 0 : state.scrollY - this._prevY;
    this._prevY = state.scrollY;
    const downV = dy > 0 && dt > 0 ? dy / dt : 0;
    const puffTarget = Math.min(1, downV / 1500);
    this.puff = Math.max(this.puff * Math.exp(-dt * 2), puffTarget);

    // Flare decai em ~1.2s; warmth persegue o alvo (sobe rápido, desce suave)
    this._flare *= Math.exp(-dt / 0.45);
    const wTau = this._warmthTarget > this.warmth ? 0.25 : 0.5;
    this.warmth += (this._warmthTarget - this.warmth) * (1 - Math.exp(-dt / wTau));

    const pt = this.film.getEmberViewport();
    if (pt) {
      const rate = 2 + 40 * this.puff + 25 * this._flare + 15 * this.warmth;
      this.smoke.emit(rate, dt, () => [pt[0] + (Math.random() - 0.5) * 8, pt[1] + (Math.random() - 0.5) * 6]);
      // Trickle de faíscas com a brasa bem quente
      if (this.heat > 0.4 && Math.random() < this.heat * 0.35) this._emitSparks(1);
    }

    this.smoke.update(dt, t);
    this._updateSparks(dt);

    const hasHalo = pt && this.heat > 0.03;
    const empty = this.smoke.liveCount === 0 && !this._sparks.some((s) => s.alive) && !hasHalo;
    if (empty && this._wasEmpty) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (hasHalo) this._drawHalo(pt, t);
    this._drawSparks();
    this.smoke.draw(this.ctx, t);
    this._wasEmpty = empty;
  }

  // Halo quente pulsante sobre a brasa do vídeo — dá vida quando o scroll para
  _drawHalo(pt, t) {
    const { ctx } = this;
    const flicker = 0.55 + 0.22 * Math.sin(t * 7) + 0.13 * Math.sin(t * 17 + 1.3) + 0.1 * perlin3(t * 1.4, 3.2, 0);
    const a = (0.10 + 0.30 * this.heat) * (0.7 + 0.3 * flicker);
    const r = 26 + 34 * this.heat + 6 * flicker;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(pt[0], pt[1], 1, pt[0], pt[1], r);
    g.addColorStop(0, `rgba(255, 170, 60, ${a})`);
    g.addColorStop(0.5, `rgba(239, 110, 25, ${a * 0.45})`);
    g.addColorStop(1, 'rgba(239, 110, 25, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(pt[0] - r, pt[1] - r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'source-over';
  }

  _updateSparks(dt) {
    for (const s of this._sparks) {
      if (!s.alive) continue;
      s.age += dt;
      if (s.age >= s.life) {
        s.alive = false;
        continue;
      }
      s.vy += 70 * dt; // gravidade puxa a faísca de volta
      s.vx *= 1 - 0.8 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
  }

  _drawSparks() {
    const { ctx } = this;
    let any = false;
    for (const s of this._sparks) {
      if (!s.alive) continue;
      if (!any) {
        ctx.globalCompositeOperation = 'lighter';
        any = true;
      }
      const at = s.age / s.life;
      const a = 1 - at;
      const r = 1 + 1.5 * a;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2.4);
      g.addColorStop(0, `rgba(255, ${(235 - at * 120) | 0}, ${(185 - at * 165) | 0}, ${0.9 * a})`);
      g.addColorStop(1, 'rgba(255, 60, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(s.x - r * 2.4, s.y - r * 2.4, r * 4.8, r * 4.8);
    }
    if (any) ctx.globalCompositeOperation = 'source-over';
  }
}
