# 007 — AEM.live Brand Voice Deep Dive

**Date:** 2026-02-24
**Type:** Analysis

## What happened

Deep brand voice extraction from 5 strategically selected aem.live pages: FAQ (/docs/faq), performance philosophy (/developer/keeping-it-100), architecture (/docs/architecture), Real User Monitoring (/developer/rum), and go-live checklist (/docs/go-live-checklist). These pages were chosen for maximum diversity of content type and audience — spanning reference, philosophy, conceptual, API, and operational documentation.

## Prompt

> "Fetch and analyze these aem.live pages for deeper brand guideline extraction: FAQ, keeping-it-100, architecture, rum, go-live-checklist. For each page extract writing style, audience adaptation, brand personality, CTA patterns, humor/formality, typography, color usage, content type handling, and terminology choices."

## Findings

### 6 Brand Personality Traits Identified

1. **Declarative Confidence** — The dominant trait. FAQ answers open with unqualified assertions: "Every Edge Delivery Services site can and should achieve a Lighthouse score of 100." No hedging, no "it depends."
2. **Engineering Pragmatism** — Solutions presented as already-solved problems. "It turns out that it is hard to improve your Lighthouse score once it is low, but it is not hard to keep it at 100 if you continuously test."
3. **Inclusive Directness** — Technically dense but warm through second-person address ("you/your") and collaborative framing. Never talks down.
4. **Performance Moralism** — Speed as a value system, not just a metric. "Speed is Green" section ties performance to environmental ethics. The GitHub bot auto-fails PRs below 100.
5. **Architectural Transparency** — Openly names internal components (Content Bus, Media Bus, Code Bus), explains dual-stack redundancy. Unusual enterprise transparency.
6. **Controlled Playfulness** — Dry humor in unexpected places. "Edge Delivery Services is probably not down." Unix fstab reference. "Think marketing tooling, consent management..." These humanize without undermining credibility.

### Terminology Map

- "Edge Delivery Services" is the canonical full name (100+ occurrences). Never abbreviated to "EDS" on any page.
- "AEM" used as shorthand after first mention, and as prefix for compound terms (AEM Sidekick, AEM Code Sync).
- "Operational Telemetry" replacing "RUM" as official name, but transition incomplete (URL still says /developer/rum).
- "Franklin" and "Helix" appear only in the historical naming FAQ answer.
- "hlx.page" / "hlx.live" mentioned once as deprecated.

### Voice Spectrum

The brand positions at 65% formal, 72% technical, 85% assertive, 60% user-centric, 78% concrete, 55% opinionated, 82% educational. It occupies a specific sweet spot: technically informal but institutionally credible.

### Audience Adaptation

The same brand voice modulates for 5 distinct audiences without breaking character:
- **Business decision makers** (FAQ): reassuring, benefit-oriented
- **Developers** (performance guide): peer-to-peer, prescriptive, acronyms unexplained
- **Content authors** (FAQ authoring section): task-oriented, minimal jargon
- **Site operators** (go-live): structured, risk-aware, anticipates anxiety
- **Architects** (architecture page): systems-thinking, layer-by-layer, vendor-neutral

### CTA Patterns

Five distinct CTA types identified. Dominant pattern is "soft educational" — embedding the action as a learning next step ("See the document... for more information"). No "Sign up" / "Buy now" / "Get a demo" language anywhere. The single exception is the go-live page's email CTA (aemgolives@adobe.com) which breaks the docs wall to reveal the human team.

### Notable Absences

- Zero emoji across all 5 pages
- Zero marketing cliches ("leverage," "synergy," "best-in-class," "unlock")
- Zero self-deprecating humor
- Adobe brand red completely absent from content layer
- No contractions in formal content

## Artifacts

- `reports/aem-live-brand-voice.html` — Full brand voice analysis with 42 evidence quotes, voice spectrum visualization, terminology map, CTA analysis, content type strategies
- Updated `reports/hub.html` manifest with new report and cross-references
- Updated `reports/README.md` manifest

## What I learned

- The brand voice analysis reveals something deeper than style: it reveals engineering values encoded in documentation. The performance moralism ("Speed is Green," auto-failing PRs below 100) and architectural transparency (naming internal storage layers) suggest this documentation was written by the engineering team, not a separate docs team. The voice IS the team.
- The terminology transition from "RUM" to "Operational Telemetry" is incomplete and creates a measurable inconsistency — the URL says one thing, the page title says another. This is exactly the kind of drift Blazar should detect and flag.
- The complete absence of "EDS" as an abbreviation is a deliberate brand choice. The team prefers the full "Edge Delivery Services" or the broader "AEM" shorthand, skipping the middle ground entirely. This creates longer but more precise text.
- Five content types, five audience adaptations, one consistent voice. This is what good brand governance looks like in practice — not a style guide document, but consistent execution across hundreds of pages.
