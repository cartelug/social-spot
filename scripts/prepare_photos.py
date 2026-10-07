#!/usr/bin/env python3
"""Turns the venue photos into web images.

Reads assets-src/photos/photos.json and the phone originals in
assets-src/photos/originals/ (HEIC or JPEG, any size), and writes:

  assets/photos/<id>-<crop>-<width>.<hash>.(avif|jpg)
      each crop at a few widths, AVIF plus a JPEG fallback, with every bit of
      metadata removed (the phones store GPS position and model in each file)
  assets-src/photos/photos.gen.json
      what the build needs: files per width, intrinsic size, a 16px blurred
      WebP placeholder and an average colour per crop
  assets-src/og.jpg
      the 1200x630 share image (photo, darkened, with the logo on top)

scripts/build.js puts photos.gen.json into the site bundle.

    pip install pillow pillow-heif
    python3 scripts/prepare_photos.py              # everything
    python3 scripts/prepare_photos.py --sheet x.jpg  # also a contact sheet of every crop, to check framing

Crops: "ratio" is width/height, "focus" is the point (0-1 across, 0-1 down)
the crop centres on as far as the frame allows, "zoom" > 1 crops tighter.
"""
import argparse
import base64
import hashlib
import io
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:  # only needed for the .HEIC originals
    pillow_heif = None

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets-src' / 'photos'
OUT = ROOT / 'assets' / 'photos'
DEFAULT_WIDTHS = [480, 960, 1600]
AVIF_QUALITY = 52
JPEG_QUALITY = 74


def load(name, adjust):
    path = SRC / 'originals' / name
    if path.suffix.lower() == '.heic' and pillow_heif is None:
        sys.exit('HEIC originals need pillow-heif: pip install pillow-heif')
    im = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    for key, fn in (('brightness', ImageEnhance.Brightness), ('contrast', ImageEnhance.Contrast), ('color', ImageEnhance.Color)):
        if key in adjust:
            im = fn(im).enhance(adjust[key])
    if adjust.get('grayscale'):
        im = ImageOps.grayscale(im).convert('RGB')
    return im


def crop_box(size, spec):
    W, H = size
    rw, rh = spec['ratio']
    r = rw / rh
    w, h = (H * r, H) if W / H > r else (W, W / r)
    z = spec.get('zoom', 1)
    w, h = w / z, h / z
    fx, fy = spec.get('focus', [0.5, 0.5])
    x = min(max(fx * W - w / 2, 0), W - w)
    y = min(max(fy * H - h / 2, 0), H - h)
    return tuple(round(v) for v in (x, y, x + w, y + h))


def encode(im, fmt):
    buf = io.BytesIO()
    if fmt == 'avif':
        im.save(buf, 'AVIF', quality=AVIF_QUALITY, speed=4)
    else:
        im.save(buf, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True, subsampling='4:2:0')
    return buf.getvalue()


def write(data, stem, ext):
    name = f'{stem}.{hashlib.sha256(data).hexdigest()[:8]}.{ext}'
    (OUT / name).write_bytes(data)
    return f'assets/photos/{name}'


def placeholder(im):
    tiny = im.copy()
    tiny.thumbnail((16, 16))
    buf = io.BytesIO()
    tiny.filter(ImageFilter.GaussianBlur(0.6)).save(buf, 'WEBP', quality=40)
    avg = im.resize((1, 1), Image.Resampling.BOX).getpixel((0, 0))
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode(), '#%02x%02x%02x' % avg


def og_image(base, spec):
    im = base.crop(crop_box(base.size, {'ratio': [1200, 630], **spec}))
    im = im.resize((1200, 630), Image.Resampling.LANCZOS)
    im = ImageEnhance.Brightness(im).enhance(spec.get('dim', 0.45))
    shade = Image.new('L', (1, 630))
    for y in range(630):
        shade.putpixel((0, y), int(150 * (abs(y - 315) / 315) ** 1.6))
    im.paste((11, 10, 10), mask=shade.resize((1200, 630)))
    logo = Image.open(ROOT / 'assets-src' / 'logo-1200.png').convert('RGBA')
    logo.thumbnail((860, 860))
    im = im.convert('RGBA')
    im.alpha_composite(logo, ((1200 - logo.width) // 2, (630 - logo.height) // 2))
    im.convert('RGB').save(ROOT / 'assets-src' / 'og.jpg', quality=82, optimize=True, progressive=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sheet', help='also write a contact sheet of every crop to this file')
    args = ap.parse_args()

    manifest = json.loads((SRC / 'photos.json').read_text())
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir(parents=True)
    result, sheet, total = {}, [], 0
    for pid, p in manifest['photos'].items():
        base = load(p['src'], p.get('adjust', {}))
        crops = {}
        for cname, spec in p['crops'].items():
            im = base.crop(crop_box(base.size, spec))
            widths = [w for w in spec.get('widths', DEFAULT_WIDTHS) if w <= im.width] or [im.width]
            files = {'avif': [], 'jpg': []}
            for w in widths:
                h = round(im.height * w / im.width)
                small = im.resize((w, h), Image.Resampling.LANCZOS)
                for fmt in files:
                    data = encode(small, fmt)
                    total += len(data)
                    files[fmt].append([w, write(data, f'{pid}-{cname}-{w}', fmt)])
            lqip, color = placeholder(im)
            top = widths[-1]
            crops[cname] = {'w': top, 'h': round(im.height * top / im.width), 'files': files, 'lqip': lqip, 'color': color}
            sheet.append((f'{pid}/{cname}', im))
        result[pid] = {'alt': p['alt'], 'crops': crops}
        print(f'{pid:14} {p["src"]:15} ' + ', '.join(f'{c} {v["w"]}x{v["h"]}' for c, v in crops.items()))
        if manifest.get('og', {}).get('photo') == pid:
            og_image(base, manifest['og'])
    (SRC / 'photos.gen.json').write_text(json.dumps({'photos': result}, indent=1) + '\n')
    print(f'{sum(len(c["files"]["avif"]) * 2 for r in result.values() for c in r["crops"].values())} files, {total / 1048576:.1f} MB')

    if args.sheet:
        cell = 260
        cols = 6
        rows = (len(sheet) + cols - 1) // cols
        out = Image.new('RGB', (cols * cell, rows * (cell + 20)), 'white')
        d = ImageDraw.Draw(out)
        for i, (label, im) in enumerate(sheet):
            t = im.copy()
            t.thumbnail((cell - 8, cell - 8))
            x, y = (i % cols) * cell, (i // cols) * (cell + 20)
            out.paste(t, (x + 4, y + 20))
            d.text((x + 4, y + 4), label, fill='black')
        out.save(args.sheet, quality=85)


if __name__ == '__main__':
    main()
