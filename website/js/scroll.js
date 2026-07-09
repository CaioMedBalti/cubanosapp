// ScrollBus: um listener passivo + um rAF; subscribers recebem (state, dt).
// Nenhum subscriber deve ler layout — offsets são cacheados aqui.

export class ScrollBus {
  constructor() {
    this.subs = [];
    this.state = {
      scrollY: 0,
      progress: 0, // 0..1 do documento inteiro
      velocity: 0, // px/s (valor absoluto)
      vh: window.innerHeight,
      vw: window.innerWidth,
    };
    this._dirty = true;
    this._lastScrollY = 0;
    this._lastT = performance.now();
    this._raf = 0;
    this._running = false;

    window.addEventListener('scroll', () => (this._dirty = true), { passive: true });
    window.addEventListener('resize', () => {
      this.state.vh = window.innerHeight;
      this.state.vw = window.innerWidth;
      this._dirty = true;
      for (const s of this.subs) s.resize?.(this.state);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._stop();
      else this._start();
    });
  }

  subscribe(sub) {
    this.subs.push(sub);
  }

  _tick = (now) => {
    this._raf = requestAnimationFrame(this._tick);
    // Clampa dt para a volta de aba não teleportar partículas
    const dt = Math.min((now - this._lastT) / 1000, 0.05);
    this._lastT = now;

    const doc = document.scrollingElement;
    if (this._dirty) {
      this.state.scrollY = window.scrollY;
      const max = doc.scrollHeight - this.state.vh;
      this.state.progress = max > 0 ? Math.min(Math.max(this.state.scrollY / max, 0), 1) : 0;
      this._dirty = false;
    }

    const dv = Math.abs(this.state.scrollY - this._lastScrollY);
    this.state.velocity = dt > 0 ? dv / dt : 0;
    this._lastScrollY = this.state.scrollY;

    for (const s of this.subs) s.tick(this.state, dt);
  };

  _start() {
    if (this._running) return;
    this._running = true;
    this._lastT = performance.now();
    this._raf = requestAnimationFrame(this._tick);
  }

  _stop() {
    this._running = false;
    cancelAnimationFrame(this._raf);
  }

  start() {
    this._start();
  }
}

export const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
