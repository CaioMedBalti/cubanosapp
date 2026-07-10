// Fumaça ambiente: canvas fixo ATRÁS do conteúdo (z:1) com plumas grandes e
// lentas emanando da posição atual da brasa — "a fumaça que vem de trás".
// dpr fixo em 1: blobs difusos não precisam de retina.

import { SmokeSystem } from './smoke.js';

const BIG_OPTS = {
  sizeMin: 26,
  sizeMax: 52,
  lifeMin: 6,
  lifeMax: 10,
  alphaMax: 0.16,
  riseMin: 14,
  riseMax: 30,
  drift: 26,
  buoyancy: 6,
  growth: 2,
};

export class SmokeBackground {
  constructor(canvas, stage, cigar) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stage = stage;
    this.cigar = cigar;
    this.smoke = new SmokeSystem(56, BIG_OPTS);
    this.enabled = false;
    this._degradedApplied = false;
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

    // Acompanha a degradação one-way do charuto
    if (this.cigar.degraded && !this._degradedApplied) {
      this._degradedApplied = true;
      this.smoke.setPoolSize(28);
    }

    const pt = this.stage.getBurnPointViewport();
    if (pt) {
      const rate = 6 + 14 * this.cigar.heat;
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
