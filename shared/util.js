// Shared helpers — run unchanged in Node (server) and in the browser (preview build).
// Uganda keeps East Africa Time (UTC+3) all year, with no daylight saving,
// so every local date/time conversion is a fixed +3h shift.

const EAT_MS = 3 * 3600 * 1000;
const DAY_MS = 24 * 3600 * 1000;

export const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // no 0/O/1/I — easy to read aloud at a gate
const TOKEN_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789';

function rng(n) {
  const a = new Uint8Array(n);
  globalThis.crypto.getRandomValues(a);
  return a;
}
export function randomString(len, alphabet = CODE_ALPHABET) {
  // rejection sampling keeps the distribution uniform
  let out = '';
  const max = 256 - (256 % alphabet.length);
  while (out.length < len) {
    for (const b of rng(len * 2)) {
      if (b < max) out += alphabet[b % alphabet.length];
      if (out.length === len) break;
    }
  }
  return out;
}
export const newId = (prefix) => prefix + randomString(12);
export const newToken = () => randomString(26, TOKEN_ALPHABET);
export const newPassCode = () => { const s = randomString(8); return `SS-${s.slice(0, 4)}-${s.slice(4)}`; };
export const newOrderRef = () => `RPL-${randomString(6)}`;
export const newBookingCode = () => `SB-${randomString(6)}`;

/** Normalise anything typed at a gate into a pass code: "ss7kq2m9xd" -> "SS-7KQ2-M9XD". */
export function normalizeCode(raw) {
  const s = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (/^SS[A-Z0-9]{8}$/.test(s)) return `SS-${s.slice(2, 6)}-${s.slice(6)}`;
  if (/^RPL[A-Z0-9]{6}$/.test(s)) return `RPL-${s.slice(3)}`;
  if (/^SB[A-Z0-9]{6}$/.test(s)) return `SB-${s.slice(2)}`;
  return s;
}

// ---------- time (EAT) ----------
export function eatDate(ms) {
  return new Date(ms + EAT_MS).toISOString().slice(0, 10);
}
export function eatTime(ms) {
  return new Date(ms + EAT_MS).toISOString().slice(11, 16);
}
/** "2026-12-12" + "16:00" (EAT) -> epoch ms */
export function eatToMs(date, time = '00:00') {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - EAT_MS;
}
/** "2026-10-12T00:00" (EAT) -> ms */
export function eatStampToMs(stamp) {
  if (!stamp) return null;
  const [d, t = '00:00'] = stamp.split('T');
  return eatToMs(d, t);
}
export function addDays(date, n) {
  return eatDate(eatToMs(date, '12:00') + n * DAY_MS);
}
export function dowOf(date) {
  return new Date(eatToMs(date, '12:00') + EAT_MS).getUTCDay();
}
export function daysBetween(a, b) {
  return Math.round((eatToMs(b, '12:00') - eatToMs(a, '12:00')) / DAY_MS);
}
export function isDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && eatDate(eatToMs(s, '12:00')) === s;
}
export function isTime(s) {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}
export function minutesOf(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
export function timeOf(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export { DOW, DOW_LONG };

export function fmtDate(date, opts = {}) {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  const dw = (opts.long ? DOW_LONG : DOW)[dowOf(date)];
  const mo = (opts.longMonth ? MON_LONG : MON)[m - 1];
  return `${opts.noDow ? '' : dw + ' '}${d} ${mo}${opts.year ? ' ' + y : ''}`;
}
export function fmtTime(t) {
  if (!t) return '';
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
}
export function fmtStamp(ms) {
  if (!ms) return '';
  return `${fmtDate(eatDate(ms))}, ${fmtTime(eatTime(ms))}`;
}

// ---------- money ----------
export function fmtMoney(n, currency = 'UGX') {
  const v = Math.round(Number(n) || 0);
  return `${currency} ${v.toLocaleString('en-US')}`;
}
export const fmtUGX = (n) => fmtMoney(n, 'UGX');

// ---------- phones (Uganda first) ----------
/** Returns E.164 (+2567XXXXXXXX) or null. Accepts 07…, 7…, 2567…, +2567…, and other +country numbers. */
export function normPhone(raw) {
  let s = String(raw || '').trim().replace(/[\s\-().]/g, '');
  if (!s) return null;
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (/^0\d{9}$/.test(s)) s = '+256' + s.slice(1);
  else if (/^[37]\d{8}$/.test(s)) s = '+256' + s;
  else if (/^256\d{9}$/.test(s)) s = '+' + s;
  if (/^\+256[37]\d{8}$/.test(s)) return s;
  if (/^\+(?!256)\d{8,15}$/.test(s)) return s;
  return null;
}
export function displayPhone(e164) {
  if (!e164) return '';
  if (e164.startsWith('+256') && e164.length === 13) {
    const n = '0' + e164.slice(4);
    return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
  }
  return e164;
}
export function waNumber(e164) {
  return String(e164 || '').replace(/^\+/, '');
}

// ---------- text ----------
export function cleanText(s, max = 120) {
  return String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
export function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || ''));
}
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function csvCell(v) {
  const s = String(v ?? '');
  // neutralise spreadsheet formula injection
  const safe = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
export function toCsv(rows) {
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function deepMerge(base, over) {
  if (over === undefined) return structuredClone(base);
  if (Array.isArray(base) || Array.isArray(over) || typeof base !== 'object' || base === null || typeof over !== 'object' || over === null) {
    return structuredClone(over);
  }
  const out = structuredClone(base);
  for (const k of Object.keys(over)) out[k] = k in base ? deepMerge(base[k], over[k]) : structuredClone(over[k]);
  return out;
}

export function createMutex() {
  let tail = Promise.resolve();
  return function run(fn) {
    const p = tail.then(fn, fn);
    tail = p.then(() => {}, () => {});
    return p;
  };
}

export class UserError extends Error {
  constructor(message, code = 'invalid') {
    super(message);
    this.code = code;
    this.user = true;
  }
}
