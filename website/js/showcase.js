// Catálogo: no desktop a seção pina (260vh) e a estante desliza na horizontal
// conforme o progresso local; no mobile é uma faixa nativa com scroll-snap —
// swipe livre, sem sequestrar o scroll da página.

import { clamp01 } from './scroll.js';

export class Showcase {
  constructor() {
    this.section = document.getElementById('catalogo');
    this.track = document.getElementById('shelf-track');
    this.enabled = false;
    this.applyMode();
  }

  applyMode() {
    const want = window.innerWidth >= 720;
    if (want !== this.enabled) {
      this.enabled = want;
      this.section.classList.toggle('is-anim', want);
      if (!want) this.track.style.transform = '';
    }
    this._measure();
  }

  _measure() {
    this.top = this.section.offsetTop;
    this.height = this.section.offsetHeight;
    this.trackW = this.track.scrollWidth;
  }

  resize() {
    this.applyMode();
  }

  tick(state) {
    if (!this.enabled) return;
    const local = clamp01((state.scrollY - this.top) / (this.height - state.vh));
    const maxShift = Math.max(this.trackW - state.vw, 0);
    this.track.style.transform = `translate3d(${(-local * maxShift).toFixed(1)}px, 0, 0)`;
  }
}
