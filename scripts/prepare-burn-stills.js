// Converte uma sequência de FOTOS do charuto em estágios progressivos de
// queima (geradas por IA em alta resolução) nos frames que o site scruba:
//   website/assets/film/f-000.webp … f-0NN.webp  (1920w, q88)
//   website/assets/film/poster.webp              (primeira foto, q92)
//   website/assets/film/ember.json               (posição da brasa por foto)
//
// Uso:  node scripts/prepare-burn-stills.js [--src <dir>]
//       (default: assets/stills/ — arquivos burn-*.png|jpg|webp em ordem
//        alfabética = ordem de queima: burn-01, burn-02, …)
//
// Diferenças do pipeline de vídeo (prepare-video-frames.js):
// - Saída em 1920w (fotos são 2K-4K; o vídeo era 720p) e SEM unsharp (fonte
//   já é nítida; sharpen aqui geraria halo).
// - Todas as fotos são normalizadas para as dimensões da primeira (cover) —
//   gerações do Gemini podem variar alguns pixels entre edições.
// - O crossfade do film.js interpola entre poucos frames, então N pequeno
//   (8-12) é esperado e suficiente.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'website', 'assets', 'film');

const STILL_W = 1920;
const FRAME_Q = 88;
const POSTER_Q = 92;
const MIN_STILLS = 4;

// Detecção da brasa (mesma lógica do pipeline de vídeo, raio mais largo:
// entre estágios a brasa anda bem mais do que entre frames de vídeo)
const DETECT_W = 320;
const HOT_SCORE_MIN = 150;
const TRACK_RADIUS_FRAC = 0.25;

const srcFlag = process.argv.indexOf('--src');
const SRC = srcFlag >= 0 ? path.resolve(process.argv[srcFlag + 1]) : path.join(ROOT, 'assets', 'stills');

function report(filePath) {
  const kb = (fs.statSync(filePath).size / 1024).toFixed(0);
  console.log(`${path.relative(ROOT, filePath)}: ${kb} KB`);
}

async function detectEmber(buf, prevNorm) {
  const { data, info } = await sharp(buf)
    .resize(DETECT_W, null, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const prevX = prevNorm ? prevNorm[0] * width : null;
  const prevY = prevNorm ? prevNorm[1] * height : null;
  const radius = TRACK_RADIUS_FRAC * width;

  let sumX = 0;
  let sumY = 0;
  let sumW = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 3;
      const score = 2 * data[o] - data[o + 1] - data[o + 2];
      if (score <= HOT_SCORE_MIN) continue;
      if (prevX !== null && Math.hypot(x - prevX, y - prevY) > radius) continue;
      const w = score - HOT_SCORE_MIN;
      sumX += x * w;
      sumY += y * w;
      sumW += w;
    }
  }
  if (sumW <= 0) return null;
  return { x: sumX / sumW / width, y: sumY / sumW / height };
}

async function main() {
  if (!fs.existsSync(SRC)) {
    throw new Error(`Pasta de fotos não encontrada: ${SRC}\nColoque as fotos como assets/stills/burn-01.png, burn-02.png, … (ordem = queima).`);
  }
  const files = fs
    .readdirSync(SRC)
    .filter((f) => /^burn-.*\.(png|jpe?g|webp)$/i.test(f))
    .sort()
    .map((f) => path.join(SRC, f));
  if (files.length < MIN_STILLS) {
    throw new Error(`Só ${files.length} foto(s) burn-* em ${SRC} (mínimo ${MIN_STILLS}).`);
  }
  console.log(`${files.length} fotos: ${files.map((f) => path.basename(f)).join(', ')}`);

  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) {
    if (/^(f-\d+\.webp|poster\.webp|ember\.json)$/.test(f)) fs.unlinkSync(path.join(OUT, f));
  }

  // A primeira foto define o canvas; as demais são normalizadas por cover
  const first = await sharp(files[0]).resize(STILL_W, null, { fit: 'inside', withoutEnlargement: true }).toBuffer();
  const { width: outW, height: outH } = await sharp(first).metadata();
  console.log(`Canvas de saída: ${outW}×${outH} (da primeira foto)`);

  const points = [];
  let prevNorm = null;
  let misses = 0;

  for (let i = 0; i < files.length; i++) {
    const norm = await sharp(files[i])
      .resize(outW, outH, { fit: 'cover', position: 'centre' })
      .toBuffer();
    const outPath = path.join(OUT, `f-${String(i).padStart(3, '0')}.webp`);
    await sharp(norm).webp({ quality: FRAME_Q }).toFile(outPath);
    report(outPath);
    if (i === 0) {
      await sharp(norm).webp({ quality: POSTER_Q }).toFile(path.join(OUT, 'poster.webp'));
    }

    const ember = await detectEmber(norm, prevNorm);
    if (ember) {
      points.push([ember.x, ember.y]);
      prevNorm = [ember.x, ember.y];
    } else {
      points.push(null);
      misses++;
      console.warn(`AVISO: brasa não detectada em ${path.basename(files[i])}`);
    }
  }

  if (misses === files.length) {
    throw new Error('ABORTADO: brasa não detectada em NENHUMA foto — brasa fraca ou fundo claro demais?');
  }

  // Preenche buracos por interpolação entre vizinhos válidos
  const N = points.length;
  for (let i = 0; i < N; i++) {
    if (points[i]) continue;
    let a = i - 1;
    while (a >= 0 && !points[a]) a--;
    let b = i + 1;
    while (b < N && !points[b]) b++;
    if (a >= 0 && b < N) {
      const t = (i - a) / (b - a);
      points[i] = [
        points[a][0] + (points[b][0] - points[a][0]) * t,
        points[a][1] + (points[b][1] - points[a][1]) * t,
      ];
    } else {
      points[i] = points[a >= 0 ? a : b].slice();
    }
  }

  // Suavização leve (janela 3) — com N pequeno, janela larga achataria tudo
  const smooth = points.map((_, i) => {
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let k = Math.max(0, i - 1); k <= Math.min(N - 1, i + 1); k++) {
      sx += points[k][0];
      sy += points[k][1];
      n++;
    }
    return [Math.round((sx / n) * outW), Math.round((sy / n) * outH)];
  });

  fs.writeFileSync(path.join(OUT, 'ember.json'), JSON.stringify({ w: outW, h: outH, points: smooth }));
  report(path.join(OUT, 'ember.json'));

  let totalKb = 0;
  for (const f of fs.readdirSync(OUT)) totalKb += fs.statSync(path.join(OUT, f)).size / 1024;
  console.log('---');
  console.log(`${N} estágios em website/assets/film/ (${outW}×${outH}) — total ${(totalKb / 1024).toFixed(1)} MB`);
  console.log(`Brasa: ${N - misses}/${N} detectadas; trajetória x ${smooth[0][0]}→${smooth[N - 1][0]}px`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
