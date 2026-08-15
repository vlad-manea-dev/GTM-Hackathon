"""Reduce any square logo to a 1-bit pixel-art grid.

This is a faithful port of `imageToGrid` in `game.template.html`. It exists so
the invaders on the link-preview card are drawn from the *same* grids the game
itself will draw — the unfurl and the game read as one artefact, not two.

If the engine's algorithm changes, change it here too.
"""
from __future__ import annotations

from PIL import Image, ImageChops

RES = 20  # must match LOGO_RES in the engine


def _fit_square(img: Image.Image, res: int) -> Image.Image:
    """Scale to fit, centred, on a transparent square — mirrors the engine's drawImage."""
    img = img.convert("RGBA")
    # Premultiply so transparent pixels don't bleed their RGB into the average,
    # which is what the browser's compositor does for us on canvas.
    r, g, b, a = img.split()
    img = Image.merge("RGBA", (
        ImageChops.multiply(r, a),
        ImageChops.multiply(g, a),
        ImageChops.multiply(b, a),
        a,
    ))

    s = min(res / img.width, res / img.height)
    w, h = max(1, round(img.width * s)), max(1, round(img.height * s))
    small = img.resize((w, h), Image.BOX)

    canvas = Image.new("RGBA", (res, res), (0, 0, 0, 0))
    canvas.paste(small, ((res - w) // 2, (res - h) // 2))

    # Unpremultiply.
    px = canvas.load()
    for y in range(res):
        for x in range(res):
            r_, g_, b_, a_ = px[x, y]
            if a_:
                px[x, y] = (
                    min(255, r_ * 255 // a_),
                    min(255, g_ * 255 // a_),
                    min(255, b_ * 255 // a_),
                    a_,
                )
    return canvas


def trim_grid(rows: list[str]) -> list[str] | None:
    """Crop fully-empty rows/columns so every logo fills its cell evenly."""
    if not rows:
        return None
    top, bot = 0, len(rows) - 1
    while top < bot and "1" not in rows[top]:
        top += 1
    while bot > top and "1" not in rows[bot]:
        bot -= 1
    sl = rows[top:bot + 1]
    if not sl:
        return None

    left, right = 0, len(sl[0]) - 1
    col_on = lambda c: any(r[c] == "1" for r in sl)
    while left < right and not col_on(left):
        left += 1
    while right > left and not col_on(right):
        right -= 1

    out = [r[left:right + 1] for r in sl]
    return out if out[0] else None


def _density(grid: list[str] | None) -> float:
    if not grid:
        return 0.0
    return sum(r.count("1") for r in grid) / (len(grid) * len(grid[0]))


def image_to_grid(img: Image.Image, res: int = RES) -> list[str] | None:
    """Square image -> list of '0101' strings, or None if it won't read as pixel art."""
    px = _fit_square(img, res).load()

    lum = lambda p: p[0] * 0.299 + p[1] * 0.587 + p[2] * 0.114
    bucket = lambda p: (p[0] >> 4, p[1] >> 4, p[2] >> 4)

    # Tile colour, learned from the border ring only. Corners alone are
    # unreliable — most favicons are rounded.
    ring = [(x, 0) for x in range(res)] + [(x, res - 1) for x in range(res)]
    ring += [(0, y) for y in range(1, res - 1)] + [(res - 1, y) for y in range(1, res - 1)]

    tally: dict[tuple, int] = {}
    opaque_ring = 0
    for x, y in ring:
        p = px[x, y]
        if p[3] < 200:
            continue
        opaque_ring += 1
        k = bucket(p)
        tally[k] = tally.get(k, 0) + 1

    bg = None
    if opaque_ring > len(ring) * 0.5 and tally:
        best, best_n = max(tally.items(), key=lambda kv: kv[1])
        if best_n > opaque_ring * 0.6:  # only a tile if one colour dominates
            bg = tuple((v << 4) + 8 for v in best)

    # Modal colour among opaque pixels — usually a badge fill hiding the glyph.
    ink: dict[tuple, int] = {}
    opaque_total = 0
    for y in range(res):
        for x in range(res):
            p = px[x, y]
            if p[3] < 110:
                continue
            opaque_total += 1
            k = bucket(p)
            ink[k] = ink.get(k, 0) + 1
    fill_rgb, fill_n = None, 0
    if ink:
        best, fill_n = max(ink.items(), key=lambda kv: kv[1])
        fill_rgb = tuple((v << 4) + 8 for v in best)

    near = lambda p, c: abs(p[0] - c[0]) + abs(p[1] - c[1]) + abs(p[2] - c[2]) <= 90

    def build(drop_fill: bool) -> list[str] | None:
        rows = []
        for y in range(res):
            line = ""
            for x in range(res):
                p = px[x, y]
                on = p[3] > 110
                if on and bg:
                    on = not near(p, bg)          # drop the tile
                if on:
                    on = lum(p) < 235             # drop near-white interior holes
                if on and drop_fill and fill_rgb:
                    on = not near(p, fill_rgb)
                line += "1" if on else "0"
            rows.append(line)
        return trim_grid(rows)

    grid = build(False)
    # A featureless slab means the badge fill swallowed the glyph — punch it out,
    # but only if that leaves a shape worth drawing.
    if _density(grid) > 0.8 and fill_n < opaque_total * 0.9:
        punched = build(True)
        if _density(punched) > 0.12:
            grid = punched

    # Still almost solid? That's a silhouette, not a logo.
    return None if _density(grid) > 0.92 else grid


# The engine's fallback sprite, for enemies with no usable logo.
CLASSIC_INVADER = [
    "0010000100",
    "0001001000",
    "0011111100",
    "0110110110",
    "1111111111",
    "1011111101",
    "1010000101",
    "0001101100",
]
