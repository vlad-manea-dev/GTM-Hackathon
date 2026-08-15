#!/usr/bin/env python3
"""Inline competitor logos into the template to produce a self-contained game.html.

The shipped artefact is a single file with no external assets. This script only
exists so the base64 blobs don't have to be hand-edited.
"""
import base64
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent
LOGOS = HERE / "logos"

# (template, output) — every artifact built from the same logo-inlining pass.
ARTIFACTS = [
    (HERE / "game.template.html", ROOT / "game.html"),
    (HERE / "deck.template.html", ROOT / "deck.html"),
]


def data_uri(path: pathlib.Path) -> str:
    mime = "image/svg+xml" if path.suffix == ".svg" else f"image/{path.suffix.lstrip('.')}"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def build(template: pathlib.Path, out: pathlib.Path) -> int:
    html = template.read_text()
    placeholders = set(re.findall(r"__LOGO_([A-Z0-9]+)__", html))
    missing = []

    for name in sorted(placeholders):
        matches = sorted(LOGOS.glob(f"{name.lower()}.*"))
        if not matches:
            missing.append(name)
            continue
        html = html.replace(f"__LOGO_{name}__", data_uri(matches[0]))

    if missing:
        print(f"{template.name}: missing logo files for: {', '.join(missing)}", file=sys.stderr)
        return 1

    out.write_text(html)
    print(f"wrote {out} ({out.stat().st_size // 1024} KB, {len(placeholders)} logos inlined)")
    return 0


def main() -> int:
    status = 0
    for template, out in ARTIFACTS:
        if not template.exists():
            print(f"skipping {template.name} (not found)", file=sys.stderr)
            continue
        status |= build(template, out)
    return status


if __name__ == "__main__":
    raise SystemExit(main())
