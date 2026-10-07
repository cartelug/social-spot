"""Generate Social Spot's pin icon set. Run with Python 3 and Pillow installed.

The red pin comes from the venue wordmark. A dedicated mark stays legible in a
16 px browser tab; app icons keep the mark inside Android's circular safe zone.
Generated assets are committed, so the normal npm build needs no Python tools.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets-src"
BG = "#0b0a0a"
RED = "#ff1738"
# Smooth, symmetrical pin, in a 64 x 64 viewbox.
CURVES = [
    ((32, 7), (21, 7), (13, 15), (13, 26)),
    ((13, 26), (13, 38), (26, 51), (32, 58)),
    ((32, 58), (38, 51), (51, 38), (51, 26)),
    ((51, 26), (51, 15), (43, 7), (32, 7)),
]
PATH = "M32 7C21 7 13 15 13 26C13 38 26 51 32 58C38 51 51 38 51 26C51 15 43 7 32 7Z"


def icon(size, *, opaque=False, maskable=False):
    scale = size * 4 / 64
    image = Image.new("RGBA", (size * 4, size * 4), BG if opaque else (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if not opaque:
        draw.rounded_rectangle((0, 0, size * 4 - 1, size * 4 - 1), radius=13 * scale, fill=BG)
    # 72% of the usual mark fits completely inside the maskable 40% radius.
    shrink = .72 if maskable else 1

    def point(x, y):
        return ((32 + (x - 32) * shrink) * scale, (32 + (y - 32) * shrink) * scale)

    points = []
    for p0, p1, p2, p3 in CURVES:
        for step in range(65):
            t = step / 64
            xy = [(1-t)**3*p0[i] + 3*(1-t)**2*t*p1[i] + 3*(1-t)*t*t*p2[i] + t**3*p3[i] for i in (0, 1)]
            points.append(point(*xy))
    draw.polygon(points, fill=RED)
    draw.ellipse((*point(24, 18), *point(40, 34)), fill=BG)
    return image.resize((size, size), Image.Resampling.LANCZOS)


OUT.mkdir(exist_ok=True)
(OUT / "social-spot-mark.svg").write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">'
    f'<title>Social Spot</title><rect width="64" height="64" rx="13" fill="{BG}"/>'
    f'<path d="{PATH}" fill="{RED}"/><circle cx="32" cy="26" r="8" fill="{BG}"/></svg>\n'
)
for size in (16, 32, 48, 96, 192, 512):
    icon(size).save(OUT / f"social-spot-{size}.png", optimize=True)
icon(180, opaque=True).save(OUT / "social-spot-touch.png", optimize=True)
icon(512, opaque=True, maskable=True).save(OUT / "social-spot-maskable.png", optimize=True)
# Real multi-resolution ICO fallback, including a hand-rendered 16 px frame.
frames = [icon(size) for size in (16, 32, 48, 64)]
frames[-1].save(OUT / "favicon.ico", sizes=[frame.size for frame in frames], append_images=frames[:-1])
# Keep old saved shortcuts and explicit older URLs looking correct as well.
for filename, size, opaque in [("favicon-32.png", 32, False), ("icon-192.png", 192, False), ("icon-512.png", 512, False), ("apple-touch-icon.png", 180, True)]:
    icon(size, opaque=opaque).save(OUT / filename, optimize=True)
print("Generated SVG, multi-resolution ICO, browser, touch and maskable icons.")
