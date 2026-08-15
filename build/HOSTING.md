# The shareable link

The game module's job is config in, HTML out. This is the layer that turns that
HTML into a link you can paste at the bottom of a proposal email.

**Live at https://gtm-hero.vercel.app** — one Vercel project, pure static, no
runtime and no database.

## Making a link

```bash
python3 build/publish.py build/configs/priya-linear.json
```

```
logos for Linear:
  Atlassian              14 KB
  Asana                  40 KB
  Notion                 31 KB

  Priya Raman — Linear
  page    public/g/57dkv7sh/index.html  (155 KB)
  preview public/g/57dkv7sh/og.png  (79 KB)
  title   Priya Raman vs. the companies poaching Linear

  https://gtm-hero.vercel.app/g/57dkv7sh

  not live until you review it and run: vercel --prod
```

Then review the file and `vercel --prod`. Nothing is reachable until you do —
that gap *is* the human gate `CONTEXT.md` asks for. There is no API that can
publish to a real person without someone running a deploy.

## Why static rather than a token server

A server-side config store keeps prospect details out of the repo and makes a
link in 200ms. We chose static anyway:

- No runtime means nothing to break during a demo, and nothing to pay for.
- The review step is a file you can open and a diff you can read.
- Volume is tens of links, not thousands. A 40-second deploy per batch is fine.

The cost is real and worth stating: **prospect names, titles and competitors are
committed to git.** That is acceptable for demo personas. Before this points at
real named individuals, either move the store server-side or keep `public/g/` in
a private repo.

## The link itself

`/g/<token>` where the token is 8 characters from a 31-character unambiguous
alphabet — about 40 bits, unguessable but still readable over the phone. Not
secret, so:

- `robots.txt` disallows `/g/`, and every response carries
  `X-Robots-Tag: noindex, nofollow, noarchive`.
- `Referrer-Policy: no-referrer`, so the CTA click doesn't leak the prospect's
  token into the vendor's analytics.

## The unfurl

Half the value of a link is what it looks like before anyone taps it. Every
page gets Open Graph and Twitter tags plus a rendered 1200x630 card at
`/g/<token>/og.png`, so the link previews with the prospect's name and their
actual competitors in Gmail, Slack, iMessage, WhatsApp and LinkedIn.

The card is drawn by `og.py` from the engine's own ship sprite and a Python port
of the engine's `imageToGrid` (`pixelart.py`), so the invaders in the preview are
pixel-identical to the invaders in the game. **If the engine's pixelation
changes, change `pixelart.py` to match.**

Preview copy is derived from the config, and overridable per prospect:

```json
"share": { "title": "...", "description": "..." }
```

## The config contract

This is the JSON an LLM has to emit from the CRM record. Only four things are
required — `person.name`, `person.promotionTitle`, `company.name`, `enemies`.

```json
{
  "person":  { "name": "Priya Raman", "title": "VP Engineering",
               "promotionTitle": "Chief Technology Officer" },
  "company": { "name": "Linear" },
  "enemies": [
    { "name": "Atlassian", "domain": "atlassian.com" },
    { "name": "Asana",     "logo": "asana.png" },
    { "name": "Notion",    "logo": "https://example.com/notion.png" }
  ]
}
```

`story` and `vendor` default to the Kota block in `publish.py`; override either
in the config. More than four enemies are trimmed to four, with a warning.

Enemy art is resolved in this order, and never fails the build — anything
unresolvable falls back to the classic invader:

1. `logo` as a `data:` URI, an `http(s)` URL, or a file in `build/logos/`
2. `domain` — fetched from DuckDuckGo's icon service, then Google's favicon
   service. Both keyless. Cached in `build/.logo-cache/`.

Option 2 is what makes this turnkey: the LLM only has to name the competitors
and their domains, which the CRM lead-research field already has. The Linear
example above was built with no logo files at all.

## Files

| | |
|---|---|
| `build/publish.py` | config JSON → `public/g/<token>/` + the URL |
| `build/og.py` | the 1200x630 link-preview card |
| `build/pixelart.py` | port of the engine's logo pixelation, shared with `og.py` |
| `build/configs/*.json` | one file per prospect |
| `build/published.json` | ledger of every link made — token, person, date |
| `build/site.json` | the site root, remembered from `--base-url` |
| `vercel.json` | static config, noindex headers, cache headers |
| `public/` | what actually deploys |

`build/build.py` is unchanged and still builds the standalone `game.html` demo
from `build/logos/`. `publish.py` is the per-prospect path and reads the same
template.

## Known gaps

- **No telemetry.** Nobody knows if the prospect opened it, won, or clicked
  through. Static hosting is what rules that out; a single beacon endpoint would
  bring it back, at the cost of no longer being purely static.
- **No expiry or revocation** beyond deleting the directory and redeploying.
- **Deploys are all-or-nothing** — `vercel --prod` publishes every reviewed link
  sitting in `public/g/`, not just the one you built last.
