// Audio control with low volume, multi-format fallback, and volume slider
(function () {
  if (window.__audioSetupDone) return;
  window.__audioSetupDone = true;

  function setupAudio() {
    var audio = document.getElementById('bg-audio');
    var btn = document.getElementById('audioToggle');
    if (!audio || !btn) return;

    // Choose best format (prefer current MP4; if unsupported, try MP3)
    try {
      var canMp4 = typeof audio.canPlayType === 'function' && audio.canPlayType('audio/mp4');
      if (!canMp4) {
        audio.removeAttribute('src');
        audio.setAttribute('src', './img/audio/Belibeto.mp3');
      }
    } catch (e) {}

    var VOL_KEY = 'bgAudioVolume';
    var initialVol = 0.2; // 20%
    try {
      var saved = parseFloat(localStorage.getItem(VOL_KEY));
      if (!isNaN(saved) && saved >= 0 && saved <= 1) initialVol = saved;
    } catch (e) {}
    audio.volume = initialVol;

    function updateBtn() {
      if (audio.paused) {
        btn.textContent = 'Play';
        btn.title = 'Activar musica';
        btn.setAttribute('aria-label', 'Activar musica');
      } else {
        btn.textContent = 'Pause';
        btn.title = 'Pausar musica';
        btn.setAttribute('aria-label', 'Pausar musica');
      }
    }

    function showBtn() { btn.style.display = 'grid'; }

    // Create volume slider if missing
    var slider = document.getElementById('volumeSlider');
    if (!slider) {
      slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '1';
      slider.step = '0.05';
      slider.id = 'volumeSlider';
      slider.className = 'volume-slider';
      slider.style.position = 'fixed';
      slider.style.right = '180px';
      slider.style.bottom = '24px';
      slider.style.width = '120px';
      slider.style.zIndex = '10';
      slider.style.display = 'none';
      slider.setAttribute('aria-label', 'Volumen');
      document.body.appendChild(slider);
    }
    slider.value = String(initialVol);
    function showSlider() { slider.style.display = 'block'; }
    function syncSliderFromAudio() { if (document.activeElement !== slider) slider.value = String(audio.volume); }

    var desiredVol = initialVol;
    var internalSet = false;
    audio.addEventListener('volumechange', function () {
      if (!internalSet && Math.abs(audio.volume - desiredVol) > 0.001) {
        internalSet = true;
        audio.volume = desiredVol;
        internalSet = false;
      }
      try { localStorage.setItem(VOL_KEY, String(audio.volume)); } catch (e) {}
      syncSliderFromAudio();
    });
    slider.addEventListener('input', function () {
      var v = parseFloat(slider.value);
      if (!isNaN(v)) {
        desiredVol = Math.min(1, Math.max(0, v));
        internalSet = true;
        audio.volume = desiredVol;
        internalSet = false;
      }
    });

    function tryPlay() {
      var p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(function () { showBtn(); showSlider(); updateBtn(); })
         .catch(function () { showBtn(); showSlider(); updateBtn(); });
      } else {
        showBtn();
        showSlider();
        updateBtn();
      }
    }

    // Show controls from start
    showBtn();
    showSlider();
    updateBtn();

    // Ensure button stays visible even if other scripts hide it
    audio.addEventListener('playing', showBtn);

    // Auto-start after 5 seconds (if allowed by browser policies)
    var autoTried = false;
    var scheduledAt = Date.now() + 5000;
    try { audio.load(); } catch (e) {}
    setTimeout(function () {
      autoTried = true;
      if (audio.paused && !document.hidden) tryPlay();
    }, 5000);
    // If tab becomes visible after 5s, try once
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && !autoTried && Date.now() >= scheduledAt && audio.paused) {
        autoTried = true;
        tryPlay();
      }
    });
    // After 5s, if still paused, start on first user gesture
    function onUserGesture() {
      if (Date.now() >= scheduledAt && audio.paused) {
        tryPlay();
        document.removeEventListener('pointerdown', onUserGesture);
        document.removeEventListener('click', onUserGesture);
        document.removeEventListener('touchend', onUserGesture);
      }
    }
    document.addEventListener('pointerdown', onUserGesture);
    document.addEventListener('click', onUserGesture);
    document.addEventListener('touchend', onUserGesture);

    // Manual toggle
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (audio.paused) {
        tryPlay();
      } else {
        audio.pause();
        updateBtn();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupAudio, { once: true });
  } else {
    setupAudio();
  }
})();
