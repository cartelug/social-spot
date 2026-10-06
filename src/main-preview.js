import { boot } from './boot.js';
import { createPreviewBackend } from './backend-preview.js';
import { ASSETS } from './assets-preview.gen.js';

boot({ assets: ASSETS, mode: 'preview', makeBackend: createPreviewBackend });
