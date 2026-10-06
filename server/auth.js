// Staff accounts (admin, door) with scrypt passwords and signed bearer tokens.
// Tokens travel in the Authorization header (never cookies), so the website can be
// hosted on another domain (GitHub Pages) without opening the door to CSRF.
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { newId } from '../shared/util.js';

const SESSION_HOURS = 14; // covers a full event day shift

export function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}
export function checkPassword(pw, stored) {
  try {
    const [, s, h] = String(stored).split('$');
    const hash = scryptSync(pw, Buffer.from(s, 'base64'), 32, { N: 16384, r: 8, p: 1 });
    const want = Buffer.from(h, 'base64');
    return want.length === hash.length && timingSafeEqual(want, hash);
  } catch {
    return false;
  }
}

export function createAuth({ store, secret }) {
  const sign = (v) => createHmac('sha256', secret).update(v).digest('base64url');
  const staff = () => store.all('staff');

  function publicStaff(s) {
    return { id: s.id, name: s.name, email: s.email, role: s.role, active: s.active !== false, createdAt: s.createdAt, lastLoginAt: s.lastLoginAt || null };
  }

  function issue(s) {
    const payload = Buffer.from(JSON.stringify({ id: s.id, v: s.sessionVersion || 1, exp: Date.now() + SESSION_HOURS * 3600e3 })).toString('base64url');
    return `${payload}.${sign(payload)}`;
  }
  function fromRequest(req) {
    const h = String(req.headers.authorization || '');
    const raw = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
    if (!raw) return null;
    const [payload, sig] = raw.split('.');
    if (!payload || !sig) return null;
    const good = sign(payload);
    if (good.length !== sig.length || !timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
    let data;
    try { data = JSON.parse(Buffer.from(payload, 'base64url').toString()); } catch { return null; }
    if (!data || data.exp < Date.now()) return null;
    const s = store.get('staff', data.id);
    if (!s || s.active === false || (s.sessionVersion || 1) !== data.v) return null;
    return s;
  }

  async function login(email, password) {
    const e = String(email || '').trim().toLowerCase();
    const s = staff().find((x) => x.email === e && x.active !== false);
    // run the hash even for unknown emails so timing doesn't reveal accounts
    const ok = checkPassword(String(password || ''), s ? s.passwordHash : 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
    if (!s || !ok) return null;
    await store.put('staff', { ...s, lastLoginAt: Date.now() });
    return s;
  }

  async function save({ id, name, email, role, password, active }) {
    const e = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw Object.assign(new Error('Enter a valid email address.'), { user: true });
    if (!['admin', 'door'].includes(role)) throw Object.assign(new Error('Role must be admin or door.'), { user: true });
    const n = String(name || '').trim().slice(0, 60);
    if (n.length < 2) throw Object.assign(new Error('Add a name.'), { user: true });
    const existing = id ? store.get('staff', id) : null;
    if (staff().some((x) => x.email === e && (!existing || x.id !== existing.id))) throw Object.assign(new Error('That email already has an account.'), { user: true });
    if (!existing && (!password || password.length < 8)) throw Object.assign(new Error('Passwords need at least 8 characters.'), { user: true });
    if (password && password.length < 8) throw Object.assign(new Error('Passwords need at least 8 characters.'), { user: true });
    const doc = existing ? { ...existing } : { id: newId('U'), createdAt: Date.now(), sessionVersion: 1 };
    doc.name = n;
    doc.email = e;
    doc.role = role;
    doc.active = active !== false;
    if (password) { doc.passwordHash = hashPassword(password); doc.sessionVersion = (doc.sessionVersion || 1) + (existing ? 1 : 0); }
    if (existing && existing.role === 'admin' && (doc.role !== 'admin' || !doc.active)) {
      const admins = staff().filter((x) => x.role === 'admin' && x.active !== false && x.id !== existing.id);
      if (!admins.length) throw Object.assign(new Error('Keep at least one active admin.'), { user: true });
    }
    await store.put('staff', doc);
    return publicStaff(doc);
  }

  async function ensureBootstrap({ email, password, name }) {
    if (staff().length) return false;
    if (!email || !password) return false;
    await save({ name: name || 'Admin', email, role: 'admin', password });
    return true;
  }

  return { issue, fromRequest, login, save, ensureBootstrap, list: () => staff().map(publicStaff), publicStaff, SESSION_HOURS };
}
