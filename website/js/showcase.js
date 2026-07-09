// Catálogo pinned: a seção tem 320vh; o inner é sticky e a estante desliza
// horizontalmente conforme o progresso local da seção.

import { clamp01 } from './scroll.js';

export class Showcase {
  constructor() {
    this.section = document.getElementById('catalogo');
    this.track = document.getElementById('shelf-track');
    this.section.classList.add('is-anim');
    this._measure();
  }

  _measure() {
    this.top = this.section.offsetTop;
    this.height = this.section.offsetHeight;
    this.trackW = this.track.scrollWidth;
  }

  resize() {
    this._measure();
  }

  tick(state) {
    const local = clamp01((state.scrollY - this.top) / (this.height - state.vh));
    const maxShift = Math.max(this.trackW - state.vw, 0);
    this.track.style.transform = `translate3d(${(-local * maxShift).toFixed(1)}px, 0, 0)`;
  }
}
