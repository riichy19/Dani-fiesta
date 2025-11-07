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

// Confetti sutil (canvas ligero)
(function () {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, rafId;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function launchConfetti(count = 60, duration = 1400) {
    const colors = ['#ffd200', '#ff8c00', '#0057d9'];
    const parts = new Array(count).fill(0).map(() => ({
      x: Math.random() * W,
      y: -10 - Math.random() * 40,
      size: 4 + Math.random() * 6,
      vx: -1 + Math.random() * 2,
      vy: 2 + Math.random() * 2,
      rot: Math.random() * Math.PI * 2,
      vr: (-0.2 + Math.random() * 0.4),
      color: colors[(Math.random() * colors.length) | 0],
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
      alpha: 0.9
    }));
    const start = performance.now();

    function step(t) {
      const elapsed = t - start;
      ctx.clearRect(0, 0, W, H);
      parts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        const life = Math.min(1, Math.max(0, 1 - elapsed / duration));
        ctx.globalAlpha = p.alpha * (life);
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.shape === 'rect') ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
        else { ctx.beginPath(); ctx.arc(0,0,p.size*0.35,0,Math.PI*2); ctx.fill(); }
        ctx.restore();
      });
      ctx.globalAlpha = 1;
      if (elapsed < duration) rafId = requestAnimationFrame(step); else ctx.clearRect(0,0,W,H);
    }
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(step);
  }

  // Exponer para otros scripts o botones
  window.launchConfetti = launchConfetti;

  // Disparo inicial sutil
  setTimeout(() => launchConfetti(50, 1500), 400);

  // Disparo al abrir galería
  document.querySelectorAll('[data-bs-target="#galeriaModal"]').forEach(btn => {
    btn.addEventListener('click', () => launchConfetti(30, 1200));
  });
  const galModal = document.getElementById('galeriaModal');
  if (galModal) {
    galModal.addEventListener('shown.bs.modal', () => launchConfetti(40, 1300));
  }

  // Disparo al enviar formulario QR
  const qrForm = document.getElementById('qrForm');
  if (qrForm) {
    qrForm.addEventListener('submit', () => setTimeout(() => launchConfetti(40, 1200), 50));
  }
})();

// Audio: intenta reproducir a los 3s; si falla por políticas, muestra botón para activar
(function () {
  const audio = document.getElementById('bg-audio');
  const btn = document.getElementById('audioToggle');
  if (!audio || !btn) return;

  function updateBtn() {
    if (audio.paused) { btn.textContent = '🎵'; btn.title = 'Activar música'; btn.setAttribute('aria-label','Activar música'); }
    else { btn.textContent = '⏸️'; btn.title = 'Pausar música'; btn.setAttribute('aria-label','Pausar música'); }
  }

  function showBtn() { btn.style.display = 'grid'; }
  function hideBtn() { btn.style.display = 'none'; }

  function tryPlay() {
    audio.volume = 0.6;
    const p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(() => { hideBtn(); updateBtn(); }).catch(() => { showBtn(); updateBtn(); });
    } else {
      // viejos navegadores
      hideBtn(); updateBtn();
    }
  }

  setTimeout(tryPlay, 3000);
  // Reintenta al primer gesto del usuario si fue bloqueado
  document.addEventListener('click', function onFirstClick() {
    if (audio.paused) tryPlay();
    document.removeEventListener('click', onFirstClick);
  });

  btn.addEventListener('click', () => {
    if (audio.paused) tryPlay(); else { audio.pause(); showBtn(); updateBtn(); }
  });
})();

// Carrusel: pausar videos y sincronizar indicadores (espera al DOM)
(function () {
  function setupCarousel() {
    const modal = document.getElementById('galeriaModal');
    const carousel = document.getElementById('galeriaCarousel');
    if (!modal || !carousel) return;

    function pauseAllVideos(scope) {
      const vids = (scope || document).querySelectorAll('#galeriaCarousel video');
      vids.forEach(v => { try { v.pause(); } catch(_){} });
    }

    function ensureActiveItem() {
      const items = Array.from(carousel.querySelectorAll('.carousel-inner .carousel-item'));
      if (!items.length) return 0;
      let activeIndex = items.findIndex(i => i.classList.contains('active'));
      if (activeIndex === -1) { items[0].classList.add('active'); activeIndex = 0; }
      items.forEach((it, idx) => { if (idx !== activeIndex) it.classList.remove('active'); });
      return activeIndex;
    }

    function syncIndicators() {
      const items = Array.from(carousel.querySelectorAll('.carousel-inner .carousel-item'));
      let indicators = carousel.querySelector('.carousel-indicators');
      if (!indicators) { indicators = document.createElement('div'); indicators.className = 'carousel-indicators'; carousel.prepend(indicators); }
      const activeIndex = ensureActiveItem();
      indicators.innerHTML = '';
      items.forEach((_, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-bs-target', '#galeriaCarousel');
        btn.setAttribute('data-bs-slide-to', String(idx));
        btn.setAttribute('aria-label', `Slide ${idx + 1}`);
        if (idx === activeIndex) { btn.classList.add('active'); btn.setAttribute('aria-current', 'true'); }
        indicators.appendChild(btn);
      });
    }

    carousel.addEventListener('slide.bs.carousel', () => pauseAllVideos(carousel));
    carousel.addEventListener('slid.bs.carousel', syncIndicators);
    modal.addEventListener('shown.bs.modal', syncIndicators);
    modal.addEventListener('hide.bs.modal', () => pauseAllVideos(modal));

    syncIndicators();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCarousel, { once: true });
  } else {
    setupCarousel();
  }
})();
// Animaciones de scroll deshabilitadas
// Scroll reveal simple: oculta cajones hasta que entren en el viewport
(function () {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const selector = 'main.inv-card, section.padrinos-card, section.countdown-card, section.location-card, section.gallery-card, section.qr-card, section.dedicatoria-card';

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
    }, { root: null, rootMargin: '0px 0px -5% 0px', threshold: 0.05 });
    list.forEach(el => io.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
})();

// Confetti sutil (canvas ligero) – inicializa cuando el DOM está listo
(function () {
  function initConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, rafId;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function launchConfetti(count = 60, duration = 1400) {
      const colors = ['#ffd200', '#ff8c00', '#0057d9'];
      const parts = new Array(count).fill(0).map(() => ({
        x: Math.random() * W,
        y: -10 - Math.random() * 40,
        size: 4 + Math.random() * 6,
        vx: -1 + Math.random() * 2,
        vy: 2 + Math.random() * 2,
        rot: Math.random() * Math.PI * 2,
        vr: (-0.2 + Math.random() * 0.4),
        color: colors[(Math.random() * colors.length) | 0],
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
        alpha: 0.9
      }));
      const start = performance.now();

      function step(t) {
        const elapsed = t - start;
        ctx.clearRect(0, 0, W, H);
        parts.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vr;
          const life = Math.min(1, Math.max(0, 1 - elapsed / duration));
          ctx.globalAlpha = p.alpha * (life);
          ctx.fillStyle = p.color;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          if (p.shape === 'rect') ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
          else { ctx.beginPath(); ctx.arc(0,0,p.size*0.35,0,Math.PI*2); ctx.fill(); }
          ctx.restore();
        });
        ctx.globalAlpha = 1;
        if (elapsed < duration) rafId = requestAnimationFrame(step); else ctx.clearRect(0,0,W,H);
      }
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(step);
    }

    // Exponer en window
    window.launchConfetti = launchConfetti;

    // Disparo inicial sutil
    setTimeout(() => launchConfetti(50, 1500), 400);

    // Disparo al abrir galería (click y shown)
    document.querySelectorAll('[data-bs-target="#galeriaModal"]').forEach(btn => {
      btn.addEventListener('click', () => launchConfetti(30, 1200));
    });
    const galModal = document.getElementById('galeriaModal');
    if (galModal) {
      galModal.addEventListener('shown.bs.modal', () => launchConfetti(40, 1300));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConfetti, { once: true });
  } else {
    initConfetti();
  }
})();
