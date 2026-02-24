# 027 — Shared CSS Extraction

**Date:** 2026-02-24

## What Happened

Extracted shared CSS from all 14 report HTML files into a single `reports/blazar-reports.css` stylesheet. Previously, every report inlined ~150-220 lines of identical CSS (tokens, reset, nav, header, cards, tables, badges, etc.). Changing a design trait meant editing all 14 files.

## The Prompt

User provided a detailed extraction plan covering:
- What to extract (tokens, reset, nav, header, cards, tables, badges, quote blocks, bar charts, grade cards, validation stamps)
- Normalizations (--cyan, --cyan-bg, quote-block alias consolidation)
- Processing order (simplest → most complex)
- Parallelization strategy (batch agents)

## What Was Built

### `reports/blazar-reports.css` (~220 lines)
Shared stylesheet covering:
- 30 CSS custom properties (design tokens), normalized `--cyan` to `#0D7899`, added `--fuchsia: #DF4DF5`
- Reset & base (box-sizing, html, body, focus-visible, a, img, code, prefers-reduced-motion)
- Report nav (`.report-nav` + all sub-selectors)
- Layout (`.container` + responsive)
- Header (`.report-header`, branding, date)
- Jump nav (`.jump-nav` + links)
- Sections (`.section`, `.section-title`, `.section-desc`)
- Summary grid & stat cards (5 color variants)
- Cards (`.card` h3/p/ul/li)
- Grid layouts (`.two-col`, `.three-col`)
- Quote blocks with consolidated aliases: `.pass/.positive/.best/.aligned` → green, `.warn/.warning/.warm` → amber, `.fail/.critical/.worst/.deviant` → red
- Bar charts (`.bar-chart`, `.bar-row`, `.bar-label`, `.bar-track`, `.bar-fill` with 6 colors, `.bar-count`)
- Data tables (`.table-wrap`, `.data-table` th/td/tr:hover)
- Badges (11 color variants)
- Grade cards (`.grade-grid`, `.grade-card`, letter grades A-F)
- Validation stamp

### 14 Reports Updated
Each report:
- Added `<link rel="stylesheet" href="blazar-reports.css">` after Google Fonts
- Removed all shared CSS rules from inline `<style>`
- Kept only report-specific overrides (e.g., different bar-label width, different summary-grid columns, section-title accent color)
- 3 reports retained minimal `:root` overrides (competitor-positioning: brand colors; link-equity + brand-evolution: different --cyan values)

## Process

Three parallel agents processed batches of 5/5/4 reports simultaneously. Each agent read the shared CSS, then read each report fully before editing. Total wall-clock time: ~10 minutes for all 14 files.

## Impact

- **Before:** Changing `--blue` required editing 14 files
- **After:** Change one token in `blazar-reports.css`, all reports update
- Pattern follows the proven reference at `/Users/paolo/excat/wknd-trendsetters-playground/reports/shared.css`

## Files Changed

| File | Change |
|------|--------|
| `reports/blazar-reports.css` | **Created** — shared stylesheet |
| `reports/aem-live-*.html` (14) | Linked shared CSS, removed duplicated rules |
| `reports/hub.html` | **Unchanged** — different architecture |
| `reports/README.md` | Updated file conventions |
| `CLAUDE.md` | Added shared CSS convention |

## Reflection

This is a classic software engineering refactoring — DRY principle applied to a report system that grew organically from 1 to 14 files. The LLM built these reports iteratively over one long session, each time inlining the full CSS because that was the simplest thing that worked. Now that the system has stabilized at 14 reports, the extraction pays for itself: the next design change (token tweak, new component) propagates automatically instead of requiring a 14-file find-and-replace.

The parallel agent strategy worked well — three agents processing 14 files in the time it takes to do 4-5. Each agent had clear instructions about what's shared vs. report-specific, and the verification step (grep for residual `:root` blocks) caught nothing unexpected.
