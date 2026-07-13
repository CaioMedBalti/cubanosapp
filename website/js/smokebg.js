// Fumaça ambiente: canvas fixo ATRÁS do conteúdo (z:2, sobre o filme) com
// plumas grandes e lentas emanando da brasa — "a fumaça que vem de trás".
// dpr fixo em 1: blobs difusos não precisam de retina.

import { SmokeSystem } from './smoke.js';

const BIG_OPTS = {
  sizeMin: 26,
  sizeMax: 52,
  lifeMin: 7,
  lifeMax: 11,
  alphaMax: 0.15,
  riseMin: 12,
  riseMax: 26,
  drift: 18,
  buoyancy: 5,
  growth: 2,
  noiseScale: 0.0028, // volutas largas para as plumas grandes
  noiseForce: 42,
  drag: 0.5,
};

export class SmokeBackground {
  constructor(canvas, film, fx) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.film = film;
    this.fx = fx;
    this.smoke = new SmokeSystem(56, BIG_OPTS);
    this.enabled = false;
    this._wasEmpty = true;
    this.resize();
  }

  resize() {
    this.enabled = window.innerWidth >= 720;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (!this.enabled) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this._wasEmpty = true;
    }
  }

  tick(state, dt, t) {
    if (!this.enabled) return;

    const pt = this.film.getEmberViewport();
    // Sem taxa de base: o vídeo já carrega fumaça real. Plumas grandes só
    // reforçam quando há calor de verdade (scroll rápido, hover, tragada).
    if (pt && this.fx.heat > 0.03) {
      const rate = 14 * this.fx.heat;
      this.smoke.emit(rate, dt, () => [
        pt[0] + (Math.random() - 0.5) * 60,
        pt[1] + (Math.random() - 0.5) * 24,
      ]);
    }

    const empty = this.smoke.liveCount === 0;
    if (empty && this._wasEmpty) return; // nada vivo e canvas já limpo
    this.smoke.update(dt, t);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.smoke.draw(this.ctx, t);
    this._wasEmpty = empty;
  }
}
