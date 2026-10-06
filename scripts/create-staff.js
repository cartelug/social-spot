// Create or update a staff login from the command line.
//   npm run create-staff -- --email you@example.com --name "Your Name" --role admin --password "a long password"
// Roles: admin (everything) or door (scanner, guest lookup and door sales only).
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SqliteStore } from '../server/store.js';
import { createAuth } from '../server/auth.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1];

if (!args.email || !args.password) {
  console.error('Usage: npm run create-staff -- --email you@example.com --name "Your Name" --role admin|door --password "at least 8 characters"');
  process.exit(1);
}
const store = new SqliteStore(join(resolve(process.env.DATA_DIR || join(ROOT, 'data')), 'socialspot.db'));
const auth = createAuth({ store, secret: 'cli' });
const existing = store.all('staff').find((s) => s.email === args.email.toLowerCase());
try {
  const s = await auth.save({ id: existing && existing.id, name: args.name || (existing && existing.name) || 'Staff', email: args.email, role: args.role || (existing && existing.role) || 'admin', password: args.password, active: true });
  console.log(`${existing ? 'Updated' : 'Created'} ${s.role} account for ${s.email}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
} finally {
  store.close();
}
