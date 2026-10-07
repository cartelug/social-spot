import { app, html, icon } from './core.js';
import { photo } from './components.js';

// Native modal semantics keep keyboard focus inside the viewer and make the
// page beneath it inert. The route owns every listener and open modal.
export function mountPhotoViewer(root, ctx) {
  const items = [...root.querySelectorAll('[data-photo-open]')];
  let viewer;
  const open = (opener) => {
    let index = items.indexOf(opener);
    if (index < 0 || viewer?.open) return;
    if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) {
      const p = app.assets.photos[opener.dataset.photoOpen];
      const crop = p.crops.full || p.crops.tall || p.crops.card;
      const variants = crop.files.jpg;
      window.open(new URL(variants[variants.length - 1][1], document.baseURI), '_blank', 'noopener');
      return;
    }
    viewer = document.createElement('dialog');
    viewer.className = 'photo-viewer';
    viewer.setAttribute('aria-labelledby', 'photo-viewer-title');
    viewer.innerHTML = String(html`<header><p class="eyebrow">Inside Social Spot</p><button type="button" class="icon-btn" data-photo-close aria-label="Close photo viewer" autofocus>${icon('x')}</button></header><div data-photo-frame></div><footer><div><h2 id="photo-viewer-title"></h2><p class="photo-viewer-note" data-photo-note></p></div><div class="photo-viewer-controls"><button class="icon-btn" type="button" data-photo-prev aria-label="Previous photo">${icon('back')}</button><span data-photo-count role="status" aria-live="polite"></span><button class="icon-btn" type="button" data-photo-next aria-label="Next photo">${icon('arrow')}</button></div></footer>`);
    const show = () => {
      const button = items[index];
      const id = button.dataset.photoOpen;
      const p = app.assets.photos[id];
      const crop = ['full', 'tall', 'card', 'wide', 'band'].find((c) => p.crops[c]);
      viewer.querySelector('[data-photo-frame]').innerHTML = String(photo(id, crop, { eager: true, sizes: '(min-width: 1000px) 920px, 94vw' }));
      viewer.querySelector('#photo-viewer-title').textContent = button.dataset.photoTitle || p.alt;
      viewer.querySelector('[data-photo-note]').textContent = p.note || p.alt;
      viewer.querySelector('[data-photo-count]').textContent = `${index + 1} / ${items.length}`;
    };
    const move = (direction) => { index = (index + direction + items.length) % items.length; show(); };
    const overflow = document.body.style.overflow;
    viewer.addEventListener('close', (event) => {
      document.body.style.overflow = overflow;
      event.currentTarget.remove();
      if (opener.isConnected) opener.focus({ preventScroll: true });
    }, { once: true });
    viewer.addEventListener('click', (event) => {
      if (event.target.closest('[data-photo-close]')) viewer.close();
      if (event.target.closest('[data-photo-prev]')) move(-1);
      if (event.target.closest('[data-photo-next]')) move(1);
      // Close only a real backdrop click, not padding around the photograph.
      if (event.target === viewer) {
        const box = viewer.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) viewer.close();
      }
    });
    viewer.addEventListener('keydown', (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Tab') {
        const buttons = [...viewer.querySelectorAll('button:not([disabled])')];
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
    });
    show();
    document.body.append(viewer);
    document.body.style.overflow = 'hidden';
    viewer.showModal();
  };
  const onClick = (event) => { const button = event.target.closest('[data-photo-open]'); if (button) open(button); };
  root.addEventListener('click', onClick);
  ctx.onCleanup(() => { root.removeEventListener('click', onClick); viewer?.close(); });
}
