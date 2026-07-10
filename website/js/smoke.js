// Fumaça: pool fixo de partículas, sprite radial pré-renderizado, blend 'lighter'.
// Zero alocação por frame — structs recicladas por índice.
// `opts` permite variar o caráter (fumaça de ponta vs plumas grandes de fundo).

const DEFAULTS = {
  sizeMin: 6,
  sizeMax: 11,
  lifeMin: 3,
  lifeMax: 4.8,
  alphaMax: 0.4,
  riseMin: 45,
  riseMax: 90,
  drift: 16,
  buoyancy: 30,
  growth: 3,
};

export class SmokeSystem {
  constructor(poolSize = 120, opts = {}) {
    this.opts = { ...DEFAULTS, ...opts };
    this.pool = Array.from({ length: poolSize }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, size0: 6, seed: 0, alive: false,
    }));
    this._acc = 0;
    this.sprite = this._makeSprite();
  }

  _makeSprite() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(216, 205, 190, 0.55)');
    g.addColorStop(0.5, 'rgba(190, 180, 168, 0.22)');
    g.addColorStop(1, 'rgba(180, 170, 160, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return c;
  }

  setPoolSize(n) {
    this.pool.length = Math.min(this.pool.length, n);
  }

  _spawn(samplePoint) {
    const o = this.opts;
    const p = this.pool.find((q) => !q.alive);
    if (!p) return false;
    const [x, y] = samplePoint();
    p.x = x;
    p.y = y;
    p.vx = (Math.random() - 0.5) * o.drift;
    p.vy = -(o.riseMin + Math.random() * (o.riseMax - o.riseMin));
    p.age = 0;
    p.life = o.lifeMin + Math.random() * (o.lifeMax - o.lifeMin);
    p.size0 = o.sizeMin + Math.random() * (o.sizeMax - o.sizeMin);
    p.seed = Math.random() * 20;
    p.alive = true;
    return true;
  }

  // rate em partículas/s; (x, y) função que sorteia o ponto de spawn
  emit(rate, dt, samplePoint) {
    this._acc += rate * dt;
    while (this._acc >= 1) {
      this._acc -= 1;
      if (!this._spawn(samplePoint)) break;
    }
  }

  // Rajada imediata (a "tragada" do click) — ignora o acumulador
  burst(n, samplePoint) {
    for (let i = 0; i < n; i++) {
      if (!this._spawn(samplePoint)) break;
    }
  }

  update(dt, t) {
    const o = this.opts;
    for (const p of this.pool) {
      if (!p.alive) continue;
      p.age += dt;
      if (p.age >= p.life) {
        p.alive = false;
        continue;
      }
      // Empuxo + turbulência trigonométrica barata (sem Perlin)
      p.vy -= o.buoyancy * dt;
      p.vx += (Math.sin(t * 1.7 + p.seed) * 14 + Math.sin(t * 3.1 + p.seed * 2.3) * 7) * dt;
      p.vx *= 1 - 0.4 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx, t) {
    const o = this.opts;
    const prevOp = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.pool) {
      if (!p.alive) continue;
      const ageT = p.age / p.life;
      // entra suave, sai quadrático
      const fadeIn = Math.min(ageT / 0.15, 1);
      const alpha = o.alphaMax * fadeIn * (1 - ageT) * (1 - ageT);
      if (alpha <= 0.01) continue;
      const scale = p.size0 * (1 + o.growth * ageT);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.seed + t * 0.3);
      ctx.drawImage(this.sprite, -scale, -scale, scale * 2, scale * 2);
      ctx.restore();
    }
    ctx.globalCompositeOperation = prevOp;
  }

  get liveCount() {
    let n = 0;
    for (const p of this.pool) if (p.alive) n++;
    return n;
  }
}
