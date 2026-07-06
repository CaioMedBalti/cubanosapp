// Gera os assets de ícone/splash a partir do logo limpo (assets/cubanos_logo.png).
// Uso: node scripts/generate-icons.js
const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');
const LOGO = path.join(ASSETS, 'cubanos_logo.png');
const BG = '#0d0a08';

async function squareCanvas(inputBuffer, size, { flatten, padPct = 0 } = {}) {
  const pad = Math.round(size * padPct);
  const inner = size - pad * 2;
  let pipeline = sharp(inputBuffer).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  if (flatten) pipeline = pipeline.flatten({ background: BG });
  const resized = await pipeline.png().toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: flatten ? BG : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function main() {
  const logoBuffer = await sharp(LOGO).toBuffer();

  // Ícone principal (iOS/generic) — opaco, sem transparência.
  const icon = await squareCanvas(logoBuffer, 1024, { flatten: true });
  await sharp(icon).toFile(path.join(ASSETS, 'icon.png'));

  // Favicon web — opaco, menor.
  const favicon = await squareCanvas(logoBuffer, 256, { flatten: true });
  await sharp(favicon).toFile(path.join(ASSETS, 'favicon.png'));

  // Splash — transparente, o SplashScreen já compõe sobre backgroundColor.
  const splash = await squareCanvas(logoBuffer, 1024, { flatten: false });
  await sharp(splash).toFile(path.join(ASSETS, 'splash-icon.png'));

  // Adaptive icon (Android) — transparente, com margem de segurança pro
  // recorte circular/squircle que o launcher aplica por cima.
  const adaptiveFg = await squareCanvas(logoBuffer, 1024, { flatten: false, padPct: 0.11 });
  await sharp(adaptiveFg).toFile(path.join(ASSETS, 'android-icon-foreground.png'));

  console.log('Ícones gerados: icon.png, favicon.png, splash-icon.png, android-icon-foreground.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
