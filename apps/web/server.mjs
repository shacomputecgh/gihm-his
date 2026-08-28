import { createServer, request as httpRequest } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST = join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ico':  'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

function proxyRequest(clientReq, clientRes) {
  const opts = {
    hostname: '127.0.0.1',
    port: 4000,
    path: clientReq.url,
    method: clientReq.method,
    headers: { ...clientReq.headers, host: '127.0.0.1:4000' },
  };

  const proxyReq = httpRequest(opts, (proxyRes) => {
    const chunks = [];
    proxyRes.on('data', (chunk) => chunks.push(chunk));
    proxyRes.on('end', () => {
      const body = Buffer.concat(chunks);
      const headers = { ...proxyRes.headers };
      headers['access-control-allow-origin'] = '*';
      clientRes.writeHead(proxyRes.statusCode, headers);
      clientRes.end(body);
    });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'application/json' });
    }
    clientRes.end(JSON.stringify({ error: 'API backend unavailable' }));
  });

  // Forward request body
  const chunks = [];
  clientReq.on('data', (chunk) => chunks.push(chunk));
  clientReq.on('end', () => {
    proxyReq.end(Buffer.concat(chunks));
  });
}

function serveStatic(req, res) {
  const urlPath = req.url.split('?')[0];
  let filePath = join(DIST, urlPath === '/' ? 'index.html' : urlPath);
  
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = join(DIST, 'index.html');
  }

  try {
    const ext = extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    const content = readFileSync(filePath);
    res.writeHead(200, { 
      'Content-Type': mime, 
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

const server = createServer((req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  if (req.url.startsWith('/api/')) {
    proxyRequest(req, res);
  } else {
    serveStatic(req, res);
  }
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`GIHM-HIS running at http://localhost:${PORT}`);
});
