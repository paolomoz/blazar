# 041 — Network Graph Hub (Production)

**Date:** 2026-02-25
**Status:** Complete

## What happened

Promoted the network graph mock (`network-graph-preview.html`) from a 50-report static demo into a production hub page reading real data from `manifest.json` + the KV API.

### Prompts (verbatim)

User provided a detailed implementation plan (written during a prior plan-mode session) specifying schema mapping, code reuse table, implementation structure, and key differences from the preview. The instruction was:

> "Implement the following plan: Network Graph Hub (`/reports/hub-graph.html`)"

### What was built

**`reports/hub-graph.html`** (993 lines) — production network graph visualization:

- **Async data loading**: dual-source fetch from `manifest.json` (static) and `/api/manifest` (KV-generated), identical to `hub.html`'s init pattern
- **`normalizeReport()`**: maps manifest schema to graph node schema — `category`→`cat`, derives `exp` from ID prefix (`aem-live-`→`aem.live`), computes `size` from `related.length` (0→1, 1-2→2, 3+→3)
- **Force-directed layout**: 500-iteration simulation copied from preview, wrapped in `runSimulation()` function for re-invocation on data changes
- **Click navigates**: hovering highlights neighbors (labels + edge brightening), clicking navigates to the report's `file` URL — no more click-to-select-and-pin from the preview
- **Live generation events**: listens for `blazar-report-generating` / `blazar-report-generated`, adds pulsing animated node, rebuilds entire graph when report completes
- **Experience filter**: replaces user/author filter from preview; auto-hides when only one experience exists (current state: all 14 reports are `aem.live`)
- **`infra` category**: added to CAT constant and catSeeds for infrastructure reports
- **Dynamic legend + stats**: built from actual data instead of hardcoded HTML
- **Hub link**: header back-link to `hub.html`
- **Chat widget**: `<script src="chat.js"></script>`
- **Resize handlers**: responds to window resize and `blazar-chat-resize` events

### Architecture decisions

The graph rebuilds entirely when data changes (new report generated). This is intentional — with the current scale (~14-50 reports), a full `rebuildGraph()` (edges → simulation → regions → render) is instantaneous. If hundreds of reports make simulation slow, the simulation can be incrementalized later.

Kept `normalizeReport()` as the single transformation point between manifest schema and graph schema. Adding a new experience just requires a new ID prefix convention.

## Code reuse breakdown

| Source | What was reused |
|--------|----------------|
| `network-graph-preview.html` | All CSS (+ generating animation + infra category), CAT constant, mulberry32 PRNG, edge building (4 types), force simulation, region computation, render function, highlight/clear, filter bar, pan/zoom |
| `hub.html` | `init()` dual-source manifest loading, live event handlers (`blazar-report-generating`/`blazar-report-generated`), `blazar-chat-resize` handler |

## Files changed

- `reports/hub-graph.html` — created (993 lines)

## Reflections

This is the first time a Blazar visualization went from concept mock to production in a defined pipeline: entry 033 (design options) → 037 (galaxy mock) → 040 (all mocks including network graph) → 041 (production network graph). The plan was written in a separate session, then executed as a single implementation prompt.

The interesting pattern: the mock had 50 hardcoded reports with fake data; the production version has 14 real reports and looks sparser. But the infrastructure is ready — when reports scale to dozens or hundreds (multi-experience, multi-user), the graph will populate organically. The experience filter is already built but auto-hidden, waiting for the first non-aem.live report to appear.

The `normalizeReport()` function is the bridge between two worlds: the manifest (a CMS-like structured record) and the graph (a visualization primitive). This separation means the graph doesn't care where reports come from — static manifest, KV API, or live generation events all produce the same normalized nodes.
