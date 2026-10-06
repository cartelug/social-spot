// Used when this copy of the website can't reach the Social Spot server
// (for example GitHub Pages without an api address in config.js).
// Visitors still see every page, prices and the programme; anything that would
// create or change a booking or ticket asks them to call instead.
import { createEngine } from '../shared/engine.js';
import { MemStore } from '../shared/memstore.js';
import { UserError } from '../shared/util.js';

const READS = new Set(['site.get', 'booking.availability']);

export function createBrochureBackend() {
  const engine = createEngine({ store: new MemStore(), host: { mode: 'server', publicUrl: '' } });
  const phone = () => engine.settings().venue.phone;
  return {
    mode: 'server',
    brochure: true,
    call: async (method, params) => {
      if (READS.has(method)) return engine.call(method, params, { role: 'public' });
      throw new UserError(`Online tickets and bookings aren’t available right now. Call ${phone()} and we’ll book you in.`, 'offline');
    },
    me: async () => null,
    login: async () => { throw new UserError('The staff area needs the Social Spot server. See the setup notes.'); },
    logout: async () => {},
  };
}
