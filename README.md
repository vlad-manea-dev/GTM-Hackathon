# GTM Hackathon workspace

This repository is the canonical workspace for the research-to-game demo.

## Projects

- `research-demo/` — animated research pipeline, evidence and transformation views, and the final game handoff.
- `build/deck.template.html` — the fixed Deck game engine used for prospect output.
- `build/publish.py` — converts compact prospect JSON into a self-contained personalised deck at `public/g/<token>/`.
- `web/` — the existing CRM and RevOps application.

## Demo

```bash
cd research-demo
npm install
npm run dev
```

Open `http://localhost:3000`. The included account outputs are `/g/elevenlabs/`
and `/g/synthesia/`.

## Generate another deck

```bash
python3 build/publish.py build/configs/victoria-elevenlabs.json \
  --token elevenlabs \
  --base-url http://localhost:3000 \
  --out research-demo/public
```

The publisher preserves the Deck Template's fixed narrative and Kota pillars,
then merges in the researched person, company, competitors, story and vendor.
Run `python3 build/test_publish.py` before shipping publisher changes.
