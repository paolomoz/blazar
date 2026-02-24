# 026 — README Generation

**Date:** 2026-02-24

## What happened

Generated a project README for Blazar. Two iterations:

1. **v1:** AI-generated concept art via Gemini 2.5 Flash Image (hero banner, mindmap concept, architecture vision). Tagline "The LLM is the CMS". Looked flashy but the images didn't hold up — generic AI art that didn't represent the actual product.

2. **v2 (shipped):** Replaced AI art with real Playwright screenshots of 3 reports (hub mind map, RUM traffic intelligence, brand consistency scorecard). Reframed messaging to "A CMS that runs itself". Added detailed capability descriptions, findings summary table, architecture notes.

## Key decisions

- Real screenshots over AI-generated art — authenticity > aesthetics
- "CMS that runs itself" framing — the system generates autonomously, not "LLM replaces CMS"
- Screenshots taken via `npx playwright screenshot` at 1280x900 viewport
- Images stored in `docs/` (not `reports/images/` which is for analysis artifacts)
- Detailed capability descriptions (7 analysis types) with a findings summary table

## Artifacts

- `README.md` — project README
- `docs/screenshot-hub.png` — hub mind map screenshot
- `docs/screenshot-rum.png` — RUM traffic intelligence screenshot
- `docs/screenshot-brand.png` — brand consistency scorecard screenshot
