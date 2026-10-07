// Original logo pieces assemble, then the stage lifts. Once per session,
// skippable, reduced-motion aware, and bounded even if the network stalls.
import { motionAllowed } from './motion.js';
const SEQ = [
  ['swoosh','p-draw',0,480], ['string','p-string',140,420],
  ['peg1','p-peg',310,340], ['peg2','p-peg',360,340], ['peg3','p-peg',410,340],
  ['s1','p-letter',340,360], ['o','p-letter',390,360], ['c','p-letter',440,360],
  ['i','p-letter',490,360], ['a','p-letter',540,360], ['l','p-letter',590,360],
  ['s2','p-letter',620,360], ['p','p-letter',660,360], ['pin','p-pin',680,400],
  ['t','p-letter',710,360], ['pick','p-pick',750,380],
];
export function startPreloader(assets, { force = false } = {}) {
  let seen = false;
  try { seen = sessionStorage.getItem('ss-pre-v2') === '1'; } catch { /* optional */ }
  if ((seen && !force) || !motionAllowed() || !assets.parts) return { ready: Promise.resolve(), finish() {} };
  try { sessionStorage.setItem('ss-pre-v2', '1'); } catch { /* optional */ }
  const root = document.getElementById('app');
  const originalInert = root?.inert || false;
  const previousFocus = document.activeElement;
  const el = document.createElement('div');
  el.className = 'preloader';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Welcome to Social Spot');
  el.innerHTML = '<div class="intro-top"><span>Welcome to your spot.</span><span>Akright City · Bwebajja</span></div><div class="intro-center"><p class="intro-caption">GOOD TIMES START HERE</p><div class="assemble" aria-hidden="true"></div><div class="intro-words" aria-hidden="true"><span>SPORT</span><i>·</i><span>SOUND</span><i>·</i><span>GOOD COMPANY</span></div><div class="intro-track" aria-hidden="true"><span></span></div></div><div class="intro-bottom"><span>Come for a little.<br>Stay for the good times.</span><button type="button" class="intro-skip">Skip intro <span aria-hidden="true">↗</span></button></div>';
  const box = el.querySelector('.assemble');
  const meta = Object.fromEntries(assets.partsMeta.map((part) => [part.id, part]));
  for (const [id, animation, delay, duration] of SEQ) {
    const part = meta[id];
    if (!part || !assets.parts[id]) continue;
    const img = new Image(); img.className = 'part'; img.alt = ''; img.src = assets.parts[id];
    Object.assign(img.style, { left:`${part.x}%`, top:`${part.y}%`, width:`${part.w}%`, height:`${part.h}%`, animation:`${animation} ${duration}ms cubic-bezier(.16,1,.3,1) ${delay}ms both` });
    box.append(img);
  }
  const full = new Image(); full.className = 'full'; full.alt = ''; full.src = assets.logo; box.append(full);
  document.documentElement.classList.add('intro-playing');
  if (root) root.inert = true;
  document.body.append(el);
  let resolveReady, finished = false;
  const ready = new Promise((resolve) => { resolveReady = resolve; });
  const settleTimer = setTimeout(() => box.classList.add('settled'), 1140);
  const readyTimer = setTimeout(resolveReady, 1450);
  const release = () => {
    if (finished) return;
    finished = true;
    clearTimeout(settleTimer); clearTimeout(readyTimer); clearTimeout(failsafe);
    resolveReady(); el.classList.add('done');
    document.documentElement.classList.remove('intro-playing');
    if (root) root.inert = originalInert;
    if (el.contains(document.activeElement)) (document.getElementById('main') || previousFocus)?.focus({preventScroll:true});
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('ss:motionchange', release);
    setTimeout(() => el.remove(), 650);
  };
  const onKey = (event) => {
    if (event.key === 'Escape') release();
    if (event.key === 'Tab') { event.preventDefault(); el.querySelector('button').focus(); }
  };
  const failsafe = setTimeout(release, 4500);
  el.querySelector('button').addEventListener('click', release);
  document.addEventListener('keydown', onKey);
  document.addEventListener('ss:motionchange', release);
  return { ready, finish: release };
}
