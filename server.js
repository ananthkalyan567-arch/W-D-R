/**
 * ASR Water & Drainage - Zero-Dependency Local Dev Server
 * Features:
 * 1. Serves frontend static files (HTML, CSS, JS, Images)
 * 2. Full REST API Engine for /api/v1/... (Auth, Complaints, Locations, Admin, Map, Analytics)
 * 3. CORS headers and preflight handling
 * Run using: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApiRequest } = require('./mock_api');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Delegate /api/v1/ REST API requests
  if (handleApiRequest(req, res)) {
    return;
  }

  // 2. Serve Static Frontend Files
  let reqUrl = req.url.split('?')[0];
  if (reqUrl === '/') reqUrl = '/index.html';

  let filePath = path.join(__dirname, reqUrl);

  // Check if directory was requested without index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>404 Not Found</h1><p>The requested file ${reqUrl} does not exist.</p><a href="/">Return Home</a>`);
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 ASR WATER & DRAINAGE - HYBRID DEV SERVER ACTIVE`);
  console.log(`======================================================`);
  console.log(`Citizen Portal:  http://localhost:${PORT}/`);
  console.log(`Report Problem:  http://localhost:${PORT}/report.html`);
  console.log(`Track Complaint: http://localhost:${PORT}/track.html`);
  console.log(`Problem Map:     http://localhost:${PORT}/map.html`);
  console.log(`Admin Portal:    http://localhost:${PORT}/admin/index.html`);
  console.log(`REST API Root:   http://localhost:${PORT}/api/v1/`);
  console.log(`======================================================\n`);
});
