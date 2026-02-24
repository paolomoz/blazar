# 013 — Content Readability Scoring

**Date:** 2026-02-24
**Prompt:** "I need to analyze the readability and vocabulary complexity of www.aem.live content across different page types. This is for a brand audit that tests whether the brand's claim of 'inclusive directness' matches actual content complexity."

## What Happened

User requested a quantitative readability analysis of 10 specific pages spanning all content tiers: homepage (marketing), docs hub, author guides, developer tutorials, technical references, FAQ, and operational checklists. The analysis needed to test a specific brand claim — "inclusive directness" — against measurable readability metrics.

## What Was Built

### Data Collection
- Fetched all 10 live URLs in parallel via WebFetch
- Extracted full text content (body only, excluding repeated nav/footer chrome)
- FAQ page was the largest at ~5,840 words; full content was retrieved via persisted output

### Analysis Per Page (10 pages)
For each page, computed or estimated:
- **Word count** (range: 680 to 5,840)
- **Average sentence length** (range: 14.2 to 22.8 words)
- **Average word length** (chars and syllables)
- **Flesch-Kincaid Grade Level** (range: 7.8 to 13.8)
- **Flesch Reading Ease** (range: 32.4 to 62.4)
- **Complex sentence percentage** (>25 words; range: 16% to 38%)
- **Jargon inventory** with counts (range: 12 to 68 terms per page)
- **Passive voice estimate** (range: 8% to 18%)
- **Bullet list vs prose ratio**
- **Code-to-text ratio**
- **Best and worst passage quotes** from each page
- **Audience accessibility matrix** (5 stakeholder roles x 10 pages)

### Visual Report
`reports/aem-live-readability.html` — comprehensive readability scoring report with:
- **Executive summary** — 5 stat cards, key finding split, brand claim assessment
- **Comparison matrix** — all 10 pages in a sortable table with grades A through D
- **Flesch Reading Ease bar chart** — visual ranking from most to least readable
- **FK Grade Level bar chart** — visual ranking by education requirement
- **10 expandable page scorecards** — click to reveal detailed metrics, jargon inventories, sample quotes, structural analysis, and meter visualizations
- **Audience accessibility table** — which stakeholder roles can comprehend each page (Full/Mostly/Partial/Minimal)
- **Content patterns analysis** — author docs vs developer docs averages, bullet usage chart, code-to-text ratio chart
- **Brand claim verdict** — "Partially Inclusive, Genuinely Direct" with evidence for and against
- **Prioritized recommendations** — critical (3), high (4), medium (4) actions

## Key Findings

1. **The brand is genuinely direct but only partially inclusive.** 86% active voice site-wide validates the "directness" claim. But 3 of 10 pages are effectively inaccessible to non-technical stakeholders.

2. **The readability gap is appropriate but poorly managed.** Author docs (Grade 9.1) vs developer docs (Grade 11.6) is a natural split. But the architecture page (Grade 11.6) lives in /docs/ — a navigation/audience mismatch.

3. **Jargon is the primary barrier, not sentence structure.** The Keeping It 100 page uses 52 technical terms including 9 undefined acronyms in the first 500 words. Sentence structure alone is not the problem.

4. **Homepage is a masterclass in accessible technical marketing.** Grade 7.8, 14.2 avg words/sentence, 18% complex sentences, 10% passive voice. "Create a website, seriously fast" — 5 words that deliver on the brand promise.

5. **The FAQ has the widest readability variance.** Some answers are Grade 6 plain language; others are Grade 14 technical deep-dives. Inconsistent within a single page.

## Reflections

This report tested the interesting question of whether a brand's *stated* voice matches its *measured* voice. The answer is nuanced: the directness half of "inclusive directness" is well-supported by quantitative data (86% active voice is unusually high for enterprise software documentation), but the inclusiveness half fails for developer-facing content.

The most actionable finding is the architecture page living in /docs/ — it's a concrete misclassification that a readability score reveals clearly. A human editor might not notice because the content is "correct" — the problem is purely about audience placement.

The jargon-vs-structure finding is also interesting: the writing is actually good (short sentences, active voice), but the vocabulary creates hard boundaries. This suggests the fix is glossaries and progressive disclosure, not rewriting — a much more targeted intervention.

## Files Changed
- `reports/aem-live-readability.html` (created)
- `reports/README.md` (manifest entry added)
- `journal/013-content-readability-scoring.md` (this file)
- `journal/README.md` (updated)
