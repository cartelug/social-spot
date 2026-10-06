// Talks to the Social Spot server's JSON API.
// The server's address comes from config.js ({ api: '' } = the server that served this page).
const TOKEN_KEY = 'ss-staff-token';

export class ApiUnavailable extends Error {
  constructor(reason, api) {
    super(reason);
    this.reason = reason;
    this.api = api;
  }
}

export function apiBase() {
  const cfg = window.SOCIAL_SPOT || {};
  return String(cfg.api || '').trim().replace(/\/+$/, '');
}

export function createHttpBackend() {
  const api = apiBase();
  let token = null;
  try { token = localStorage.getItem(TOKEN_KEY); } catch { /* storage blocked: keep it in memory */ }
  const setToken = (t) => {
    token = t || null;
    try { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  };

  async function post(path, body) {
    let res;
    try {
      res = await fetch(api + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body || {}),
        credentials: 'omit',
      });
    } catch {
      throw Object.assign(new Error('No connection. Check your internet and try again.'), { code: 'offline' });
    }
    let j = null;
    try { j = await res.json(); } catch { /* not the Social Spot API */ }
    if (!j || typeof j.ok !== 'boolean') {
      throw new ApiUnavailable(res.status === 404 || res.status === 405 ? 'no server at this address' : `the server replied ${res.status}`, api);
    }
    if (!j.ok) {
      if (res.status === 401 || j.code === 'forbidden') { if (path.startsWith('/api/auth/me')) setToken(null); }
      throw Object.assign(new Error(j.error || 'Something went wrong.'), { code: j.code, status: res.status });
    }
    return j.data;
  }

  return {
    mode: 'server',
    api,
    call: (method, params) => post(`/api/rpc/${method}`, params),
    me: async () => (token ? post('/api/auth/me').catch(() => null) : null),
    login: async (v) => {
      const r = await post('/api/auth/login', v);
      setToken(r.token);
      return r.staff;
    },
    logout: async () => { setToken(null); },
  };
}
