// Durable document store on Node's built-in SQLite (node:sqlite, Node 22.13+).
// Every document is one row of JSON; the whole set is mirrored in memory at boot,
// so reads are instant and the engine's write lock keeps the two in step.
// Run ONE server process per database file.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class SqliteStore {
  constructor(file) {
    mkdirSync(dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS docs (
        col TEXT NOT NULL,
        id TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (col, id)
      );
    `);
    this.upsert = this.db.prepare('INSERT INTO docs (col, id, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at');
    this.remove = this.db.prepare('DELETE FROM docs WHERE col = ? AND id = ?');
    this.cols = new Map();
    for (const row of this.db.prepare('SELECT col, id, data FROM docs').all()) {
      this._col(row.col).set(row.id, JSON.parse(row.data));
    }
  }
  _col(col) {
    if (!this.cols.has(col)) this.cols.set(col, new Map());
    return this.cols.get(col);
  }
  all(col) {
    return [...this._col(col).values()];
  }
  get(col, id) {
    return this._col(col).get(id) || null;
  }
  async put(col, doc) {
    if (!doc || typeof doc.id !== 'string') throw new Error('document needs a string id');
    const copy = structuredClone(doc);
    this.upsert.run(col, doc.id, JSON.stringify(copy), Date.now());
    this._col(col).set(doc.id, copy);
  }
  async del(col, id) {
    this.remove.run(col, id);
    this._col(col).delete(id);
  }
  dump() {
    const out = {};
    for (const [col, m] of this.cols) if (col !== 'staff') out[col] = [...m.values()];
    return out;
  }
  close() {
    this.db.close();
  }
}
