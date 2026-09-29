// Local dev server: serves index.html and runs api/*.js like Vercel functions.
// Usage: node dev-server.js  ->  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');

process.loadEnvFile(path.join(__dirname, '.env.local'));

const PORT = process.env.PORT || 3000;
const API_DIR = path.join(__dirname, 'api');

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      if (!data) return resolve(undefined);
      try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
    });
  });
}

function addVercelHelpers(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(obj));
    return res;
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-zA-Z0-9_-]/g, '');
    const file = path.join(API_DIR, name + '.js');
    if (!name || !fs.existsSync(file)) {
      res.statusCode = 404;
      return res.end('Not found');
    }
    req.query = Object.fromEntries(url.searchParams);
    req.body = await readBody(req);
    addVercelHelpers(res);
    try {
      delete require.cache[require.resolve(file)];
      await require(file)(req, res);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: String(e.message || e) });
    }
    console.log(req.method, url.pathname, res.statusCode);
    return;
  }

  // Only serve the page itself; never expose key files in this folder.
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
  }
  res.statusCode = 404;
  res.end('Not found');
});

server.listen(PORT, () => console.log(`Dev server: http://localhost:${PORT}`));
