#!/usr/bin/env python3
"""Turn one prospect config into one shareable link.

    python3 build/publish.py build/configs/alex-elevenlabs.json

Writes `public/g/<token>/index.html` (the whole game, self-contained) plus
`public/g/<token>/og.png` (the link preview), prints the URL, and records the
link in `build/published.json`.

The engine is never edited. This script replaces the `CONFIG` block in
`build/game.template.html` wholesale and injects link-preview tags into the
head — both are matched on stable markers, so the game team can keep changing
everything else underneath.

Nothing here deploys. `vercel --prod` does that, and until it runs the link is
live nowhere: that gap is the human gate.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import html
import json
import mimetypes
import pathlib
import re
import secrets
import sys
import urllib.error
import urllib.request
from datetime import date

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent
TEMPLATE = HERE / "game.template.html"
LOGOS = HERE / "logos"
CACHE = HERE / ".logo-cache"
LEDGER = HERE / "published.json"
SITE = HERE / "site.json"
PUBLIC = ROOT / "public"

# Unambiguous alphabet — these links get read aloud and retyped. 31^8 keeps a
# link unguessable without making it look like a tracking blob.
ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
TOKEN_LEN = 8

# Everything the LLM may omit. The prospect-specific fields have no defaults on
# purpose: a missing name should fail loudly, not ship as an empty card.
STORY_DEFAULT = {
    "threat": "THE COMPANIES POACHING",
    "mission": "DEFEND YOUR PEOPLE. GET PROMOTED.",
    "verb": "OUT-HIRED",
    "weapon": "BENEFITS THEY CAN'T MATCH",
}
VENDOR_DEFAULT = {
    "name": "Kota",
    "tagline": "Benefits in one click",
    "accentColor": "#6C5CE7",
    "ctaUrl": "https://kota.io/demo",
}

CONFIG_BLOCK = re.compile(
    r"const CONFIG = \{.*?\n\};\n(/\* =+ END OF CONFIG =+ \*/)", re.S
)
TITLE_TAG = re.compile(r"<title>.*?</title>", re.S)


# --------------------------------------------------------------------------
# logos


def _cache_path(key: str, suffix: str) -> pathlib.Path:
    return CACHE / (hashlib.sha1(key.encode()).hexdigest()[:16] + suffix)


def _fetch(url: str, timeout: int = 10) -> bytes | None:
    req = urllib.request.Request(url, headers={"User-Agent": "gtm-hero/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except (urllib.error.URLError, OSError, ValueError):
        return None


def _logo_bytes(enemy: dict) -> tuple[bytes, str] | None:
    """Resolve an enemy's art to (bytes, suffix). Never raises — a missing logo
    is a classic invader, not a failed build."""
    logo = (enemy.get("logo") or "").strip()

    if logo.startswith("data:"):
        head, _, b64 = logo.partition(",")
        suffix = mimetypes.guess_extension(head[5:].split(";")[0]) or ".png"
        try:
            return base64.b64decode(b64), suffix
        except Exception:
            return None

    if logo.startswith(("http://", "https://")):
        cached = _cache_path(logo, pathlib.Path(logo).suffix or ".png")
        if cached.exists():
            return cached.read_bytes(), cached.suffix
        data = _fetch(logo)
        if data:
            CACHE.mkdir(exist_ok=True)
            cached.write_bytes(data)
            return data, cached.suffix
        return None

    if logo:  # a local file: "openai.png", "openai", or a path
        p = pathlib.Path(logo)
        for cand in ([p] if p.is_absolute() else [ROOT / p, LOGOS / p]):
            if cand.is_file():
                return cand.read_bytes(), cand.suffix
        for cand in sorted(LOGOS.glob(pathlib.Path(logo).stem + ".*")):
            return cand.read_bytes(), cand.suffix

    # No art given, but we know the company — go and get a mark for it. This is
    # what makes a config the LLM wrote from the CRM buildable without a human
    # hunting down four PNGs.
    domain = (enemy.get("domain") or "").strip()
    if domain:
        # Keyless sources only, tried best-quality first, so this works on a
        # laptop with no credentials configured.
        for url in (
            f"https://icons.duckduckgo.com/ip3/{domain}.ico",
            f"https://www.google.com/s2/favicons?domain={domain}&sz=256",
        ):
            cached = _cache_path(url, ".png")
            if cached.exists():
                return cached.read_bytes(), ".png"
            data = _fetch(url)
            if data and len(data) > 400:  # smaller than this is a blank placeholder
                CACHE.mkdir(exist_ok=True)
                cached.write_bytes(data)
                return data, ".png"

    return None


def resolve_logos(config: dict) -> list[str]:
    """Inline every enemy logo as a data URI. Returns human-readable notes."""
    from PIL import Image  # only needed when there is art to look at
    import io

    notes = []
    for e in config.get("enemies", []):
        got = _logo_bytes(e)
        if not got:
            e.pop("logo", None)
            e["_image"] = None
            notes.append(f"  {e.get('name', '?'):<20} no logo -> classic invader")
            continue
        data, suffix = got
        mime = "image/svg+xml" if suffix == ".svg" else mimetypes.types_map.get(suffix, "image/png")
        e["logo"] = f"data:{mime};base64," + base64.b64encode(data).decode()
        try:
            e["_image"] = Image.open(io.BytesIO(data))
            e["_image"].load()
        except Exception:
            e["_image"] = None  # SVG or anything Pillow can't read: game still fine
        notes.append(f"  {e.get('name', '?'):<20} {len(data) // 1024:>4} KB")
    return notes


# --------------------------------------------------------------------------
# config


def load_config(path: pathlib.Path) -> dict:
    config = json.loads(path.read_text())

    for key, defaults in (("story", STORY_DEFAULT), ("vendor", VENDOR_DEFAULT)):
        config[key] = {**defaults, **(config.get(key) or {})}

    person = config.get("person") or {}
    missing = [f"person.{k}" for k in ("name", "promotionTitle") if not person.get(k)]
    if not (config.get("company") or {}).get("name"):
        missing.append("company.name")
    if not config.get("enemies"):
        missing.append("enemies")
    if missing:
        sys.exit(f"config is missing required fields: {', '.join(missing)}")

    # The engine caps at 4; do the trimming here so the operator sees it happen.
    enemies = [e if isinstance(e, dict) else {"name": str(e)} for e in config["enemies"]]
    enemies = [e for e in enemies if e.get("name")]
    if len(enemies) > 4:
        print(f"note: {len(enemies)} enemies given, keeping the first 4", file=sys.stderr)
    config["enemies"] = enemies[:4]
    return config


def share_copy(config: dict) -> tuple[str, str]:
    """What the link says when it unfurls in an inbox."""
    share = config.get("share") or {}
    person, company = config["person"], config["company"]
    vendor, story = config["vendor"], config["story"]

    title = share.get("title") or (
        f"{person['name']} vs. {story['threat'].lower()} {company['name']}"
    )
    n = len(config["enemies"])
    desc = share.get("description") or (
        f"{n} of them are on screen right now. Beat them and you get promoted to "
        f"{person['promotionTitle']}. 60 seconds, on your phone — from {vendor['name']}."
    )
    return title, desc


# --------------------------------------------------------------------------
# render


def head_tags(config: dict, url: str, title: str, desc: str) -> str:
    e = html.escape
    img = url + "/og.png"
    alt = f"Arcade card: {config['person']['name']} against {len(config['enemies'])} competitors"
    tags = [
        f"<title>{e(title)}</title>",
        '<meta name="robots" content="noindex, nofollow" />',
        f'<meta name="description" content="{e(desc)}" />',
        f'<meta name="theme-color" content="{e(config["vendor"]["accentColor"])}" />',
        f'<link rel="canonical" href="{e(url)}" />',
        '<meta property="og:type" content="website" />',
        f'<meta property="og:site_name" content="{e(config["vendor"]["name"])}" />',
        f'<meta property="og:title" content="{e(title)}" />',
        f'<meta property="og:description" content="{e(desc)}" />',
        f'<meta property="og:url" content="{e(url)}" />',
        f'<meta property="og:image" content="{e(img)}" />',
        '<meta property="og:image:type" content="image/png" />',
        '<meta property="og:image:width" content="1200" />',
        '<meta property="og:image:height" content="630" />',
        f'<meta property="og:image:alt" content="{e(alt)}" />',
        '<meta name="twitter:card" content="summary_large_image" />',
        f'<meta name="twitter:title" content="{e(title)}" />',
        f'<meta name="twitter:description" content="{e(desc)}" />',
        f'<meta name="twitter:image" content="{e(img)}" />',
    ]
    return "\n".join(tags)


def render(config: dict, url: str, title: str, desc: str) -> str:
    template = TEMPLATE.read_text()

    payload = {k: v for k, v in config.items() if k != "share"}
    for e in payload.get("enemies", []):
        e.pop("_image", None)
        e.pop("domain", None)
    # `</script` inside a string would close the block early.
    blob = json.dumps(payload, indent=2, ensure_ascii=False).replace("</", "<\\/")

    html_out, n = CONFIG_BLOCK.subn(
        lambda m: "const CONFIG = " + blob + ";\n" + m.group(1),
        template,
        count=1,
    )
    if n != 1:
        sys.exit("could not find the CONFIG block in game.template.html — has the "
                 "'END OF CONFIG' marker changed?")

    if "__LOGO_" in html_out:
        sys.exit("template still has __LOGO_*__ placeholders outside the CONFIG block")

    html_out, n = TITLE_TAG.subn(lambda _: head_tags(config, url, title, desc), html_out, count=1)
    if n != 1:
        sys.exit("could not find <title> in game.template.html to attach preview tags to")

    return html_out


# --------------------------------------------------------------------------


def base_url(arg: str | None) -> str:
    if arg:
        SITE.write_text(json.dumps({"baseUrl": arg.rstrip("/")}, indent=2) + "\n")
        return arg.rstrip("/")
    if SITE.exists():
        return json.loads(SITE.read_text())["baseUrl"].rstrip("/")
    sys.exit("no base URL known yet — pass --base-url https://your-app.vercel.app once "
             "and it will be remembered in build/site.json")


def record(token: str, config: dict, url: str) -> None:
    ledger = json.loads(LEDGER.read_text()) if LEDGER.exists() else []
    ledger = [r for r in ledger if r["token"] != token]
    ledger.append({
        "token": token,
        "url": url,
        "person": config["person"]["name"],
        "company": config["company"]["name"],
        "enemies": [e["name"] for e in config["enemies"]],
        "created": date.today().isoformat(),
    })
    LEDGER.write_text(json.dumps(ledger, indent=2) + "\n")


def main() -> int:
    ap = argparse.ArgumentParser(description="Build one shareable prospect link.")
    ap.add_argument("config", type=pathlib.Path, help="prospect config JSON")
    ap.add_argument("--token", help="reuse an existing token instead of minting one")
    ap.add_argument("--base-url", help="site root, e.g. https://gtm-hero.vercel.app")
    args = ap.parse_args()

    if not args.config.is_file():
        sys.exit(f"no such config: {args.config}")

    base = base_url(args.base_url)
    config = load_config(args.config)
    token = args.token or "".join(secrets.choice(ALPHABET) for _ in range(TOKEN_LEN))
    # No trailing slash: vercel.json redirects those, and a 308 on the way to
    # the preview tags is one more thing an inbox scraper can decide not to follow.
    url = f"{base}/g/{token}"

    print(f"logos for {config['company']['name']}:")
    for line in resolve_logos(config):
        print(line)

    title, desc = share_copy(config)
    out_dir = PUBLIC / "g" / token
    out_dir.mkdir(parents=True, exist_ok=True)

    import og
    og.render(config, out_dir / "og.png")

    page = render(config, url, title, desc)
    (out_dir / "index.html").write_text(page)
    record(token, config, url)

    print(f"\n  {config['person']['name']} — {config['company']['name']}")
    print(f"  page    {(out_dir / 'index.html').relative_to(ROOT)}  "
          f"({(out_dir / 'index.html').stat().st_size // 1024} KB)")
    print(f"  preview {(out_dir / 'og.png').relative_to(ROOT)}  "
          f"({(out_dir / 'og.png').stat().st_size // 1024} KB)")
    print(f"  title   {title}")
    print(f"\n  {url}\n")
    print("  not live until you review it and run: vercel --prod")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
