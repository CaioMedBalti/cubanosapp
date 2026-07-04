// Recuperação pontual (2026-07-04): um script de compressão anterior derrubou
// o canal alpha de todo assets/charutos/, expondo o xadrez cinza que estava
// gravado nos pixels RGB desde a geração original no Gemini (ver
// RENAMING_LOG.txt). Este script refaz a segmentação de fundo: classifica
// cada pixel como "tipo fundo" (acinzentado + claro — cobre as duas cores do
// xadrez de uma vez, não uma cor fixa) e usa flood-fill a partir da borda
// como conectividade, preservando qualquer elemento escuro/saturado dentro
// do charuto (bandas, texto) mesmo que fique parecido com fundo.
// Uso: node scripts/recover-alpha.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'assets', 'charutos');
const SATURATION_MAX = 18;
const LIGHTNESS_MIN = 140;

function isBackgroundLike(r, g, b) {
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  return maxC - minC < SATURATION_MAX && (r + g + b) / 3 > LIGHTNESS_MIN;
}

async function recoverAlpha(buffer) {
  const { data, info } = await sharp(buffer).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const bgClass = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    bgClass[i] = isBackgroundLike(data[idx], data[idx + 1], data[idx + 2]) ? 1 : 0;
  }

  const isBackground = new Uint8Array(width * height);
  const visited = new Uint8Array(width * height);
  const stack = [];

  for (let x = 0; x < width; x++) stack.push([x, 0], [x, height - 1]);
  for (let y = 0; y < height; y++) stack.push([0, y], [width - 1, y]);

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const idx1d = y * width + x;
    if (visited[idx1d]) continue;
    visited[idx1d] = 1;
    if (!bgClass[idx1d]) continue;

    isBackground[idx1d] = 1;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  for (let i = 0; i < width * height; i++) {
    if (isBackground[i]) data[i * channels + 3] = 0;
  }

  const bgCount = isBackground.reduce((a, b) => a + b, 0);
  const bgPct = (100 * bgCount) / (width * height);

  const outBuffer = await sharp(data, { raw: { width, height, channels } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return { outBuffer, bgPct };
}

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.png'));

  for (const file of files) {
    const fullPath = path.join(DIR, file);
    const buffer = fs.readFileSync(fullPath);
    const before = buffer.length;

    const { outBuffer, bgPct } = await recoverAlpha(buffer);
    fs.writeFileSync(fullPath, outBuffer);

    const outMeta = await sharp(outBuffer).metadata();
    const flag = bgPct < 15 ? '  <-- REVISAR (fundo detectado baixo)' : '';
    console.log(
      `${file}: fundo ${bgPct.toFixed(1)}% | hasAlpha=${outMeta.hasAlpha} | ${(before / 1024).toFixed(0)}KB -> ${(outBuffer.length / 1024).toFixed(0)}KB${flag}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
