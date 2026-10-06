// Live preview backend: the same engine as the server, running in the page,
// with its data in the artifact's own database (db capability).
import { createEngine } from '../shared/engine.js';
import { MemStore } from '../shared/memstore.js';
import { UserError } from '../shared/util.js';

const COLS = ['settings', 'orders', 'bookings', 'scans', 'waitlist', 'ambassadors', 'outbox'];

class ArtifactStore {
  constructor(db) {
    this.db = db;
    this.cols = new Map();
    this.unsubs = [];
  }
  _col(col) {
    if (!this.cols.has(col)) this.cols.set(col, new Map());
    return this.cols.get(col);
  }
  init() {
    return Promise.all(COLS.map((name) => new Promise((resolve) => {
      let first = true;
      const done = () => { if (first) { first = false; resolve(); } };
      const unsub = this.db.collection(name).onSnapshot((snap) => {
        const m = new Map();
        for (const d of snap.docs) if (d.exists) m.set(d.id, structuredClone(d.data()));
        this.cols.set(name, m);
        done();
      }, () => done());
      this.unsubs.push(unsub);
      setTimeout(done, 9000);
    })));
  }
  all(col) { return [...this._col(col).values()]; }
  get(col, id) { return this._col(col).get(id) || null; }
  async put(col, doc) {
    const copy = structuredClone(doc);
    try {
      await this.db.collection(col).doc(doc.id).set(copy);
    } catch (e) {
      if (e && e.code === 'invalid_argument') throw new UserError('This preview is view-only for you. Orders and bookings work on the live website.');
      if (e && e.code === 'quota_exceeded') throw new UserError('The preview’s storage is full. Clear test data in Admin → Settings.');
      throw new UserError('Couldn’t save just now. Please try again.');
    }
    this._col(col).set(doc.id, copy);
  }
  async del(col, id) {
    await this.db.collection(col).doc(id).delete();
    this._col(col).delete(id);
  }
}

export async function createPreviewBackend() {
  const c = window.claude;
  const use = (name) => (c && typeof c.use === 'function' ? c.use(name).catch(() => null) : Promise.resolve(null));
  const [db, user, downloads] = await Promise.all([use('db'), use('user'), use('downloads')]);
  let store = new MemStore();
  let persistent = false;
  if (db) {
    const s = new ArtifactStore(db);
    try { await s.init(); store = s; persistent = true; } catch { /* fall back to memory */ }
  }
  const isOwner = user ? await user.isOwner() : false;
  const canWrite = user ? await user.can('data.write') : null;
  const admin = isOwner || canWrite === true || (!db && !user);
  const engine = createEngine({ store, host: { mode: 'preview' } });
  const ctx = admin ? { role: 'admin', staffName: 'Owner' } : { role: 'public' };
  return {
    mode: 'preview',
    persistent,
    call: (method, params) => engine.call(method, params, ctx),
    me: async () => (admin ? { name: 'Owner (preview)', role: 'admin', id: 'owner' } : null),
    login: async () => { throw new UserError('Sign-in is for the live website.'); },
    logout: async () => {},
    saveFile: downloads
      ? async (filename, text) => {
          try { await downloads.save({ filename, data: text }); return true; } catch (e) {
            if (e && e.code === 'declined') return false;
            throw new UserError('Downloads aren’t available in this view.');
          }
        }
      : async () => { throw new UserError('Downloads aren’t available in this view.'); },
  };
}
