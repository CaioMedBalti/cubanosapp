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

// Backgrounds de seção carregam só ao se aproximar (CSS background em elemento
// below-fold carregaria no primeiro layout — o gate é a classe .bg-in). A
// classe só entra depois que a imagem realmente carrega: enquanto os assets
// bg-*.webp não existirem, a seção fica no gradiente e nada quebra.
export function initLazyBackgrounds() {
  const els = document.querySelectorAll('[data-bg]');
  if (els.length === 0) return;
  const activate = (el) => {
    const img = new Image();
    img.onload = () => el.classList.add('bg-in');
    img.src = `/assets/img/bg-${el.dataset.bg}.webp`;
  };
  if (!('IntersectionObserver' in window)) {
    for (const el of els) activate(el);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          io.unobserve(entry.target);
          activate(entry.target);
        }
      }
    },
    { rootMargin: '100% 0px' },
  );
  for (const el of els) io.observe(el);
}

// Barra de CTA fixa do mobile: aparece quando o hero sai da viewport (a CTA
// principal deixou de estar visível) e some de volta no topo.
export function initCtaBar() {
  const hero = document.getElementById('hero');
  const bar = document.querySelector('.cta-bar');
  if (!hero || !bar || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        document.body.classList.toggle('cta-bar-on', !entry.isIntersecting);
      }
    },
    { threshold: 0.1 },
  );
  io.observe(hero);
}
