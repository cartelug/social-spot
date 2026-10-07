// Social Spot web server — no dependencies beyond Node 22.13+.
//   npm start            (PORT, DATA_DIR, PUBLIC_URL, ADMIN_EMAIL, ADMIN_PASSWORD ... see README)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { SqliteStore } from './store.js';
import { createAuth } from './auth.js';
import { createSms } from './sms.js';
import { createEngine } from '../shared/engine.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The website lives at the top of this folder (index.html beside package.json).
// Only these files and folders are ever served; server code and data never are.
const PUBLIC_FILES = new Set(['index.html', '404.html', 'config.js', 'manifest.webmanifest', 'robots.txt']);
const PUBLIC_DIRS = new Set(['assets', 'fonts', 'vendor']);
const isPublic = (rel) => {
  const parts = rel.split('/').filter(Boolean);
  if (!parts.length || parts.some((p) => p.startsWith('.'))) return false;
  if (parts.length === 1) return PUBLIC_FILES.has(parts[0]) || /^app\.[0-9a-f]{8}\.(js|css)$/.test(parts[0]);
  return PUBLIC_DIRS.has(parts[0]);
};
const env = process.env;
const PORT = Number(env.PORT || 3000);
const DATA_DIR = resolve(env.DATA_DIR || join(ROOT, 'data'));
const PUBLIC_URL = (env.PUBLIC_URL || '').replace(/\/+$/, '');
const log = console;

mkdirSync(DATA_DIR, { recursive: true });
const secretFile = join(DATA_DIR, '.session-secret');
const SECRET = env.SESSION_SECRET || (existsSync(secretFile) ? readFileSync(secretFile, 'utf8').trim() : (() => { const s = randomBytes(32).toString('hex'); writeFileSync(secretFile, s, { mode: 0o600 }); return s; })());

const store = new SqliteStore(join(DATA_DIR, 'socialspot.db'));
const auth = createAuth({ store, secret: SECRET });
const sms = createSms({ store, env, log });
const engine = createEngine({
  store,
  host: { mode: 'server', publicUrl: PUBLIC_URL, dispatch: sms.enabled, smsEnabled: () => sms.enabled, onMessage: () => sms.kick(), requireMerchant: true },
});

if (await auth.ensureBootstrap({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD, name: env.ADMIN_NAME })) {
  log.info(`[setup] created the first admin account for ${env.ADMIN_EMAIL}`);
} else if (!auth.list().length) {
  log.warn('[setup] no staff accounts yet. Set ADMIN_EMAIL and ADMIN_PASSWORD, or run: npm run create-staff -- --email you@example.com --name "Your Name" --role admin --password "..."');
}
sms.start();

// ------------------------------------------------------------------ helpers
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
};
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()',
};
// Allow index.html's small inline start-up script by its hash.
const inlineHashes = (() => {
  try {
    const page = readFileSync(join(ROOT, 'index.html'), 'utf8');
    return [...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  } catch { return []; }
})();
const CSP = `default-src 'self'; script-src 'self' ${inlineHashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}
function json(res, status, obj, extra = {}) {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS, ...extra });
}
function clientIp(req) {
  if (env.TRUST_PROXY !== '0') {
    const f = req.headers['x-forwarded-for'];
    if (f) return String(f).split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}
async function readBody(req, limit = 64 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error('Request too large.'), { user: true, status: 413 });
    chunks.push(c);
  }
  if (!size) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw Object.assign(new Error('Bad request.'), { user: true }); }
}

// simple per-key sliding window limiter
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 15 * 60e3)) hits.delete(k); }, 5 * 60e3).unref();

// ------------------------------------------------------------------ API
async function handleApi(req, res, path) {
  // Any site may call the API (e.g. the website on GitHub Pages). Staff actions need a
  // bearer token, which a browser never attaches on its own, so this is safe.
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Use POST.' });
  const ip = clientIp(req);
  let body;
  try { body = await readBody(req); } catch (e) { return json(res, e.status || 400, { ok: false, error: e.message }); }
  const staff = auth.fromRequest(req);
  const ctx = staff ? { role: staff.role, staffId: staff.id, staffName: staff.name } : { role: 'public' };

  try {
    if (path === '/api/auth/login') {
      const email = String(body.email || '').toLowerCase();
      if (limited(`login:${ip}`, 20, 15 * 60e3) || limited(`login:${email}`, 8, 15 * 60e3)) return json(res, 429, { ok: false, error: 'Too many attempts. Wait 15 minutes and try again.' });
      const s = await auth.login(body.email, body.password);
      if (!s) return json(res, 401, { ok: false, error: 'Wrong email or password.' });
      return json(res, 200, { ok: true, data: { staff: auth.publicStaff(s), token: auth.issue(s) } });
    }
    if (path === '/api/auth/logout') return json(res, 200, { ok: true, data: null });
    if (path === '/api/auth/me') return json(res, 200, { ok: true, data: staff ? auth.publicStaff(staff) : null });

    const m = path.match(/^\/api\/rpc\/([a-zA-Z.]+)$/);
    if (!m) return json(res, 404, { ok: false, error: 'Not found.' });
    const method = m[1];

    // staff management lives on the server, not in the shared engine
    if (method.startsWith('staff.')) {
      if (ctx.role !== 'admin') return json(res, 403, { ok: false, error: 'Admins only.', code: 'forbidden' });
      if (method === 'staff.list') return json(res, 200, { ok: true, data: { rows: auth.list(), me: staff.id } });
      if (method === 'staff.save') return json(res, 200, { ok: true, data: await auth.save(body) });
      return json(res, 404, { ok: false, error: 'Unknown action.' });
    }
    if (method === 'admin.backup') {
      if (ctx.role !== 'admin') return json(res, 403, { ok: false, error: 'Admins only.', code: 'forbidden' });
      return json(res, 200, { ok: true, data: { exportedAt: Date.now(), collections: store.dump() } });
    }

    const def = engine.methods[method];
    if (def && def.limited && ctx.role === 'public') {
      // generous per-IP limits: many phones share one mobile-network IP
      const creates = method === 'order.create' || method === 'booking.create' || method === 'waitlist.join';
      if (limited(`rpc:${ip}`, 90, 60e3) || (creates && limited(`${method}:${ip}`, 25, 10 * 60e3))) {
        return json(res, 429, { ok: false, error: 'Too many requests. Please wait a few minutes and try again.' });
      }
    }
    const data = await engine.call(method, body, ctx);
    return json(res, 200, { ok: true, data });
  } catch (e) {
    if (e && e.user) {
      const status = e.code === 'forbidden' ? 403 : e.code === 'not_found' ? 404 : e.status || 400;
      return json(res, status, { ok: false, error: e.message, code: e.code || 'invalid' });
    }
    log.error('[api]', path, e);
    return json(res, 500, { ok: false, error: 'Something went wrong on our side. Please try again.' });
  }
}

// ------------------------------------------------------------------ static files + SPA routes
const fileCache = new Map();
async function serveFile(req, res, file, { spa = false } = {}) {
  let entry = fileCache.get(file);
  if (!entry || env.NODE_ENV !== 'production') {
    const st = await stat(file);
    if (!entry || entry.mtime !== st.mtimeMs) {
      let raw = await readFile(file);
      if (file.endsWith('index.html')) {
        // served by this server: the site sits at '/', and links/OG image use PUBLIC_URL
        raw = Buffer.from(raw.toString('utf8').replace('<meta name="ss-base" content="">', '<meta name="ss-base" content="/">').replace('content="assets/og.jpg"', `content="${PUBLIC_URL ? PUBLIC_URL + '/' : '/'}assets/og.jpg"`));
      }
      const type = MIME[extname(file)] || 'application/octet-stream';
      const gz = /^(text|application\/(json|manifest)|image\/svg)/.test(type) && raw.length > 1024 ? gzipSync(raw) : null;
      entry = { raw, gz, type, mtime: st.mtimeMs };
      fileCache.set(file, entry);
    }
  }
  const versioned = /\/(assets|fonts|vendor)\//.test(file) || /\.[0-9a-f]{8}\.(js|css)$/.test(file);
  const headers = { 'Content-Type': entry.type, 'Cache-Control': spa || file.endsWith('config.js') ? 'no-cache' : versioned ? 'public, max-age=604800' : 'public, max-age=300', Vary: 'Accept-Encoding' };
  if (entry.type.startsWith('text/html')) headers['Content-Security-Policy'] = CSP;
  const useGz = entry.gz && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  if (useGz) headers['Content-Encoding'] = 'gzip';
  send(res, 200, req.method === 'HEAD' ? '' : useGz ? entry.gz : entry.raw, headers);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://local');
    const path = decodeURIComponent(url.pathname);
    if (path === '/healthz') return send(res, 200, 'ok', { 'Content-Type': 'text/plain' });
    if (path.startsWith('/api/')) return await handleApi(req, res, path);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    const rel = path.replace(/^\/+/, '');
    const file = resolve(join(ROOT, rel));
    if (file.startsWith(ROOT + '/') && isPublic(rel) && extname(file) && existsSync(file)) return await serveFile(req, res, file, { spa: rel === 'index.html' });
    if (extname(path) && !path.endsWith('.html')) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
    return await serveFile(req, res, join(ROOT, 'index.html'), { spa: true });
  } catch (e) {
    log.error('[http]', e);
    if (!res.headersSent) send(res, 500, 'Server error', { 'Content-Type': 'text/plain' });
  }
});

server.listen(PORT, () => {
  log.info(`Social Spot running on http://localhost:${PORT}  (data: ${DATA_DIR}${PUBLIC_URL ? `, public URL: ${PUBLIC_URL}` : ''}, SMS: ${sms.enabled ? 'on' : 'off'})`);
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { server.close(); store.close(); process.exit(0); });
