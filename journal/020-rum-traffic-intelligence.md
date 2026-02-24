# 020 — Traffic-Weighted Content Intelligence

**Date:** 2026-02-24
**Prompt:** "Implement the following plan: Traffic-Weighted Content Intelligence Report"

## What happened

User provided a detailed implementation plan for cross-referencing RUM telemetry data with the static content gap analysis. The raw RUM data had already been fetched (1,648 bundles from `bundles.aem.page`, Feb 15–24 2026) and saved to `/tmp/aem-rum-feb.json` (2.3MB).

### Files created
- `scripts/aem-live-rum-analysis.mjs` — Data processing script. Reads raw RUM bundles and `analysis.json`, aggregates per-URL traffic, devices, referrers, errors, CWV, 404s, missing resources. Cross-references stale pages and OG gaps with traffic. Outputs `data/aem-live/rum-feb-2026.json` (142KB).
- `data/aem-live/rum-feb-2026.json` — Pre-aggregated telemetry data. 152 URLs, global summaries, cross-reference splits (stale with/without traffic, OG with/without traffic), CWV issues, error counts.
- `reports/aem-live-rum-analysis.html` — Full visual report with 10 sections: validation stamp, executive summary (8 stat cards), traffic distribution bar chart (top 20), device/referrer split, priority shift matrix (22-row table showing all original + new actions), stale content triage (tabbed: 31 with traffic vs 41 without), OG image gaps (tabbed: 34 with vs 31 without), telemetry-only findings (4 cards: JS errors, CWV, missing resources, 404s), revised 22-action plan in 4 tiers, methodology.

### Files modified
- `reports/hub.html` — Added manifest entry (performance category, red accent)
- `reports/README.md` — Added manifest entry
- `reports/aem-live-content-gaps.html` — Added RUM Analysis nav link
- `reports/aem-live-action-plan.html` — Added RUM Analysis nav link
- `CLAUDE.md` — Added RUM analysis reference under www.aem.live managed experience

### Key findings from the data
- **157,771 estimated views** across 152 URLs in 10 days
- **Traffic concentration:** Top 10 pages = 42.6% of all traffic
- **94% desktop** — confirms developer docs audience
- **Priority reshuffling:** 5 actions upgraded, 4 downgraded, 4 new
  - Biggest downgrade: Action #1 (remove dead /mwp-demo) went P1→P4 — zero traffic
  - Biggest upgrade: Action #18 (monitoring) went P4→P2 — RUM data proves monitoring value
  - Most impactful new: CWV on high-traffic pages (homepage TTFB 2,767ms across 84 samples)
- **Stale content split:** 31 of 72 stale pages have traffic (update these), 41 have zero (safe to archive)
- **OG image split:** Top 3 missing OG pages = 26,591 views (17% of traffic)
- **JS errors:** 13,900/period, 89% from rum-distiller infrastructure script

### Verification
- Script output verified: page counts, traffic totals, cross-reference splits all match raw data analysis
- Spot-checked top-5 pages against individual bundle counts
- Priority shift logic reviewed for all 22 actions

## Reflections

This is the report that proves the thesis. Static analysis identified 72 stale pages and said "fix all 72, priority P2." Traffic data says "actually, 41 of those have zero visitors — ignore them. But the 31 that DO have traffic include your 3rd-highest-traffic page with outdated content. That's P1."

The priority shift matrix is the key artifact. Without traffic data, a content team would spend equal effort on pages nobody visits and pages thousands of developers read daily. With traffic data, the same 18 actions get reordered so the first 4 things you fix cover 25,000+ real user impressions.

This is what a CMS should do: not just tell you what's wrong, but tell you what's wrong *that matters*. Traditional CMS platforms don't cross-reference content health with real user behavior. They either show you analytics dashboards (no content quality signals) or content audits (no traffic signals). Blazar does both in one report.

The red accent on this report (performance category) is also the first non-blue/green/purple report in the hub mind map. The visual system is starting to feel like a real product.
