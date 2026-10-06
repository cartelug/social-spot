// Logo-assembly preloader. Each piece is cut from the supplied logo file
// (never redrawn): swoosh draws in, the string runs out, the three pegs pop,
// letters rise one by one, the pin drops, the pick snaps in — then the parts
// cross-fade to the untouched original image.
const SEQ = [
  ['swoosh', 'p-draw', 0, 760],
  ['string', 'p-string', 380, 560],
  ['peg1', 'p-peg', 760, 440],
  ['peg2', 'p-peg', 860, 440],
  ['peg3', 'p-peg', 960, 440],
  ['s1', 'p-letter', 860, 420],
  ['o', 'p-letter', 920, 420],
  ['c', 'p-letter', 980, 420],
  ['i', 'p-letter', 1040, 420],
  ['a', 'p-letter', 1100, 420],
  ['l', 'p-letter', 1160, 420],
  ['s2', 'p-letter', 1260, 420],
  ['p', 'p-letter', 1320, 420],
  ['pin', 'p-pin', 1400, 620],
  ['t', 'p-letter', 1500, 420],
  ['pick', 'p-pick', 1620, 460],
];
const EASE = 'cubic-bezier(.2,.75,.2,1)';

export function startPreloader(assets, { force = false } = {}) {
  let seen = false;
  try { seen = sessionStorage.getItem('ss-pre') === '1'; } catch { /* storage blocked */ }
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ((seen && !force) || reduce || !assets.parts) return { ready: Promise.resolve(), finish() {} };
  try { sessionStorage.setItem('ss-pre', '1'); } catch { /* ignore */ }

  const el = document.createElement('div');
  el.className = 'preloader';
  el.setAttribute('aria-hidden', 'true');
  const box = document.createElement('div');
  box.className = 'assemble';
  const meta = Object.fromEntries(assets.partsMeta.map((p) => [p.id, p]));
  for (const [id, anim, delay, dur] of SEQ) {
    const m = meta[id];
    if (!m || !assets.parts[id]) continue;
    const img = new Image();
    img.className = 'part';
    img.alt = '';
    img.decoding = 'sync';
    img.src = assets.parts[id];
    Object.assign(img.style, { left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%`, animation: `${anim} ${dur}ms ${EASE} ${delay}ms forwards` });
    if (id.startsWith('peg') || id === 'pin') img.style.transformOrigin = '50% 100%';
    box.append(img);
  }
  const full = new Image();
  full.className = 'full';
  full.alt = '';
  full.src = assets.logo;
  box.append(full);
  el.append(box);
  const tag = document.createElement('div');
  tag.className = 'tag';
  tag.textContent = 'Akright City · Bwebajja';
  el.append(tag);
  document.body.append(el);

  const ready = new Promise((resolve) => {
    setTimeout(() => box.classList.add('settled'), 2150);
    setTimeout(resolve, 2500);
  });
  return {
    ready,
    finish() {
      el.classList.add('done');
      setTimeout(() => el.remove(), 600);
    },
  };
}
