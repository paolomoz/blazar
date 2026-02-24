# 015 — Brand Consistency Scorecard

**Date:** 2026-02-24
**Type:** Analysis + Visual Report

## What Happened

The user requested a page-level brand voice scoring audit across 12 diverse pages on www.aem.live. The goal: apply the 6 personality traits and 7 tone axes extracted in the Brand Guidelines report (#006/#007) as a scoring rubric against individual pages, and find where the brand voice holds and where it breaks.

### The Prompt (paraphrased)

"Fetch and score these 12 pages against the brand voice framework. For each page: overall score, trait scores, tone axis positions, exact quotes as evidence, off-brand language, and whether it feels like the same voice wrote it. Group into strong alignment, minor drift, and significant deviation."

### What Was Built

1. **Fetched all 12 pages** in parallel via WebFetch
2. **Scored each page** against:
   - 6 personality traits (0-5 scale): Declarative Confidence, Engineering Pragmatism, Inclusive Directness, Performance Moralism, Architectural Transparency, Controlled Playfulness
   - 7 tone axes (percentage position): Casual-Formal, Simple-Technical, Hedging-Assertive, Product-User, Abstract-Concrete, Reserved-Opinionated, Salesy-Educational
   - Overall brand alignment (0-100) weighted: trait presence 40%, tone axis alignment 30%, voice consistency 30%
3. **Built visual HTML report** (`reports/aem-live-brand-consistency.html`) with:
   - Executive overview with 8 summary stat cards
   - Personality trait heatmap table across all 12 pages
   - Ranked bar chart of all pages by score
   - Per-page detail cards with trait scores, tone axis visualizations with brand reference markers, evidence quotes with alignment/deviation tags, off-brand findings, and same-voice verdicts
   - Systemic findings section identifying cross-page patterns
   - Cross-validation stamp

### Key Findings

**Tier Distribution:**
- 4 Strong Alignment (83-92): keeping-it-100, tutorial, architecture, go-live checklist
- 5 Minor Drift (65-82): authoring, markup-sections-blocks, homepage, RUM, SharePoint setup
- 3 Significant Deviation (48-63): custom-headers, FAQ, business/demo

**Mean Score: 76/100** — the brand is reasonably consistent but has a long tail of underperforming pages.

**The Voice Gradient:** Developer pages (/developer/) average 82.5. Docs pages (/docs/) average 72.7. Business pages (/business/) scored 48. The core engineering team's voice is strong; the further content gets from that team, the weaker the brand becomes.

**The Playfulness Cliff:** Controlled Playfulness is the most variable trait (range: 0-4). Six out of 12 pages score 1 or below. The brand's dry developer humor is concentrated in flagship content and absent from the documentation long tail.

**The FAQ Problem:** The FAQ scores 58 — second-lowest — despite being a high-traffic reference page. It has a repetitive "Yes, Edge Delivery Services..." pattern, generic "great solution" language, and minimal opinion. This is the single largest brand consistency risk because of its visibility.

**Legacy Contamination:** /business/demo (48) still references "Franklin" (retired project name), uses "VIP Program" and "Get a Demo" CTAs, and has zero Architectural Transparency. It has clearly not been touched since the rebrand.

## Reflection

This is the kind of analysis that would traditionally require a brand consultancy engagement — a team of writers reading every page, scoring against a rubric, producing a deck. The LLM did it in one conversation turn: fetch 12 pages, apply a 13-dimension scoring framework, extract 30+ evidence quotes, identify systemic patterns, and produce a visual report.

The most interesting finding is the "voice gradient" — the insight that brand consistency decays as content moves away from the core engineering team. That is not something a word-count tool or readability scorer would catch. It requires understanding what Declarative Confidence sounds like vs. what hedging sounds like, and recognizing that "Edge Delivery Services is a great solution for both small and large sites" is off-brand while "Every Edge Delivery Services site can and should achieve a Lighthouse score of 100" is on-brand. That distinction is inherently qualitative and requires the kind of nuanced language understanding that LLMs excel at.

## Files Changed

- `reports/aem-live-brand-consistency.html` — new visual scorecard report
- `reports/hub.html` — added brand consistency entry + synced readability entry to manifest
- `reports/README.md` — added manifest entry
- `journal/013-brand-consistency-scorecard.md` — this entry
- `journal/README.md` — updated table
