# 040 — Visualization Mocks Sprint

**Date:** 2026-02-25
**Status:** Complete

## What happened

User asked to build interactive static mocks for all 4 mind map scalability options identified in entry 033. Built 3 new mocks (galaxy already existed from entry 037), then a 5th variant inspired by a LinkedIn network visualization.

### Prompts (verbatim)

1. "now build a static mock for option A Semantic Zoom (map metaphor)"
2. "now do option B+C in a static mock"
3. "I like it. expand the card distribution so they don't overlap so much"
4. "starting from this concept generate a new version that applies this visual effect: reports are not only connected to some central structure but are also connected between one each other" — referenced LinkedIn network graph from allthingsgraphed.com
5. "the mock says 50 reports but the UI doesn't show them" — screenshot showed ~6 visible nodes instead of 50

### What was built

**Option A — Semantic Zoom** (`reports/semantic-zoom-preview.html`):
- Light cartographic theme with dot grid background
- 5 category clusters as colored bubbles with SVG health ring arcs
- 3 zoom levels: world (bubbles only), city (compact tiles), street (full detail cards)
- Reports positioned in concentric rings within cluster bounds
- Click-to-zoom on cluster bubbles

**Option B+C — Collapsible Clusters + Filters** (`reports/clusters-filter-preview.html`):
- Radial layout: Hub → Experiences → Categories (collapsible) → Report cards
- Filter bar: search, category toggles, author pills, "related-to" mode
- Cursor-centered zoom (Google Maps style)
- Iterated once: doubled virtual space (1800x1200 → 3200x2400), doubled radii, widened arcs to fix card overlap

**Network Graph** (`reports/network-graph-preview.html`):
- 50 reports as colored circles with force-directed layout
- ~350 semantic edges across 4 types: explicit related, same-category+experience, cross-category, cross-experience
- Curved SVG bezier arcs with randomized curvature
- Hover highlighting: focused node + neighbors visible, everything else faded
- Filter bar from B+C carried over

### The force simulation bug

The network graph was the most interesting engineering challenge. Initial force-directed layout had attraction 200x stronger than repulsion (attractK=0.08 vs repulseK=0.0004), which collapsed all 50 nodes into ~6 visible clusters. User caught it immediately from the stats counter.

Fix: repulseK 0.0004→0.0025, attractK 0.08→0.005, added minimum distance floor (0.03), added rest length for springs (0.06), increased initial spread ±0.15→±0.35, decreased gravity 0.001→0.0003.

## Key technical patterns

- **Cursor-centered zoom**: world-space pivot point math — calculate world point under cursor, apply new scale, adjust pan so same world point stays under cursor. Reused across galaxy, B+C, and network graph.
- **Seeded PRNG** (mulberry32): deterministic layouts from experience/report names as seeds. Same data always produces same visual layout.
- **Force-directed layout**: 400-iteration simulation with repulsion, spring attraction, gravity, damping. Balancing these forces is the entire game.
- **Semantic connections**: 4 layers of report relationships derived from metadata (related field, shared category, shared experience, cross-experience bridges).

## Files changed

- `reports/semantic-zoom-preview.html` — created (~650 lines)
- `reports/clusters-filter-preview.html` — created, then modified for overlap fix (~800 lines)
- `reports/network-graph-preview.html` — created, then modified for force simulation fix (~750 lines)

## Reflections

The user's instinct to see all 4 options as interactive mocks before choosing is a powerful design workflow. Traditional CMS would involve a design agency producing Figma mockups over days. Here, each mock was built in minutes, iterated on live feedback, and the user could pan/zoom/hover to evaluate at full fidelity. The network graph bug — where Claude's first physics parameters were wrong — was caught and fixed in one round-trip because the user could see the actual result immediately.

The LinkedIn-inspired network graph was the most interesting direction: it surfaces relationships between reports that the radial layouts hide. Reports aren't just children of categories — they reference each other, share themes, and form clusters organically. The force-directed layout makes these connections visible.
