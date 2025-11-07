// Generador de códigos QR reutilizable (sin dependencias remotas)
// Requiere que esté cargado qrcode.min.js antes de este archivo.
(function () {
  function randomNonce(len = 10) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let out = '';
    if (window.crypto && window.crypto.getRandomValues) {
      const buf = new Uint8Array(len);
      window.crypto.getRandomValues(buf);
      for (const v of buf) out += chars[v % chars.length];
    } else {
      for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  function sanitizeFileName(name) {
    return String(name || '').replace(/[^a-zA-Z0-9_.-]/g, '_');
  }

  function getCorrectLevel() {
    if (window.QRErrorCorrectLevel) return window.QRErrorCorrectLevel;
    if (window.QRCode && QRCode.CorrectLevel) return QRCode.CorrectLevel;
    return { L: 1, M: 0, Q: 3, H: 2 };
  }

  function generateDataURL(text, size = 256, level = 'M') {
    const CorrectLevel = getCorrectLevel();
    const tmp = document.createElement('div');
    new QRCode(tmp, {
      text,
      width: size,
      height: size,
      correctLevel: CorrectLevel[level] ?? CorrectLevel.M,
    });
    let url = '';
    const canvas = tmp.querySelector('canvas');
    if (canvas && canvas.toDataURL) {
      url = canvas.toDataURL('image/png');
    } else {
      const im = tmp.querySelector('img');
      url = im ? im.src : '';
    }
    return url;
  }

  async function saveToServer(dataUrl, filename = 'qr.png', server = 'http://localhost:8787/save-qr') {
    try {
      const res = await fetch(server, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sanitizeFileName(filename), dataUrl })
      });
      if (!res.ok) throw new Error('save_failed');
      return await res.json();
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  function buildPayload(family) {
    return {
      v: 1,
      type: 'confirm',
      family: String(family || '').trim(),
      ts: new Date().toISOString(),
      code: randomNonce(8),
    };
  }

  function generateToImg(imgEl, textOrPayload, { size = 256, level = 'M' } = {}) {
    if (!imgEl) return '';
    const text = typeof textOrPayload === 'string' ? textOrPayload : JSON.stringify(textOrPayload);
    const url = generateDataURL(text, size, level);
    if (url) imgEl.src = url;
    return url;
  }

  async function attachForm({
    formId = 'qrForm',
    inputId = 'familiaInput',
    imgId = 'qrImg',
    wrapId = 'qrWrap',
    captionId = 'qrCaption',
    size = 256,
    level = 'M',
    autoSave = true,
    filePrefix = 'qr_',
    simulationImages = [] // si se provee, se usarán imágenes aleatorias en lugar de generar
  } = {}) {
    const form = document.getElementById(formId);
    if (!form) return;
    const input = document.getElementById(inputId);
    const img = document.getElementById(imgId);
    const wrap = document.getElementById(wrapId);
    const caption = document.getElementById(captionId);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const family = (input?.value || '').trim();
      if (!img) return;

      // Modo simulación: mostrar una imagen aleatoria existente
      if (Array.isArray(simulationImages) && simulationImages.length > 0) {
        const pick = simulationImages[Math.floor(Math.random() * simulationImages.length)];
        img.src = pick;
        if (wrap) wrap.hidden = false;
        if (caption) {
          const nombre = family || '';
          caption.textContent = nombre
            ? `${nombre}, esperamos tu asistencia.  favor de hacerle captura al qr.`
            : `Esperamos tu asistencia.  favor de hacerle captura al qr.`;
          caption.hidden = false;
        }
        return; // no generamos ni guardamos
      }

      if (!family) return;

      const payload = buildPayload(family);
      const dataUrl = generateDataURL(JSON.stringify(payload), size, level);
      if (dataUrl) {
        img.src = dataUrl;
        if (wrap) wrap.hidden = false;
        if (caption) {
          caption.textContent = `${family}, esperamos tu asistencia.  favor de hacerle captura al qr.`;
          caption.hidden = false;
        }
      }

      if (autoSave && dataUrl) {
        const filename = `${filePrefix}${sanitizeFileName(family)}_${payload.code}.png`;
        const res = await saveToServer(dataUrl, filename);
        if (res && res.ok && res.path && caption) {
          // Mantener el mensaje; no agregamos ruta al texto para no distraer
        }
      }

      try { localStorage.setItem('qr:lastPayload', JSON.stringify(payload)); } catch {}
    });
  }

  window.GeneradorQR = {
    randomNonce,
    sanitizeFileName,
    buildPayload,
    generateDataURL,
    saveToServer,
    generateToImg,
    attachForm,
  };

  // Auto-enganchado si existe el formulario
  window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('qrForm')) attachForm({
      autoSave: true,
      // Para la simulación solicitada: mostrar una de estas imágenes al azar
      simulationImages: [
        './img/qr/qr1.png',
        './img/qr/qr2.png',
        './img/qr/qr3.png'
      ]
    });
  });
})();
