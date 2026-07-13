// Interação de ponteiro com o charuto do filme: hover aquece (halo + fumaça +
// cursor), click/tap dá uma "tragada" (flare + rajada de fumaça + faíscas).
// O hit test é distância ao segmento do charuto (ponta fria → brasa), rodando
// 1× por rAF contra a geometria cacheada do filme — sem leitura de layout.

const HIT_RADIUS = 64;

function hitSegment(seg, x, y) {
  if (!seg) return false;
  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 0 ? Math.min(Math.max(((x - seg.x1) * dx + (y - seg.y1) * dy) / len2, 0), 1) : 0;
  const px = seg.x1 + dx * t;
  const py = seg.y1 + dy * t;
  return Math.hypot(x - px, y - py) <= HIT_RADIUS;
}

export function initPointer(film, fx) {
  let px = -1;
  let py = -1;
  let isTouch = false;
  let hovering = false;

  window.addEventListener(
    'pointermove',
    (e) => {
      px = e.clientX;
      py = e.clientY;
      isTouch = e.pointerType === 'touch';
    },
    { passive: true },
  );

  window.addEventListener(
    'pointerdown',
    (e) => {
      if (hitSegment(film.getCigarSegmentViewport(), e.clientX, e.clientY)) {
        fx.flare(1);
        fx.burstAtEmber(15 + Math.round(Math.random() * 10));
      }
    },
    { passive: true },
  );

  return {
    tick() {
      const hit = !isTouch && px >= 0 && hitSegment(film.getCigarSegmentViewport(), px, py);
      if (hit !== hovering) {
        hovering = hit;
        fx.setWarmth(hit ? 1 : 0);
        document.body.classList.toggle('cigar-hover', hit);
      }
    },
  };
}
