# 013 — Image Quality & AI Improvements

**Date:** 2026-02-24
**Type:** Analysis + Generation

## What happened

Built an end-to-end image quality analysis pipeline that inventories all 197 pages' images via HEAD requests, selects 5 diverse candidates, analyzes them with Gemini for brand alignment, then generates improved versions using Gemini 3 Pro's image generation capability.

## Process

1. **Script built** (`scripts/aem-live-image-quality.mjs`) following the content-gaps pattern — standalone Node.js ESM, manual .env loading, no build step. Installed `@google/genai` as new dependency.

2. **Inventory phase** — HEAD-requested all 132 custom image URLs in batches of 20. Results: 130/132 OK, format split nearly 50/50 JPEG/PNG, 82% under 200KB (Media Bus optimization working well).

3. **Candidate selection** — 5 candidates chosen for maximum diversity:
   - `/` (Homepage) — default-social.png fallback, score 3/10
   - `/docs/authoring` — off-brand green illustration, score 4/10
   - `/docs/architecture` — generic business illustration, score 6/10
   - `/blog/adapt-to-2025` — informal event photo, score 5/10
   - `/developer` — default-social.png fallback, score 4/10

4. **Gemini analysis pass** — 5 API calls to `gemini-2.5-flash` for vision analysis. Each image analyzed against extracted brand guidelines (Spectrum blue palette, technical precision aesthetic, speed/simplicity messaging). Returned structured JSON with scores, weaknesses, recommendations, ideal descriptions, alt text suggestions.

5. **Gemini generation pass** — 5 API calls to `gemini-3-pro-image-preview` for image generation. First attempt used `gemini-2.0-flash-exp` which 404'd. Discovered correct model via ListModels API. All 5 images generated successfully as JPEG, ranging 364KB-732KB.

6. **Visual report** — Full HTML report with side-by-side comparison cards, brand alignment grades, best-of-breed benchmarks (Vercel, Stripe, Tailwind, Netlify docs), 10 prioritized recommendations.

## Key findings

- **Average brand alignment: 4.4/10** — confirms prior journal/008 findings of D-grade visual consistency
- Homepage and Developer Hub (highest-traffic pages) both use generic fallback — the worst-case scenario for social sharing
- The format split (65 JPEG / 64 PNG) suggests no systematic image type strategy
- 82% of custom images are under 200KB — Media Bus optimization is genuinely excellent
- AI generation produces usable starting points but not production-ready assets (as expected)

## Gemini API learnings

- `gemini-2.0-flash-exp` is deprecated/removed — use `gemini-3-pro-image-preview` for image generation
- `gemini-2.5-flash` works well for vision/analysis with structured JSON output
- Image generation via `responseModalities: ['TEXT', 'IMAGE']` returns inline base64 data in response parts
- No aspect ratio or resolution control in the current API config — images come back at model's default
- The analysis pass consistently strips markdown fences from JSON output (need to clean before parsing)

## Artifacts

- `scripts/aem-live-image-quality.mjs` — analysis + generation pipeline
- `data/aem-live/image-quality.json` — full analysis data
- `reports/images/original-*.{png,jpg}` — 5 original images
- `reports/images/improved-*.jpg` — 5 AI-generated improvements
- `reports/aem-live-image-quality.html` — visual report with side-by-side comparisons
- `reports/README.md` — manifest updated
- `reports/hub.html` — hub updated with new node
- Related report nav bars updated (brand-guidelines, brand-opportunities, content-gaps)

## What I learned

- The Gemini model landscape moves fast — model IDs that were valid recently can 404 without warning. Always have a discovery step (ListModels) or fallback strategy.
- Side-by-side comparison is the most compelling format for AI image improvement reports. The before/after with scores makes the value proposition immediately visible.
- The HEAD-request inventory approach is efficient — gets format and size data without downloading image bodies. Completed 132 checks in seconds.
- AI-generated images are good conversation starters but need human refinement for production use. The value is in the analysis and recommendations more than the generated pixels.
