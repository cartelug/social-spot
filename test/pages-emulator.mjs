// Behaves like GitHub Pages for tests: serves this folder under /<repo>/, answers
// unknown paths with 404.html (status 404) and has no API. Optionally overrides
// config.js to point at a Social Spot server, as a site owner would.
//   node test/pages-emulator.mjs 3300 social-spot http://localhost:3100
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [port = '3300', repo = 'social-spot', api = ''] = process.argv.slice(2);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.avif': 'image/avif', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
const prefix = `/${repo}/`;

async function fileAt(rel) {
  const f = resolve(join(ROOT, rel));
  if (!f.startsWith(ROOT)) return null;
  try {
    const st = await stat(f);
    if (st.isDirectory()) return fileAt(join(rel, 'index.html'));
    return f;
  } catch { return null; }
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === `/${repo}`) { res.writeHead(301, { Location: prefix }); return res.end(); }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { 'Content-Type': 'text/html' }); return res.end('<h1>405 Not Allowed</h1>'); }
  if (path === `${prefix}config.js` && api) {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    return res.end(`window.SOCIAL_SPOT = { api: ${JSON.stringify(api)} };\n`);
  }
  const file = path.startsWith(prefix) ? await fileAt(path.slice(prefix.length) || 'index.html') : null;
  if (file) {
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    return res.end(await readFile(file));
  }
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(await readFile(join(ROOT, '404.html')));
}).listen(Number(port), () => console.log(`pages emulator on http://localhost:${port}${prefix} (api: ${api || 'none'})`));
