// In-memory document store (tests, and the base for the persistent stores).
export class MemStore {
  constructor() {
    this.cols = new Map();
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
    this._col(col).set(doc.id, structuredClone(doc));
  }
  async del(col, id) {
    this._col(col).delete(id);
  }
}
