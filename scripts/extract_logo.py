"""Split the supplied Social Spot logo into its drawn parts for the preloader.
Pixels are never redrawn or recoloured: every non-transparent pixel of the
original is assigned to exactly one part, so stacking the parts reproduces the
original file pixel for pixel (verified at the end)."""
from PIL import Image
import numpy as np, json
from scipy import ndimage

SRC = 'logo-original.png'
im = Image.open(SRC).convert('RGBA')
A = np.array(im)
al = A[..., 3]

# 1) crop box: everything visible (pixels outside are alpha<=1 noise)
X0, Y0, X1, Y1 = 88, 121, 1877, 713
T = A[Y0:Y1, X0:X1].copy()
Image.fromarray(T).save('logo/logo-trim-full.png', optimize=True)
H, W = T.shape[:2]
ta = T[..., 3]

# 2) label solid components; faint antialias pixels within 3px join their component,
#    stray near-invisible dust (alpha<=10, far from any shape) becomes its own part
core = ta > 10
lab, n = ndimage.label(core, structure=np.ones((3, 3)))
sizes = ndimage.sum(core, lab, range(1, n + 1))
keep = {i + 1 for i, s in enumerate(sizes) if s >= 40}
lab_big = np.where(np.isin(lab, list(keep)), lab, 0)
dist, (iy, ix) = ndimage.distance_transform_edt(lab_big == 0, return_indices=True)
full = lab_big[iy, ix]
full[(ta == 0)] = 0
DUST = 999
full[(ta > 0) & (dist > 3)] = DUST
corelab = lab_big  # solid pixels only, for geometry

big = []
for L in sorted(keep):
    m = corelab == L
    ys, xs = np.where(m)
    big.append(dict(label=L, x0=int(xs.min()), y0=int(ys.min()), x1=int(xs.max()) + 1, y1=int(ys.max()) + 1,
                    area=int(m.sum()), red=bool(T[m][:, 0].mean() > 200 and T[m][:, 1].mean() < 90)))
big.sort(key=lambda c: (c['x0'], c['y0']))
for c in big: print(c)
print('dust pixels', int((full == DUST).sum()), 'max alpha', int(ta[full == DUST].max()) if (full == DUST).any() else 0)

def lab_at(x, y):
    """label of the big component whose bbox contains point (in trimmed coords)"""
    for c in big:
        if c['x0'] <= x < c['x1'] and c['y0'] <= y < c['y1']: return c['label']
    raise SystemExit(f'no component at {x},{y}')

partmask = {}
def add(name, mask):
    partmask[name] = partmask.get(name, np.zeros_like(full, bool)) | mask

# swoosh = big white component top-left
sw = [c for c in big if not c['red'] and c['y0'] < 60][0]
add('swoosh', full == sw['label'])
# red string + pegs (one component) -> split pegs off above the string's top edge
rs = [c for c in big if c['red'] and c['x1'] - c['x0'] > 1000][0]
rm = full == rs['label']
rc = corelab == rs['label']
cols = np.where(rc.any(axis=0))[0]
top = np.array([np.where(rc[:, x])[0].min() if rc[:, x].any() else 10 ** 6 for x in range(W)])
# string top edge: use columns that are not under a peg (pegs make 'top' jump up)
string_top = top.copy()
peg_cols = top < (np.median(top[cols]) - 12)
# label peg column runs
runs, run = [], []
for x in range(W):
    if peg_cols[x]: run.append(x)
    elif run: runs.append(run); run = []
if run: runs.append(run)
runs = [r for r in runs if len(r) > 20]
print('peg column runs', [(r[0], r[-1]) for r in runs])
assert len(runs) == 3, 'expected 3 tuning pegs'
pegs = []
for k, r in enumerate(runs, 1):
    left, right = r[0] - 6, r[-1] + 6
    edge = int(min(top[left], top[right]))  # string top edge beside the peg
    pm = np.zeros_like(rm)
    pm[:edge, r[0] - 2:r[-1] + 3] = rm[:edge, r[0] - 2:r[-1] + 3]
    add(f'peg{k}', pm)
    pegs.append(pm)
add('string', rm & ~np.any(pegs, axis=0))

# letters left to right on the word row
word = [c for c in big if c['y0'] > 300 and c['label'] != rs['label']]
word.sort(key=lambda c: c['x0'])
names = []
for c in word:
    names.append((c, 'pick' if (c['red'] and c['x0'] > 1650) else ('pin' if c['red'] else 'L')))
letters = ['s1', 'o', 'c', 'i', 'i', 'a', 'l', 's2', 'p', 't']
li = 0
for c, kind in names:
    m = full == c['label']
    if kind == 'L':
        add(letters[li], m); li += 1
    else:
        add(kind, m)
assert li == len(letters), (li, len(letters))
add('dust', full == DUST)

# 3) verify partition: every visible pixel in exactly one part
stack = np.zeros(full.shape, int)
for m in partmask.values(): stack += m.astype(int)
vis = ta > 0
assert (stack[vis] == 1).all(), 'pixel assigned to 0 or >1 parts'
assert (stack[~vis] == 0).all()

# 4) export parts at web scale + one full lockup, then recompose check at full res
SCALE = 1200 / W
def rs_img(arr, w, h):
    img = Image.fromarray(arr, 'RGBA').convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
    return img
order = ['swoosh', 'string', 'peg1', 'peg2', 'peg3', 's1', 'o', 'c', 'i', 'a', 'l', 's2', 'p', 'pin', 't', 'pick', 'dust']
meta = {'w': W, 'h': H, 'parts': []}
recompose = np.zeros_like(T)
for name in order:
    m = partmask[name]
    ys, xs = np.where(m)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    crop = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
    sub = T[y0:y1, x0:x1]
    crop[m[y0:y1, x0:x1]] = sub[m[y0:y1, x0:x1]]
    recompose[y0:y1, x0:x1][m[y0:y1, x0:x1]] = crop[m[y0:y1, x0:x1]]
    # web export: pad by 2px so resampling keeps antialiased edges
    pad = 2
    px0, py0, px1, py1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
    big_crop = np.zeros((py1 - py0, px1 - px0, 4), np.uint8)
    mm = m[py0:py1, px0:px1]
    big_crop[mm] = T[py0:py1, px0:px1][mm]
    ww, hh = max(1, round((px1 - px0) * SCALE)), max(1, round((py1 - py0) * SCALE))
    rs_img(big_crop, ww, hh).save(f'logo/parts/{name}.png', optimize=True)
    meta['parts'].append(dict(id=name, x=px0 / W * 100, y=py0 / H * 100, w=(px1 - px0) / W * 100, h=(py1 - py0) / H * 100))
assert np.array_equal(recompose, T), 'recomposition differs from original'
print('recomposition: identical to original crop, max diff 0')
rs_img(T, 1200, round(H * SCALE)).save('logo/logo-1200.png', optimize=True)
rs_img(T, 520, round(H * 520 / W)).save('logo/logo-520.png', optimize=True)
json.dump(meta, open('logo/parts.json', 'w'), indent=1)
print('trimmed size', W, H, 'aspect', W / H)
