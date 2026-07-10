// Interação de ponteiro com o charuto: hover aquece (brasa + fumaça + glow),
// click/tap dá uma "tragada" (surto de brasa + rajada de fumaça). O palco
// mantém pointer-events:none — o hit test roda 1× por rAF contra a pose
// cacheada e a silhueta real do PNG, sem leitura de layout.

export function initPointer(stage, cigar) {
  let px = -1;
  let py = -1;
  let isTouch = false;
  let hovering = false;
  const stageEl = document.getElementById('cigar-stage');

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
      if (stage.hitTest(e.clientX, e.clientY)) {
        cigar.flare(1);
        cigar.burstAtEmber(15 + Math.round(Math.random() * 10));
      }
    },
    { passive: true },
  );

  return {
    tick() {
      const hit = !isTouch && px >= 0 && stage.hitTest(px, py);
      if (hit !== hovering) {
        hovering = hit;
        cigar.setWarmth(hit ? 1 : 0);
        stageEl.classList.toggle('is-warm', hit);
        document.body.classList.toggle('cigar-hover', hit);
      }
    },
  };
}
