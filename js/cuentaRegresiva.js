(function () {
      const pad = (n) => String(n).padStart(2, '0');
      const $d = document.getElementById('cd-days');
      const $h = document.getElementById('cd-hours');
      const $m = document.getElementById('cd-mins');
      const $s = document.getElementById('cd-secs');
      const $f = document.getElementById('cd-finished');

      if (!$d || !$h || !$m || !$s) return;

      // 6 diciembre 2025, 14:00 hora local del navegador
      const target = new Date(2025, 11, 6, 14, 0, 0, 0);

      function tick() {
        const now = new Date();
        let diff = target - now;
        if (diff <= 0) {
          $d.textContent = '00';
          $h.textContent = '00';
          $m.textContent = '00';
          $s.textContent = '00';
          // Mensaje contextual
          const isSameDay = now.getFullYear() === target.getFullYear() && now.getMonth() === target.getMonth() && now.getDate() === target.getDate();
          if ($f) $f.textContent = isSameDay ? '¡Es hoy! ¡Nos vemos a las 2:00 PM!' : '¡Ya empezó la fiesta!';
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);
        const mins = Math.floor(diff / (1000 * 60));
        diff -= mins * (1000 * 60);
        const secs = Math.floor(diff / 1000);

        $d.textContent = pad(days);
        $h.textContent = pad(hours);
        $m.textContent = pad(mins);
        $s.textContent = pad(secs);
        if ($f) $f.textContent = '';
      }

      tick();
      const id = setInterval(tick, 1000);
      window.addEventListener('beforeunload', () => clearInterval(id));
    })();