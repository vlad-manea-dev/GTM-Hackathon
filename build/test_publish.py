#!/usr/bin/env python3
"""Torture the link builder.

    python3 build/test_publish.py

Drives the real `publish.py` CLI over a matrix of configs designed to break it,
into a temp directory, and asserts what has to hold for a link to be safe to
send to a named human. Runs offline — every case uses local logo files or none.

The load-bearing assertion is LEAKAGE: that no prospect-specific string appears
anywhere below the `END OF CONFIG` marker. That is the project's one design
rule, and it is the thing a careless engine edit would quietly break.
"""
from __future__ import annotations

import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).parent
PUBLISH = HERE / "publish.py"
TEMPLATE = HERE / "deck.template.html"
BASE = "https://test.invalid"
MARKER = "END OF CONFIG"

# Distinctive enough that a match below the marker cannot be a coincidence.
# ("Linear" would collide with `linear-gradient` in the stylesheet.)
SENTINEL = {
    "person": {"name": "Qvortrup Zibbledash", "title": "Head of Fnordery",
               "promotionTitle": "Grand Vizier of Blorptastic Operations"},
    "company": {"name": "Wumpscut & Vexil"},
    "enemies": [{"name": "Snorgleflax"}, {"name": "Krellbourne"}, {"name": "Pyxidane"}],
}


def case(name: str, config: dict, *, expect_fail: bool = False, checks=()) -> dict:
    return {"name": name, "config": config, "expect_fail": expect_fail, "checks": checks}


def base_config(**over) -> dict:
    cfg = {
        "person": {"name": "Alex Rivera", "title": "Head of People",
                   "promotionTitle": "Chief People Officer"},
        "company": {"name": "ElevenLabs"},
        "enemies": [{"name": "OpenAI", "logo": "openai.png"},
                    {"name": "Descript", "logo": "descript.png"},
                    {"name": "Murf AI", "logo": "murf.png"}],
    }
    cfg.update(over)
    return cfg


# --------------------------------------------------------------------------
# checks — each takes (html, png_path, config) and returns a failure string or None


def no_leakage(html, png, cfg):
    """The one design rule: nothing personal below the config block."""
    _, _, engine = html.partition(MARKER)
    if not engine:
        return f"{MARKER!r} marker not found — cannot verify the design rule"

    literals = [cfg["person"]["name"], cfg["person"]["promotionTitle"],
                cfg["company"]["name"], *(e["name"] for e in cfg["enemies"])]
    literals += [cfg["person"].get("title", "")]

    for lit in filter(None, literals):
        if lit in engine:
            return f"{lit!r} leaked into the engine"
    return None


def config_actually_populated(html, png, cfg):
    """Guards the leakage check: an empty page would otherwise pass it."""
    head, _, _ = html.partition(MARKER)
    for lit in [cfg["person"]["name"], cfg["company"]["name"]]:
        encoded = json.dumps(lit, ensure_ascii=False)[1:-1].replace("</", "<\\/")
        if encoded not in head:
            return f"{lit!r} never made it into the CONFIG block"
    return None


def no_internals(html, png, cfg):
    for key in ('"_image"', '"domain"'):
        if key in html:
            return f"internal {key} leaked into the page"
    if re.search(r"__LOGO_[A-Z0-9]+__", html):
        return "internal logo placeholder leaked into the page"
    return None


def preview_tags(html, png, cfg):
    need = ["og:title", "og:description", "og:url", "og:image",
            "og:image:width", "twitter:card", "canonical"]
    for tag in need:
        if tag not in html:
            return f"missing {tag}"
    img = re.search(r'og:image" content="([^"]+)"', html)
    url = re.search(r'og:url" content="([^"]+)"', html)
    if not img or not url:
        return "og:image / og:url unreadable"
    if not img.group(1).startswith("https://"):
        return f"og:image is not absolute: {img.group(1)}"
    if img.group(1) != url.group(1) + "/og.png":
        return f"og:image {img.group(1)} does not match og:url {url.group(1)}"
    if url.group(1).endswith("/"):
        return "og:url has a trailing slash — scrapers will eat a 308"
    return None


def noindex(html, png, cfg):
    return None if 'name="robots" content="noindex' in html else "missing robots noindex"


def valid_card(html, png, cfg):
    from PIL import Image
    im = Image.open(png)
    if im.size != (1200, 630):
        return f"card is {im.size}, must be (1200, 630)"
    # A card that is essentially one flat colour means the render silently failed.
    if len(im.convert("RGB").getcolors(maxcolors=1 << 20) or []) < 40:
        return "card has almost no distinct colours — probably rendered blank"
    return None


def script_intact(html, png, cfg):
    """A name containing </script> must not close the config block early."""
    head, _, _ = html.partition(MARKER)
    if "</script>" in head:
        return "config block was terminated early by its own contents"
    return None


def meta_not_broken(html, png, cfg):
    """A name with a quote must not break out of a meta attribute."""
    for line in html.splitlines():
        if line.startswith("<meta") and line.count('"') % 2:
            return f"unbalanced quotes in meta tag: {line[:90]}"
    return None


def enemies_capped(html, png, cfg):
    n = len(cfg["enemies"])
    return None if n <= 4 else f"{n} enemies rendered, engine caps at 4"


CORE = (no_leakage, config_actually_populated, no_internals, preview_tags,
        noindex, valid_card, script_intact, meta_not_broken, enemies_capped)


# --------------------------------------------------------------------------

CASES = [
    case("happy path, 3 enemies", base_config(), checks=CORE),
    case("leakage sentinel", SENTINEL, checks=CORE),

    # GOAL M2 #2 — enemy counts outside 3-4.
    case("1 enemy", base_config(enemies=[{"name": "OpenAI", "logo": "openai.png"}]), checks=CORE),
    case("2 enemies", base_config(enemies=[{"name": "OpenAI"}, {"name": "Murf AI"}]), checks=CORE),
    case("4 enemies", base_config(enemies=[{"name": n} for n in
         ["OpenAI", "Descript", "Murf AI", "PlayHT"]]), checks=CORE),
    case("6 enemies -> capped at 4", base_config(enemies=[{"name": f"Rival {i}"} for i in
         range(6)]), checks=CORE),
    case("0 enemies -> must fail loudly", base_config(enemies=[]), expect_fail=True),
    case("enemy with no name -> must fail loudly",
         base_config(enemies=[{"logo": "openai.png"}]), expect_fail=True),

    # Missing required fields must fail rather than ship a blank card.
    case("no person.name", base_config(person={"promotionTitle": "CPO"}), expect_fail=True),
    case("no promotionTitle", base_config(person={"name": "Alex Rivera"}), expect_fail=True),
    case("no company.name", base_config(company={}), expect_fail=True),

    # GOAL M2 #5 — long-string torture.
    case("40-char competitor name", base_config(enemies=[
        {"name": "Extraordinarily Long Competitor Name Co"},
        {"name": "OpenAI"}, {"name": "Murf AI"}]), checks=CORE),
    case("60-char promotion title", base_config(person={
        "name": "Alex Rivera", "title": "Head of People",
        "promotionTitle": "Global Chief People And Culture Transformation Officer, EMEA"}),
        checks=CORE),
    case("ampersand in company", base_config(company={"name": "Marks & Spencer"}), checks=CORE),
    case("very long person name", base_config(person={
        "name": "Bartholomew Fitzwilliam-Montgomery III",
        "title": "Head of People", "promotionTitle": "Chief People Officer"}), checks=CORE),

    # Injection / escaping.
    case("</script> in a name", base_config(person={
        "name": "Alex </script><script>alert(1)</script> Rivera",
        "title": "Head of People", "promotionTitle": "Chief People Officer"}), checks=CORE),
    case("quotes and angle brackets", base_config(company={
        "name": 'Ampersand "Quote" <Bracket> & Co'}), checks=CORE),

    # Art resolution.
    case("no logos at all -> classic invaders", base_config(enemies=[
        {"name": "OpenAI"}, {"name": "Descript"}, {"name": "Murf AI"}]), checks=CORE),
    case("logo file that does not exist", base_config(enemies=[
        {"name": "OpenAI", "logo": "nope-does-not-exist.png"},
        {"name": "Descript", "logo": "descript.png"}]), checks=CORE),

    # Non-ASCII.
    case("unicode name and company", base_config(
        person={"name": "Zoë Müller-Švec", "title": "Head of People",
                "promotionTitle": "Chief People Officer"},
        company={"name": "Ørsted 日本"}), checks=CORE),

    # Overrides.
    case("custom share copy", base_config(share={
        "title": "A hand-written title", "description": "A hand-written description."}),
        checks=CORE + (lambda h, p, c: None if "A hand-written title" in h
                       else "share.title override ignored",)),
    case("different vendor", base_config(vendor={
        "name": "Acme", "tagline": "We do things", "accentColor": "#00FF66",
        "ctaUrl": "https://acme.test/demo"}), checks=CORE),
]


def run() -> int:
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="gtm-link-test-"))
    cfg_dir = tmp / "configs"
    cfg_dir.mkdir()
    passed, failed = 0, []

    print(f"{len(CASES)} cases -> {tmp}\n")
    for i, c in enumerate(CASES):
        path = cfg_dir / f"{i:02d}.json"
        path.write_text(json.dumps(c["config"], ensure_ascii=False))
        token = f"testcase{i:02d}"

        proc = subprocess.run(
            [sys.executable, str(PUBLISH), str(path), "--token", token,
             "--base-url", BASE, "--out", str(tmp / "out")],
            capture_output=True, text=True,
        )

        if c["expect_fail"]:
            if proc.returncode == 0:
                failed.append((c["name"], "expected a hard failure, got a link"))
                print(f"  FAIL  {c['name']}\n        expected a hard failure, got a link")
            else:
                passed += 1
                print(f"  ok    {c['name']}  (rejected: {proc.stderr.strip().splitlines()[-1][:60]})")
            continue

        if proc.returncode != 0:
            failed.append((c["name"], (proc.stderr or proc.stdout).strip()[-200:]))
            print(f"  FAIL  {c['name']}\n        build failed: {(proc.stderr or '').strip()[-160:]}")
            continue

        out = tmp / "out" / "g" / token
        html = (out / "index.html").read_text()
        # Re-derive the normalised config the builder used, for the checks.
        cfg = json.loads(re.search(r"const PROSPECT_CONFIG = (\{.*?\n\});", html, re.S).group(1)
                         .replace("<\\/", "</"))

        problems = [msg for chk in c["checks"] if (msg := chk(html, out / "og.png", cfg))]
        if problems:
            failed.append((c["name"], "; ".join(problems)))
            print(f"  FAIL  {c['name']}")
            for p in problems:
                print(f"        {p}")
        else:
            passed += 1
            print(f"  ok    {c['name']}")

    print(f"\n{passed}/{len(CASES)} passed")
    if failed:
        print(f"\n{len(failed)} failing:")
        for name, why in failed:
            print(f"  - {name}: {why}")
        print(f"\nartefacts kept for inspection: {tmp}")
        return 1

    shutil.rmtree(tmp)
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
