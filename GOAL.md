# GTM Hero — goal and build plan

## The goal

A prospect opens a link at the bottom of a proposal email, on their phone, with no
instructions. Inside 60 seconds they shoot down their own competitors, get promoted
to a job title that is plausibly theirs, and land on a card worth screenshotting —
with one working button back to the vendor.

**Success test:** a non-gamer opens the file cold, never reads an instruction,
always wins, and reaches a legible final card with a live CTA — and then a second
person swaps only the `CONFIG` block and gets an equally correct game with no
engine edit.

## What this module is

Config in, a hosting-ready single `.html` out. No Notion, no Fireflies, no LLM, no
hosting, no email — those are the wider pipeline. See `CONTEXT.md`.

## Status

**M1 — nail the Kota → ElevenLabs example. Done.**

| | |
|---|---|
| Attract → play → win → credits → final card | works end to end |
| Win rate (50 simulated runs, 5 skill levels) | 100% |
| Time to win | median 43s, p10 19s, p90 54s |
| Competitors render as pixel-art invaders from real logos | yes, 4 of 4 |
| Prospect/vendor literals below the `CONFIG` block | none |
| Portrait phone, small Android, tablet, desktop | verified |

**M2 — generalise to any company. Not started.** See below.

## The pivot that shaped M1

`CONTEXT.md` specifies the invaders as the prospect's *pain points*. We changed
them to the prospect's *competitors, rendered from their real logos*. The narrative
became a talent war: rivals are poaching your people, better benefits are the
weapon, winning gets you promoted. This is a stronger fit for the CRM, which
already carries a "their competitors are X" lead-research field, and it is a much
better fit for a benefits vendor than a generic pain-point shooter.

Pain points are not lost — `enemies` accepts a plain string, so a pain-point build
is still one config edit away.

## Key decisions, and why

- **One label per row, not per invader.** `CONTEXT.md` says each invader is
  labelled. Real competitor names and pain points are sentence-length; crammed into
  every sprite they are unreadable on a phone. The name is drawn once, large, above
  a row of that competitor's logo. Preserves the intent — each enemy is a legible,
  killable entity. The planning workflow independently reached the same call.
- **Logos are pixel-art'd at load time, not pasted in.** Any square image data-URI
  is reduced to a 20×20 1-bit grid and drawn through the same code path as a
  hand-drawn sprite. Dropped-in PNGs would look foreign in a CRT arcade; this makes
  any logo look authored. Handles transparent marks, light tiles and dark tiles;
  falls back to a classic invader if a logo is missing, slow, or too solid to read.
- **You cannot realistically lose.** The formation stalls above the ship rather
  than landing on it, and running out of lives grants one automatic second wind.
  This is a conversion asset, not a challenge. Lives still show, so there are
  visible stakes.
- **Canvas for the game, DOM for everything else.** The credit roll and CTA are
  real DOM — crisp text at any DPR, a real focusable `<a>`, selectable copy.
- **"Skip to the ending" from the first frame.** Plenty of recipients will never
  play a game in their inbox. They still have to reach the CTA.
- **Canvas fills the viewport.** Logical width is clamped for legibility, then
  height follows the device aspect exactly. Pinning both letterboxed a tall phone
  with dead bands over most of the screen.

## M2 — generalise to any company

Ordered, each independently verifiable:

1. Swap `CONFIG` for a second vendor→prospect pair with different logos and 3
   enemies; confirm zero engine edits and no layout breakage.
2. Handle enemy counts outside 3–4 gracefully (currently: filtered and capped at 4;
   verify 1, 2, 5, 6 and an empty list).
3. Fetch and cache competitor logos as part of the generation step rather than by
   hand — `build/build.py` already inlines whatever is in `build/logos/`.
4. Define the LLM output contract: the exact JSON an LLM must emit from the CRM
   records, with defaults for every optional field.
5. Long-string torture test: a 40-character competitor name, a 60-character
   promotion title, a company name with an ampersand.
6. Drop the Google Fonts link for an inlined base64 subset, so the file is
   genuinely self-contained and works offline.
7. Decide what `story.*` the LLM writes vs. what stays fixed per vendor.

## Files

| | |
|---|---|
| `game.html` | the deliverable — single self-contained file, open it and play |
| `build/game.template.html` | source; identical but with `__LOGO_*__` placeholders |
| `build/build.py` | inlines `build/logos/*` into the template → `game.html` |
| `build/logos/` | source logo art, one file per competitor |
| `build/mobile-test.html` | device matrix — game in phone/tablet-sized iframes |
| `build/SPEC.md` | output of the planning workflow, kept for reference |

Edit the template, not `game.html`; run `python3 build/build.py` to rebuild.

`game.html?debug` exposes `window.__gtm` for headless QA — that hook is how the
win-rate and timing figures above were measured.

## Open questions

- Is "competitors as invaders" right, or should pain points come back as the
  enemies (or a mix)?
- `OUT-HIRED` over a named competitor's logo is cheeky. Fine for a demo; worth a
  second look before anything reaches a real named prospect.
- Kota's real brand purple should be confirmed against their brand guide — the
  current `#6C5CE7` came from `CONTEXT.md`, not from Kota.
