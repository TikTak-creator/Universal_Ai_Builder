const path = require('node:path');
const EXTERNAL_URLS = new Set(['https://fonts.google.com/', 'https://lucide.dev/license']);
const CSP = ["default-src 'none'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https: http:", "font-src 'self' data: blob:", "connect-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'none'", "frame-src 'none'", "frame-ancestors 'none'"].join('; ');

function assetPath(rawUrl, root) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'app:' || url.hostname !== 'forma' || url.port || url.username || url.password) return null;
    const pathname = decodeURIComponent(url.pathname);
    const parts = pathname.split('/').filter(Boolean);
    if (parts.some(p => p === '.' || p === '..' || /[\\\x00:]/.test(p))) return null;
    const target = path.resolve(root, ...(parts.length ? parts : ['index.html']));
    const rel = path.relative(root, target);
    return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? target : null;
  } catch { return null; }
}
function externalAllowed(url) { return EXTERNAL_URLS.has(url); }
function downloadName(name) {
  const safe = path.win32.basename(name).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/, '').slice(0, 180);
  return safe.toLowerCase().endsWith('.forma.json') ? safe : 'project.forma.json';
}
module.exports = { assetPath, externalAllowed, downloadName, CSP };
