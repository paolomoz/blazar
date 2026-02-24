# 006 — Brand Guidelines Extraction: www.aem.live

**Date:** 2026-02-24
**Type:** Analysis

## What happened

The user requested a comprehensive brand guidelines extraction from aem.live. The prompt was specific and structured:

> "Fetch and analyze the aem.live homepage for brand guidelines extraction. I need: 1. Fetch https://www.aem.live/ - analyze the overall visual identity, hero messaging, tone of voice, and brand positioning. 2. Fetch https://www.aem.live/developer/ - analyze the developer documentation tone. 3. Fetch https://www.aem.live/docs/ - analyze the documentation hub structure and tone."

They wanted exact quotes, tone characteristics, brand messaging themes, navigation structure, visual style notes, and inconsistencies.

## What Claude Code did

1. **Fetched 4 pages in parallel** — homepage, docs hub, developer tutorial, and FAQ. The /developer/ URL returned a 404 (itself a brand inconsistency finding), so we fetched /developer/tutorial instead.
2. **Extracted verbatim quotes** from all hero headlines, section headers, CTAs, and testimonials.
3. **Mapped tone of voice** across 5 dimensions (formal/informal, technical/accessible, corporate/conversational, reserved/confident, cautious/bold) with per-page analysis showing how register shifts for different audiences while maintaining a consistent core personality.
4. **Identified 4 brand positioning pillars**: Performance-First CMS, Familiar Tools Not Replacements, Minimalism Philosophy, Enterprise-Grade Simplicity.
5. **Catalogued official terminology** including product naming hierarchy, preferred terms (Blocks not Components), and deprecated codenames (Helix, Franklin).
6. **Found 6 brand inconsistencies** — 2 high severity (product naming confusion across pages, /developer/ 404), 1 medium (copyright year), 3 low (CTA variations, community channel mixing, three-pillar capitalization).
7. **Built visual HTML report** following the established design system and report conventions.
8. **Updated manifest and hub** — added brand report to both README.md and hub.html manifests, connected with related reports via bidirectional links.

## What was produced

- `reports/aem-live-brand-guidelines.html` — 9-section visual report with interactive jump nav, quote blocks, tone spectrum visualization, color swatches, navigation tree maps, inconsistency severity table, and validation stamp.
- Updated `reports/hub.html` manifest — brand report now appears in mind map under "Brand" category node.
- Updated `reports/README.md` manifest — brand report registered with cross-references.

## Reflections

This is Blazar's first brand-category artifact. The content gaps report (entry 002) found 17 old branding references — now we have the actual brand guidelines to validate against. These two reports create a natural feedback loop: the brand report defines what "correct" looks like, and the content gaps report finds where reality diverges.

The most interesting finding is the product naming inconsistency. "Adobe Experience Manager" vs "AEM" vs "Edge Delivery Services" appear interchangeably without a clear hierarchy or first-use convention. For a brand-governance system, this is precisely the kind of issue that should be auto-detected and flagged — not just at the content level, but as a systemic pattern across the entire managed experience.

The tone-of-voice mapping (5-dimension spectrum) is a useful artifact format. It could eventually become a template for evaluating any managed experience's voice consistency. The idea of quantifying tone across pages and flagging when a new page drifts outside the established band is a natural LLM capability that traditional CMS tools simply cannot offer.
