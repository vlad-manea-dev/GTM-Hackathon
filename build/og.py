"""Render the 1200x630 link-preview card for a published game.

This is the first thing the prospect sees — it is what Gmail, Slack, iMessage,
LinkedIn and WhatsApp show when the proposal link unfurls, before anyone has
decided whether to tap. So it teases the premise rather than spoiling the
ending: their competitors, as invaders, coming for their company.

It is drawn from the engine's own sprites and its own pixelation algorithm, so
the preview and the game are visibly the same artefact.
"""
from __future__ import annotations

import pathlib

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from pixelart import CLASSIC_INVADER, image_to_grid

HERE = pathlib.Path(__file__).parent
FONT = HERE / "fonts" / "PressStart2P-Regular.ttf"

W, H = 1200, 630
BG = (5, 6, 10)
INK = (244, 244, 248)
THREAT = (255, 77, 109)   # invaders read as danger, never as the accent
MUTED = (120, 128, 148)

SPR_SHIP = [
    "00000100000",
    "00001110000",
    "00001110000",
    "01111111110",
    "11111111111",
    "11111111111",
    "11011111011",
]


def _hex(c: str) -> tuple[int, int, int]:
    c = (c or "").lstrip("#")
    if len(c) == 3:
        c = "".join(ch * 2 for ch in c)
    if len(c) != 6:
        return (109, 92, 231)
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def _font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT), size)


def _wrap(text: str, font: ImageFont.FreeTypeFont, max_w: int) -> list[str]:
    """Greedy wrap. Press Start 2P is monospace, so this is exact."""
    lines, cur = [], ""
    for word in text.split():
        trial = f"{cur} {word}".strip()
        if font.getlength(trial) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def _sprite(draw: ImageDraw.ImageDraw, rows, x: int, y: int, px: int, color) -> tuple[int, int]:
    """Draw a 1-bit grid as blocks. Returns its pixel size."""
    for r, row in enumerate(rows):
        for c, on in enumerate(row):
            if on == "1":
                draw.rectangle(
                    [x + c * px, y + r * px, x + c * px + px - 1, y + r * px + px - 1],
                    fill=color,
                )
    return len(rows[0]) * px, len(rows) * px


def _glow(layer: Image.Image, radius: int, strength: float) -> Image.Image:
    """Bloom pass — the CRT look is all in the halo around lit pixels."""
    blur = layer.filter(ImageFilter.GaussianBlur(radius))
    alpha = blur.split()[3].point(lambda v: int(v * strength))
    blur.putalpha(alpha)
    return blur


def render(config: dict, out_path: pathlib.Path) -> pathlib.Path:
    accent = _hex(config.get("vendor", {}).get("accentColor"))
    person = config.get("person", {})
    company = config.get("company", {})
    vendor = config.get("vendor", {})
    story = config.get("story", {})
    enemies = config.get("enemies", [])[:4]

    card = Image.new("RGBA", (W, H), BG + (255,))

    # --- lit layer: everything that glows is drawn here first, blurred, then
    # composited under a crisp copy of itself.
    lit = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lit)

    # Invader strip — the prospect's actual competitors.
    grids = []
    for e in enemies:
        g = None
        src = e.get("_image")
        if src is not None:
            try:
                g = image_to_grid(src)
            except Exception:
                g = None
        grids.append(g or CLASSIC_INVADER)

    if grids:
        px = 6
        widths = [len(g[0]) * px for g in grids]
        gap = 56
        total = sum(widths) + gap * (len(grids) - 1)
        # Shrink the gap rather than the sprites if four wide logos overflow.
        if total > W - 160:
            gap = max(20, (W - 160 - sum(widths)) // max(1, len(grids) - 1))
            total = sum(widths) + gap * (len(grids) - 1)
        x = (W - total) // 2
        top = 62
        for g, w in zip(grids, widths):
            _sprite(d, g, x, top + (120 - len(g) * px) // 2, px, THREAT + (255,))
            x += w + gap

    # The top half is a live frame of the game — ship, shot in flight, invaders
    # above. The shot is what tells you at thumbnail size that this is a game
    # and not a poster, and it walks the eye from the ship up to the threat.
    ship_px = 8
    sw = len(SPR_SHIP[0]) * ship_px
    ship_y = 300
    _sprite(d, SPR_SHIP, (W - sw) // 2, ship_y, ship_px, accent + (255,))

    bullet_x = W // 2 - ship_px // 2
    for i, y in enumerate(range(ship_y - 32, 194, -34)):
        a = max(70, 255 - i * 45)   # fading up-screen, so the eye travels upward
        d.rectangle([bullet_x, y, bullet_x + ship_px - 1, y + 18], fill=accent + (a,))

    # The bottom half is the pitch. Name first — the single biggest thing here.
    name = (person.get("name") or "").upper()
    f_name = _font(48)
    while f_name.getlength(name) > W - 140 and f_name.size > 24:
        f_name = _font(f_name.size - 2)
    d.text((W // 2, 434), name, font=f_name, fill=INK + (255,), anchor="mm")

    threat = " ".join(x for x in [story.get("threat"), company.get("name")] if x)
    sub = f"VS. {threat}".upper() if threat else (story.get("mission") or "").upper()
    f_sub = _font(22)
    while f_sub.getlength(sub) > (W - 160) * 2 and f_sub.size > 14:
        f_sub = _font(f_sub.size - 1)   # keep it to two lines however long the name is
    for i, line in enumerate(_wrap(sub, f_sub, W - 160)[:2]):
        d.text((W // 2, 498 + i * 36), line, font=f_sub, fill=accent + (255,), anchor="mm")

    card.alpha_composite(_glow(lit, 18, 0.85))
    card.alpha_composite(_glow(lit, 5, 0.9))
    card.alpha_composite(lit)

    # --- unlit chrome
    d2 = ImageDraw.Draw(card)

    # Footer: who is sending this.
    vname = (vendor.get("name") or "").upper()
    tag = (vendor.get("tagline") or "").upper()
    footer = f"PRESENTED BY {vname}" + (f"  -  {tag}" if tag else "")
    f_foot = _font(14)
    while f_foot.getlength(footer) > W - 120 and f_foot.size > 9:
        f_foot = _font(f_foot.size - 1)
    d2.line([(W // 2 - 260, 566), (W // 2 + 260, 566)], fill=(28, 32, 44, 255), width=2)
    d2.text((W // 2, 596), footer, font=f_foot, fill=MUTED + (255,), anchor="mm")

    # Scanlines + vignette last, over everything, like the game's CRT overlay.
    scan = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ds = ImageDraw.Draw(scan)
    for y in range(0, H, 3):
        ds.line([(0, y), (W, y)], fill=(0, 0, 0, 46))
    card.alpha_composite(scan)

    vign = Image.new("L", (W, H), 0)
    ImageDraw.Draw(vign).ellipse([-W // 3, -H // 2, W + W // 3, H + H // 2], fill=255)
    vign = vign.filter(ImageFilter.GaussianBlur(140)).point(lambda v: 255 - v)
    card.paste(Image.new("RGBA", (W, H), (0, 0, 0, 255)), (0, 0), vign.point(lambda v: v // 2))

    # Accent hairline frame — reads as an arcade cabinet bezel at thumbnail size.
    d3 = ImageDraw.Draw(card)
    d3.rectangle([0, 0, W - 1, H - 1], outline=accent + (90,), width=3)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    card.convert("RGB").save(out_path, "PNG", optimize=True)
    return out_path
