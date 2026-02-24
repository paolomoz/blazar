# 002 — Content Gaps Analysis: www.aem.live

**Date:** 2026-02-24
**Session type:** First analysis — real-world request

## What the User Wanted

The site owner of www.aem.live made a direct request: *"could you do me the favor and point your agents swarm at www.aem.live? It should be able to get a content list from the query index and give me a content gaps report."*

This is the first real task for blazar — analyze an AEM Edge Delivery Services site and produce a content gaps report. The user framed it as a favor to the site owner, which makes this a concrete external deliverable, not an internal exercise.

## What Claude Code Did

1. **Fetched the query index** from `https://www.aem.live/query-index.json` — 197 pages with metadata (path, title, image, description, lastModified, publicationDate, deprecation, labs).

2. **Fetched the sitemap** from `https://www.aem.live/sitemap.xml` — 192 URLs.

3. **Crawled navigation links** from 5 pages (homepage, docs hub, developer hub, gnav fragment, footer fragment) to understand the site's link structure.

4. **Wrote an analysis script** (`scripts/aem-live-content-gaps.mjs`) that:
   - Fetches all three data sources
   - Cross-references query index vs sitemap vs navigation
   - Analyzes metadata quality (custom images, descriptions, deprecation, labs)
   - Checks content freshness (stale vs recent)
   - Identifies old branding references (Franklin/Helix/hlx)
   - Detects duplicate titles, legacy pages, utility pages
   - Saves raw data and analysis JSON to `data/aem-live/`

5. **Built a visual HTML report** (`reports/aem-live-content-gaps.html`, 1612 lines) with:
   - Executive summary cards
   - Content distribution chart
   - Structural gaps analysis
   - Metadata quality breakdown
   - Content freshness visualization
   - Brand consistency findings
   - Full searchable/sortable inventory of all 197 pages

6. **Updated project context** — CLAUDE.md with managed experience details, reports manifest with first entry.

## Key Findings

| Finding | Count | Severity |
|---------|-------|----------|
| Pages in index, not in sitemap | 10 | Warning |
| Pages in sitemap, not in index | 5 | Critical |
| Broken navigation links | 4 | Critical |
| Missing custom OG images | 65 (33%) | Warning |
| Empty descriptions | 6 | Warning |
| Stale content (>12 months) | 72 (37%) | Critical |
| Old branding (Franklin/Helix/hlx) | 17 | Warning |
| Labs/experimental pages | 14 | Info |
| Deprecated pages | 2 | Info |
| Legacy /previous/ pages | 6 | Warning |
| Utility/fragment pages in index | 8 | Info |

The biggest finding is **content freshness**: 37% of pages haven't been updated in over a year. For a product documentation site, this suggests either the content is stable (good) or neglected (bad) — the site owner can judge which.

## What Worked

- The AEM EDS query index is a goldmine — structured JSON with all content metadata. No scraping needed.
- Cross-referencing three data sources (query index, sitemap, navigation) reveals gaps that no single source shows alone.
- The analysis script runs in ~3 seconds and can be re-run anytime for fresh data.
- The visual report follows the design system and is immediately shareable.

## Friction & Surprises

- The WebFetch tool couldn't return the full 197-entry query index in one shot (too large). Had to save it to a file and read in chunks.
- The sitemap returned 192 URLs vs 197 in the query index — the 5 "extra" index entries are fragments, experiments, and legacy pages that correctly shouldn't be in the sitemap. But there are also 5 sitemap URLs missing from the index, which is a real gap.
- The gnav fragment has a link to `/developer/anatomy-of-a-helix-project` (old path with "helix" in it), while the actual page is at `/developer/anatomy-of-a-project`. Classic link rot from a rebrand.
- The `/home` link in the nav doesn't correspond to an indexed page — likely resolves to `/` via redirect, but it's still a discrepancy.

## Outcome

A complete, shareable content gaps report for www.aem.live. The analysis script is reusable and the data is saved for comparison over time. First entry in the blazar reports manifest.

## Cross-Validation

After the initial report was built, the user asked whether it had been cross-validated per project guidelines — it hadn't. Four parallel validation checks were run:

1. **HTTP spot-checks** — curled all 10 index-not-in-sitemap, 5 sitemap-not-in-index, and 2 nav link targets. Found `/mwp-demo` returns 404 (dead page, added to report). Found `/home` and `/developer/anatomy-of-a-helix-project` both return 200 — reclassified from "broken" to "unindexed nav targets."
2. **Stale content recount** — independently re-ran the 12-month cutoff calculation on raw data. Result: 72, matching exactly.
3. **Old branding sampling** — fetched 5 flagged pages, grepped for Franklin/Helix/hlx. All confirmed with 15–21 mentions each — worse than flagged.
4. **Metadata recount** — independently counted default images (65), empty descriptions (6), deprecated (2), labs (14). All matched exactly.

**Corrections applied:** Reclassified "broken nav links" severity from critical to warning. Added dead page section. Added validation stamp to report.

## Thesis Reflections

This session demonstrates the core value proposition of blazar: point the LLM at a site, get a comprehensive analysis in a single conversation. A human analyst doing this manually would need to:
1. Download the query index (know where to find it)
2. Download the sitemap (know the format)
3. Crawl navigation links (write a script or use a tool)
4. Cross-reference all three in a spreadsheet
5. Check metadata quality for each page
6. Build a presentation or report

The LLM did all of this in one session and produced a visual report. The key insight: **the query index pattern in AEM EDS is what makes this possible** — it's a machine-readable content manifest that most CMS platforms don't expose. Blazar should look for equivalent structured data sources in every stack it analyzes.
