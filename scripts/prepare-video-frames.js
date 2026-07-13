// Converte o vídeo do charuto queimando (assets/video/cigar-burn.mp4) na
// sequência de frames que o site scruba com o scroll:
//   website/assets/film/f-000.webp … f-149.webp  (1280w, q62)
//   website/assets/film/poster.webp              (frame 0, q80 — mobile/fallback)
//   website/assets/film/ember.json               (trajetória da brasa por frame)
//
// Uso:  node scripts/prepare-video-frames.js                (vídeo real; precisa de ffmpeg)
//       node scripts/prepare-video-frames.js --placeholder  (frames sintéticos p/ desenvolver)
//
// ffmpeg é resolvido nesta ordem: env FFMPEG_PATH → PATH do sistema → ffmpeg-static.
// A detecção da brasa acha o centroide do blob mais "quente" (score 2R−G−B) de
// cada frame; falha em >10% dos frames indica câmera se mexendo ou cortes.

const sharp = require('sharp');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const VIDEO = path.join(ROOT, 'assets', 'video', 'cigar-burn.mp4');
const OUT = path.join(ROOT, 'website', 'assets', 'film');

const N = 150; // frames finais (progress 0..1 → frame 0..N-1)
const OUT_W = 1280;
const FRAME_Q = 62;
const POSTER_Q = 80;

// Detecção da brasa roda numa versão reduzida do frame (rápido e estável)
const DETECT_W = 320;
const HOT_SCORE_MIN = 150; // 2R−G−B mínimo para um pixel contar como brasa
const MAX_MISS_FRAC = 0.1;

const isPlaceholder = process.argv.includes('--placeholder');

function report(filePath) {
  const kb = (fs.statSync(filePath).size / 1024).toFixed(0);
  console.log(`${path.relative(ROOT, filePath)}: ${kb} KB`);
}

function resolveFfmpeg() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) return process.env.FFMPEG_PATH;
  const probe = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  if (!probe.error) return 'ffmpeg';
  try {
    return require('ffmpeg-static');
  } catch {
    throw new Error(
      'ffmpeg não encontrado. Instale com `npm i -D ffmpeg-static` (na raiz do repo) ' +
        'ou aponte FFMPEG_PATH para um binário do ffmpeg.',
    );
  }
}

// ---------------------------------------------------------------------------
// Fonte A: frames extraídos do vídeo real
async function framesFromVideo() {
  if (!fs.existsSync(VIDEO)) {
    throw new Error(`Vídeo não encontrado em ${path.relative(ROOT, VIDEO)}. Coloque o cigar-burn.mp4 lá (ou rode com --placeholder).`);
  }
  const ffmpeg = resolveFfmpeg();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cubanos-film-'));
  console.log(`Extraindo frames com ffmpeg → ${tmp}`);
  execFileSync(ffmpeg, [
    '-i', VIDEO,
    '-vsync', '0',
    '-vf', `scale=${OUT_W}:-2`,
    '-q:v', '2',
    path.join(tmp, 'f-%05d.jpg'),
  ], { stdio: ['ignore', 'ignore', 'inherit'] });

  const all = fs.readdirSync(tmp).filter((f) => /^f-\d+\.jpg$/.test(f)).sort();
  if (all.length < N) {
    throw new Error(`ABORTADO: o vídeo rendeu só ${all.length} frames (< ${N}). Vídeo muito curto?`);
  }
  console.log(`${all.length} frames extraídos; subsampleando para ${N}.`);
  const picked = [];
  for (let i = 0; i < N; i++) {
    const idx = Math.round((i / (N - 1)) * (all.length - 1));
    picked.push(path.join(tmp, all[idx]));
  }
  return { frames: picked.map((p) => () => fs.promises.readFile(p)), cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

// ---------------------------------------------------------------------------
// Fonte B: frames sintéticos (charuto atual sobre fundo escuro, brasa andando)
// — só para desenvolver/testar o scrub antes do vídeo real chegar.
async function framesFromPlaceholder() {
  const W = OUT_W;
  const H = 720;
  const cigarPath = path.join(ROOT, 'website', 'assets', 'cigars', 'burn-cigar@2x.png');
  if (!fs.existsSync(cigarPath)) throw new Error(`Placeholder precisa de ${cigarPath}`);

  const cigW = Math.round(W * 0.62);
  const cig = await sharp(cigarPath).resize(cigW, null, { fit: 'inside' }).png().toBuffer();
  const cigMeta = await sharp(cig).metadata();
  const cigX = Math.round((W - cigW) / 2);
  const cigY = Math.round(H * 0.55 - cigMeta.height / 2);
  const emberY = cigY + Math.round(cigMeta.height / 2);

  const bgSvg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><radialGradient id="g" cx="50%" cy="55%" r="75%">
        <stop offset="0%" stop-color="#1a120c"/><stop offset="100%" stop-color="#0d0a08"/>
      </radialGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`,
  );

  console.log(`Gerando ${N} frames placeholder (${W}×${H})…`);
  const makers = [];
  for (let i = 0; i < N; i++) {
    makers.push(async () => {
      const prog = i / (N - 1);
      // Queima da direita para a esquerda: consome até 55% do comprimento
      const visW = Math.max(8, Math.round(cigW * (1 - 0.55 * prog)));
      const visible = await sharp(cig).extract({ left: 0, top: 0, width: visW, height: cigMeta.height }).png().toBuffer();
      const ex = cigX + visW;
      const pulse = 0.86 + 0.14 * Math.sin(i * 1.7);
      const emberSvg = Buffer.from(
        `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
          <defs><radialGradient id="e" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fff0c8" stop-opacity="${0.95 * pulse}"/>
            <stop offset="35%" stop-color="#ff8a20" stop-opacity="${0.8 * pulse}"/>
            <stop offset="100%" stop-color="#c82800" stop-opacity="0"/>
          </radialGradient></defs>
          <circle cx="${ex}" cy="${emberY}" r="30" fill="url(#e)"/>
        </svg>`,
      );
      return sharp(bgSvg)
        .composite([
          { input: visible, left: cigX, top: cigY },
          { input: emberSvg, left: 0, top: 0 },
        ])
        .jpeg({ quality: 90 })
        .toBuffer();
    });
  }
  return { frames: makers, cleanup: () => {} };
}

// ---------------------------------------------------------------------------
// Brasa: centroide ponderado dos pixels quentes (score 2R−G−B) num frame 320w
async function detectEmber(frameBuf) {
  const { data, info } = await sharp(frameBuf)
    .resize(DETECT_W, null, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  let sumX = 0;
  let sumY = 0;
  let sumW = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 3;
      const score = 2 * data[o] - data[o + 1] - data[o + 2];
      if (score > HOT_SCORE_MIN) {
        const w = score - HOT_SCORE_MIN;
        sumX += x * w;
        sumY += y * w;
        sumW += w;
      }
    }
  }
  if (sumW <= 0) return null;
  // Coordenadas normalizadas 0..1 (independem da resolução de detecção)
  return { x: sumX / sumW / width, y: sumY / sumW / height };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  // Limpa saída anterior para não sobrar frame velho de outra leva
  for (const f of fs.readdirSync(OUT)) {
    if (/^(f-\d+\.webp|poster\.webp|ember\.json)$/.test(f)) fs.unlinkSync(path.join(OUT, f));
  }

  const { frames, cleanup } = isPlaceholder ? await framesFromPlaceholder() : await framesFromVideo();

  let outW = 0;
  let outH = 0;
  const points = [];
  let misses = 0;

  for (let i = 0; i < N; i++) {
    const buf = await frames[i]();
    const img = sharp(buf).resize(OUT_W, null, { fit: 'inside', withoutEnlargement: true });
    const outPath = path.join(OUT, `f-${String(i).padStart(3, '0')}.webp`);
    const info = await img.webp({ quality: FRAME_Q }).toFile(outPath);
    if (i === 0) {
      outW = info.width;
      outH = info.height;
      await sharp(buf).resize(OUT_W, null, { fit: 'inside', withoutEnlargement: true }).webp({ quality: POSTER_Q }).toFile(path.join(OUT, 'poster.webp'));
    }

    const ember = await detectEmber(buf);
    if (ember) {
      points.push([ember.x, ember.y]);
    } else {
      points.push(null);
      misses++;
    }
    if (i % 25 === 0) console.log(`frame ${i}/${N - 1}…`);
  }
  cleanup();

  if (misses / N > MAX_MISS_FRAC) {
    throw new Error(
      `ABORTADO: brasa não detectada em ${misses}/${N} frames (>${MAX_MISS_FRAC * 100}%). ` +
        'O vídeo provavelmente tem cortes, câmera se mexendo ou brasa fraca demais.',
    );
  }

  // Preenche buracos por interpolação linear entre vizinhos válidos
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

  // Suaviza (média móvel, janela 5) e converte para pixels do frame de saída
  const smooth = points.map((_, i) => {
    let sx = 0;
    let sy = 0;
    let n = 0;
    for (let k = Math.max(0, i - 2); k <= Math.min(N - 1, i + 2); k++) {
      sx += points[k][0];
      sy += points[k][1];
      n++;
    }
    return [Math.round((sx / n) * outW), Math.round((sy / n) * outH)];
  });

  const emberJson = { w: outW, h: outH, points: smooth };
  fs.writeFileSync(path.join(OUT, 'ember.json'), JSON.stringify(emberJson));

  let totalKb = 0;
  for (const f of fs.readdirSync(OUT)) totalKb += fs.statSync(path.join(OUT, f)).size / 1024;
  report(path.join(OUT, 'poster.webp'));
  report(path.join(OUT, 'ember.json'));
  console.log('---');
  console.log(`${N} frames em website/assets/film/ (${outW}×${outH}) — total ${(totalKb / 1024).toFixed(1)} MB`);
  console.log(`Brasa: detectada em ${N - misses}/${N} frames; trajetória x ${smooth[0][0]}→${smooth[N - 1][0]}px`);
  if (isPlaceholder) console.log('MODO PLACEHOLDER — rode sem a flag quando o cigar-burn.mp4 real chegar.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
