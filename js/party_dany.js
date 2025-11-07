(function () {
  const img = document.getElementById('foto-daniela');
  const ph = document.getElementById('foto-placeholder');
  const inner = document.getElementById('foto-inner');
  function togglePlaceholder() {
    if (!img || !ph || !inner) return;
    const ok = img.complete && img.naturalWidth > 0;
    ph.style.display = ok ? 'none' : 'grid';
    inner.classList.toggle('no-img', !ok);
  }
  if (img) {
    img.addEventListener('load', togglePlaceholder);
    img.addEventListener('error', togglePlaceholder);
    togglePlaceholder();
  }
})();

// Tema claro/oscuro con persistencia
(function () {
  const key = 'theme';
  const root = document.documentElement;
  let animTid = null;

  function apply(theme, animate = false) {
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem(key, theme); } catch {}
    if (animate) {
      root.classList.add('theme-anim');
      if (animTid) clearTimeout(animTid);
      animTid = setTimeout(() => root.classList.remove('theme-anim'), 450);
    }
  }

  function bindToggle() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return false;
    btn.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      apply(isDark ? 'light' : 'dark', true);
    });
    return true;
  }

  // Inicial: localStorage > prefers-color-scheme
  let stored;
  try { stored = localStorage.getItem(key); } catch {}
  if (stored === 'dark' || stored === 'light') {
    apply(stored, false);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    apply('dark', false);
  }

  // Intenta enlazar ahora y, si aún no existe el botón, al cargar el DOM
  if (!bindToggle()) {
    document.addEventListener('DOMContentLoaded', bindToggle, { once: true });
  }
})();

// Animaciones de scroll deshabilitadas
// Scroll reveal simple: oculta cajones hasta que entren en el viewport
(function () {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const selector = 'main.inv-card, section.padrinos-card, section.countdown-card, section.location-card, section.gallery-card, section.qr-card';

  function setup() {
    const list = Array.from(document.querySelectorAll(selector));
    list.forEach(el => el.classList.add('reveal'));
    if (prefersReduced || !(window.IntersectionObserver)) {
      list.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          entry.target.classList.remove('is-visible');
        }
      });
    }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
    list.forEach(el => io.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
})();
