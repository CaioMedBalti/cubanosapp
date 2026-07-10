// Perlin gradient noise 3D (Ken Perlin improved) + curl 2D animado no tempo.
// Sem dependências. O campo de curl é livre de divergência — advecta as
// partículas de fumaça em volutas orgânicas, em vez de espalhá-las no random.

const P = new Uint8Array(512);
(function seed() {
  const perm = [...Array(256).keys()];
  let s = 1337;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
})();

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + t * (b - a);

function grad(hash, x, y, z) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export function perlin3(x, y, z) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = P[X] + Y;
  const AA = P[A] + Z;
  const AB = P[A + 1] + Z;
  const B = P[X + 1] + Y;
  const BA = P[B] + Z;
  const BB = P[B + 1] + Z;
  return lerp(
    lerp(
      lerp(grad(P[AA], x, y, z), grad(P[BA], x - 1, y, z), u),
      lerp(grad(P[AB], x, y - 1, z), grad(P[BB], x - 1, y - 1, z), u),
      v,
    ),
    lerp(
      lerp(grad(P[AA + 1], x, y, z - 1), grad(P[BA + 1], x - 1, y, z - 1), u),
      lerp(grad(P[AB + 1], x, y - 1, z - 1), grad(P[BB + 1], x - 1, y - 1, z - 1), u),
      v,
    ),
    w,
  );
}

// Velocidade de curl (∂ψ/∂y, -∂ψ/∂x) de um potencial escalar Perlin —
// resultado ~[-1, 1] em cada eixo. x/y já vêm escalados; z é o tempo.
const E = 0.5;
export function curl2(x, y, z) {
  const a = (perlin3(x, y + E, z) - perlin3(x, y - E, z)) / (2 * E);
  const b = (perlin3(x + E, y, z) - perlin3(x - E, y, z)) / (2 * E);
  return [a, -b];
}
