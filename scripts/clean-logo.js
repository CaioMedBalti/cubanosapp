// Remove o vazamento de textura fora da borda arredondada de assets/cubanos_logo.png
// aplicando uma máscara alpha de retângulo arredondado do tamanho exato do canvas.
// Uso: node scripts/clean-logo.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'assets', 'cubanos_logo.png');
const OUT = path.join(__dirname, '..', 'assets', 'cubanos_logo.png');
// Medidos no arquivo original (696x700): a arte encosta nas bordas
// esquerda/topo do canvas, mas sobra uma margem cinza (tecido de fundo) nas
// bordas direita/baixo — por isso o inset é assimétrico.
const CORNER_RADIUS = 50;
const INSET_RIGHT = 14;
const INSET_BOTTOM = 16;

async function main() {
  const image = sharp(SRC);
  const { width, height } = await image.metadata();
  const maskWidth = width - INSET_RIGHT;
  const maskHeight = height - INSET_BOTTOM;

  const maskSvg = `<svg width="${width}" height="${height}">
    <rect x="0" y="0" width="${maskWidth}" height="${maskHeight}" rx="${CORNER_RADIUS}" ry="${CORNER_RADIUS}" fill="#fff"/>
  </svg>`;
  const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();

  const outBuffer = await image
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  fs.writeFileSync(OUT, outBuffer);
  console.log(`Logo limpo salvo em ${OUT} (${width}x${height}, raio ${CORNER_RADIUS}px)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
