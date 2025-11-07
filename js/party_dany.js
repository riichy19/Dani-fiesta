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