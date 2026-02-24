# 025 — Image Quality Report Simplification

**Date:** 2026-02-24
**Report:** `reports/aem-live-image-quality.html`

## What Happened

Ran `/impeccable:critique` then `/impeccable:simplify` on the image quality report. The critique identified 5 priority issues — all stemming from the same root cause: the report treated supporting context and the centerpiece comparisons with equal visual weight.

## Changes Made

1. **Killed the 4-stat hero grid** — replaced with a single bold lede. 3.6/10 in 80px red type is the story; the stat grid buried it behind 4 competing numbers.
2. **Promoted AI Comparisons** to first section after the lede. They were section 5 of 7 — now they're the first thing you see.
3. **Added `<details>` toggles** to comparison card analysis. Weakness lists and rationale are collapsed by default. The images are the hero, not the text.
4. **Removed "8/10 target" badges** — these were aspirational targets styled as green "achieved" pills. Misleading. Only original scores shown now.
5. **Merged Inventory + Brand Alignment** into one "Image Landscape" section. Two sections → one.
6. **Dropped format/file-size distribution charts** — not actionable ("50/50 JPEG/PNG", "all under 1MB"). Replaced with one sentence.
7. **Compressed Benchmarks** from 4 separate cards to a data table. Broke the card-on-gray monotony.
8. **Compressed Validation** from a full section to a single footer line with collapsible details.
9. **Softened weakness bullet color** from red to normal text. The heading already says "Weaknesses" — red bullets were redundant emphasis.
10. **Removed unused CSS** — stat-card and benchmark-card classes.

## Result

930 lines → 775 lines (17% reduction). More importantly: the report now has a clear narrative arc. Open it and you immediately see "3.6/10" → side-by-side comparisons → supporting context → recommendations. Before, you had to scroll through 4 stat cards, an inventory, grade cards, and benchmarks before reaching the comparisons.

## Design Insight

The critique's core finding applies broadly: when AI generates reports, it tends toward equal-weight sections because it doesn't know what the audience cares about most. The fix is always the same — identify the one thing the reader came to see, make it impossible to miss, and make everything else progressive disclosure.
