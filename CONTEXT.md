# GTM Hero — Game Module

Context for building the game module of a mid-funnel sales personalisation tool.

## What this project is

A personalised Space Invaders–style game sent to a prospect after a sales call, as a link at the bottom of a proposal email. The enemies are the prospect's actual pain points (pulled from the call); winning "promotes" the prospect to a senior role at their company, ending in a cinematic credit scene with a call-to-action. It's a delight-driven conversion asset, not a hard game.

The wider pipeline (not part of this module): Fireflies transcribes the call → transcript lands in Notion (the CRM) → an LLM writes a structured config → **this game module** renders it → a hosting step deploys it → the URL goes into the proposal email, sent by a human.

**This module's job is only the middle piece: config in, a hosted-ready `index.html` out.** It does not touch Notion, Fireflies, the LLM, hosting, or email.

## The one design rule

The engine is **dumb and fixed**. It never contains a prospect's name and never reasons about anything — it only reads fields from `CONFIG` and displays them. All personalisation lives in the config; none lives in the code. The same engine renders any prospect. Every per-prospect value is read from `CONFIG.*` — there must be no literal name, company, or pain point anywhere below the config block.

## The contract

### Input — one config object

```json
{
  "person":  { "name": "Alex Rivera", "title": "Head of People", "promotionTitle": "Chief People Officer" },
  "company": { "name": "ElevenLabs" },
  "enemies": ["Manual benefits admin", "Fragmented health cover", "Clunky onboarding"],
  "vendor":  { "name": "Kota", "tagline": "Benefits in one click", "accentColor": "#6C5CE7", "ctaUrl": "https://kota.io/demo" }
}
```

Notes on fields:
- `person.promotionTitle` — arrives pre-computed (e.g. "Head of People" → "Chief People Officer"). The game does not derive it.
- `enemies` — 3–4 pain points, ideally the prospect's actual words from the call. Handle any count from 3 to 4 gracefully; do not hardcode for exactly 3.
- `vendor.*` — static (always the same selling company). Colour, tagline, and CTA come from here.

### Output

A single self-contained `index.html` — all JS and CSS inline, no external files, no build step, no backend calls. Opening it plays the game start to finish.

## Build in 4 steps, in order

### Step 1 — Engine against a hardcoded config
Put the example config above as `const CONFIG` at the top of the file. Build classic Space Invaders reading from it: player ship at the bottom, arrow keys or A/D to move, space to shoot, rows of invaders. Each invader is labelled with a string from `CONFIG.enemies`. Clearing all enemies = win. Keep it forgiving: 3 lives, gentle enemy speed. This is a ~60-second experience, not a challenge.

### Step 2 — Win + credit scene (the important part)
On win, fade to black, then an upward-scrolling credit roll:
- "STARRING {person.name} as THE FUTURE {person.promotionTitle}"
- "AT {company.name}"
- "DEFEATED:" then the enemies listed, struck through
- "PRESENTED BY {vendor.name}" — {vendor.tagline}
- Final card: a large glowing "{person.name}, {person.promotionTitle} of {company.name}", with one CTA button linking to `vendor.ctaUrl`, labelled "See how {vendor.name} does it →"

Spend the polish budget here — this is the shareable moment people screenshot.

### Step 3 — Style
Retro arcade: dark background, neon / CRT glow, scanline overlay, pixel font ("Press Start 2P" via a Google Fonts link, with a CSS fallback). Use `vendor.accentColor` for the player ship, buttons, and glow. Mobile-friendly canvas scaling.

### Step 4 — Make config swappable cleanly
`CONFIG` is the single source of all per-prospect values, clearly commented at the top so a non-coder can edit it. Everything below references only `CONFIG.*`.

## Constraints

- One file, vanilla JS + canvas, no libraries.
- Everything driven by `CONFIG`; that object is the only input.
- Gracefully handle 3–4 enemies.
- Out of scope: hosting, deploy, tokens, Notion, email. Build the game pure and let the deploy step wrap it separately.

## Definition of done

- Editing only the `CONFIG` block produces a completely different personalised game, engine untouched.
- Opening `index.html` plays start to finish: game → win → credit scene → working CTA button.

## Notes for later (not this module)

- **Hosting:** each prospect's game should end up at a unique, unguessable URL (e.g. `/g/x7f9k2`), with config stored server-side keyed to the token rather than personal details sitting in a public file or URL query string. Keep this in the separate hosting wrapper, not here.
- **Human gate:** nothing reaches a real prospect without a person reviewing it first. The game can auto-build, but a human approves before the link goes out in an email.
- **Demo vs. real prospects:** a placeholder person (like "Alex Rivera") is fine for demos. For real named individuals, personalisation should be post-call and effectively opt-in, and the token-hosted approach keeps their details out of public static files.
