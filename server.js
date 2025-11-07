// Minimal local server to save QR PNGs to Dani-fiesta/img
// Run: node Dani-fiesta/server.js
// Then the page will POST data URLs to /save-qr and the server will write them.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8787;
const IMG_DIR = path.join(__dirname, 'img');
const QR_DIR = path.join(IMG_DIR, 'qr');

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.url === '/health') return send(res, 200, { ok: true });

  if (req.method === 'POST' && req.url === '/save-qr') {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        const { name, dataUrl } = JSON.parse(data || '{}');
        if (!name || !dataUrl || !dataUrl.startsWith('data:image/png'))
          return send(res, 400, { error: 'invalid payload' });

        const base64 = dataUrl.split(',')[1];
        const safe = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        // Ensure subfolder img/qr exists
        fs.mkdir(QR_DIR, { recursive: true }, (mkErr) => {
          if (mkErr) return send(res, 500, { error: 'mkdir_failed', details: String(mkErr) });
          const filePath = path.join(QR_DIR, safe);
          fs.writeFile(filePath, base64, { encoding: 'base64' }, (err) => {
            if (err) return send(res, 500, { error: 'write_failed', details: String(err) });
            send(res, 200, { ok: true, path: `img/qr/${safe}` });
          });
        });
      } catch (e) {
        send(res, 400, { error: 'bad_json', details: String(e) });
      }
    });
    return;
  }

  send(res, 404, { error: 'not_found' });
});

server.listen(PORT, () => {
  console.log(`[qr-server] listening on http://localhost:${PORT}`);
});
