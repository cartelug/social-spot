import { boot } from './boot.js';
import { createHttpBackend } from './backend-http.js';
import { createBrochureBackend } from './backend-brochure.js';
import { ASSETS } from './assets-server.gen.js';

const start = () => boot({ assets: ASSETS, mode: 'server', makeBackend: async () => createHttpBackend(), fallbackBackend: createBrochureBackend });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
