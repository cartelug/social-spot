// QR codes: drawing (qrcode-generator) and reading (BarcodeDetector, jsQR fallback).
import { app } from './core.js';

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('A component failed to load. Check your connection and reload.'));
    document.head.append(s);
  });
}
let qrLib = null;
export function ensureQr() {
  if (window.qrcode) return Promise.resolve();
  if (!qrLib) qrLib = loadScript(app.assets.qrLib).catch((e) => { qrLib = null; throw e; });
  return qrLib;
}
let readerLib = null;
function ensureReader() {
  if (window.jsQR) return Promise.resolve();
  if (!readerLib) readerLib = loadScript(app.assets.jsqrLib).catch((e) => { readerLib = null; throw e; });
  return readerLib;
}

/** Crisp SVG QR (dark modules on white, quiet zone included). */
export function qrSvg(text) {
  const q = window.qrcode(0, 'M');
  q.addData(text);
  q.make();
  const n = q.getModuleCount();
  const m = 3;
  const size = n + m * 2;
  let d = '';
  for (let r = 0; r < n; r++) {
    let run = 0;
    for (let c = 0; c <= n; c++) {
      const dark = c < n && q.isDark(r, c);
      if (dark) run++;
      if ((!dark || c === n) && run) { d += `M${c - run + m} ${r + m}h${run}v1h-${run}z`; run = 0; }
    }
  }
  return `<svg viewBox="0 0 ${size} ${size}" role="img" aria-label="QR code for ${text}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="#ffffff"/><path d="${d}" fill="#0b0a0a"/></svg>`;
}
export async function fillQrs(root) {
  const els = root.querySelectorAll('[data-qr]');
  if (!els.length) return;
  try {
    await ensureQr();
    els.forEach((el) => { el.innerHTML = qrSvg(el.dataset.qr); });
  } catch (e) {
    els.forEach((el) => { el.innerHTML = `<p class="small">QR couldn’t load. Show this code at the gate: <b class="mono">${el.dataset.qr}</b></p>`; });
  }
}

async function nativeDetector() {
  if (!('BarcodeDetector' in window)) return null;
  try {
    const f = await window.BarcodeDetector.getSupportedFormats();
    if (f.includes('qr_code')) return new window.BarcodeDetector({ formats: ['qr_code'] });
  } catch { /* unsupported */ }
  return null;
}
export const cameraAvailable = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && app.mode === 'server';

/** Live camera scanning. Returns a stop() function. */
export async function startCamera(video, onCode) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
  video.setAttribute('playsinline', '');
  video.muted = true;
  video.srcObject = stream;
  await video.play();
  const det = await nativeDetector();
  if (!det) await ensureReader();
  const canvas = document.createElement('canvas');
  const g = canvas.getContext('2d', { willReadFrequently: true });
  let stopped = false, last = '', lastAt = 0;
  const tick = async () => {
    if (stopped) return;
    try {
      if (video.readyState >= 2) {
        let code = null;
        if (det) {
          const r = await det.detect(video);
          if (r.length) code = r[0].rawValue;
        } else {
          const w = video.videoWidth, h = video.videoHeight;
          const k = Math.min(1, 720 / Math.max(w, h));
          canvas.width = Math.round(w * k); canvas.height = Math.round(h * k);
          g.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = g.getImageData(0, 0, canvas.width, canvas.height);
          const r = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (r) code = r.data;
        }
        if (code && (code !== last || Date.now() - lastAt > 3500)) { last = code; lastAt = Date.now(); onCode(code); }
      }
    } catch { /* keep scanning */ }
    if (!stopped) setTimeout(tick, 140);
  };
  tick();
  return () => { stopped = true; stream.getTracks().forEach((t) => t.stop()); video.srcObject = null; };
}

/** Read a QR from a photo (works everywhere, including the preview). */
export async function decodeImageFile(file) {
  const bmp = await createImageBitmap(file);
  const det = await nativeDetector();
  if (det) {
    const r = await det.detect(bmp);
    if (r.length) return r[0].rawValue;
  }
  await ensureReader();
  const k = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(bmp, 0, 0, c.width, c.height);
  const img = g.getImageData(0, 0, c.width, c.height);
  const r = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
  return r ? r.data : null;
}
