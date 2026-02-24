# 003 — Report Hub with Mind Map

**Date:** 2026-02-24
**Type:** Infrastructure

## What happened

Built `reports/hub.html` — the central navigation hub for all Blazar reports. Two views:

1. **Mind Map (default):** Interactive canvas with central Blazar node, category nodes in a ring, and report cards branching out. Related reports connected by curved blue edges. Full pan/zoom support (drag, scroll wheel, buttons).
2. **Timeline (alternate):** Chronological list, newest first. Each entry shows date, title, summary, category badge, and links to related reports.

Both views are data-driven from a manifest array matching `reports/README.md`.

## Decisions

- Mind map as default — more useful for navigating relationships between reports as the collection grows.
- Self-contained HTML, no build step, consistent with existing report files.
- Design follows Nova/Spectrum 2 system: Source Sans Pro, card-based nodes, pill badges, category colors (amber=audit, green=optimization, purple=brand, blue=content, red=performance).

## Artifacts

- `reports/hub.html` — new file, the report hub

## What I learned

- Canvas-style pan/zoom with CSS transforms works well for a small-to-medium node count. If we hit 50+ reports, may need to switch to a proper force-directed layout (d3-force) or spatial indexing.
