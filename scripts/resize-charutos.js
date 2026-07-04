// Redimensiona/comprime PNGs em assets/charutos/ antes de commitar — mantém
// nome de arquivo e transparência (alpha) intactos, só reduz dimensão/peso.
// Uso: node scripts/resize-charutos.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'assets', 'charutos');
const MAX_DIM = 1024;

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.png'));
  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const fullPath = path.join(DIR, file);
    const before = fs.statSync(fullPath).size;
    totalBefore += before;

    const buffer = fs.readFileSync(fullPath);
    const image = sharp(buffer);
    const metadata = await image.metadata();

    let pipeline = image;
    if (metadata.width > MAX_DIM || metadata.height > MAX_DIM) {
      pipeline = pipeline.resize(MAX_DIM, MAX_DIM, { fit: 'inside', withoutEnlargement: true });
    }
    // Sem `palette: true` — quantização por paleta já derrubou o canal alpha
    // silenciosamente numa leva anterior (nada acusava erro, só perdia a
    // transparência). compressionLevel:9 sozinho já reduz bastante o peso
    // sem esse risco.
    const outBuffer = await pipeline
      .ensureAlpha()
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();

    // Trava de segurança: se a origem tinha alpha real e a saída não tem,
    // aborta em vez de sobrescrever silenciosamente.
    if (metadata.hasAlpha) {
      const outMeta = await sharp(outBuffer).metadata();
      if (!outMeta.hasAlpha) {
        throw new Error(`ABORTADO: ${file} tinha alpha e a saída não tem. Nada foi sobrescrito.`);
      }
    }

    // Só sobrescreve se realmente ficou menor — evita regressão em arquivos já pequenos.
    if (outBuffer.length < before) {
      fs.writeFileSync(fullPath, outBuffer);
    }
    totalAfter += fs.statSync(fullPath).size;

    console.log(
      `${file}: ${(before / 1024 / 1024).toFixed(2)}MB -> ${(fs.statSync(fullPath).size / 1024 / 1024).toFixed(2)}MB (${metadata.width}x${metadata.height})`,
    );
  }

  console.log('---');
  console.log(`Total: ${(totalBefore / 1024 / 1024).toFixed(1)}MB -> ${(totalAfter / 1024 / 1024).toFixed(1)}MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
