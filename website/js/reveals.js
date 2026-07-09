// Reveals de entrada: um IntersectionObserver, classe .is-visible, unobserve
// após o primeiro disparo — zero trabalho no scroll handler.

export function initReveals() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    for (const el of els) el.classList.add('is-visible');
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
  );
  for (const el of els) io.observe(el);
}
