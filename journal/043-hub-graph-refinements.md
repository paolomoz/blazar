# 043 — Hub Graph Refinements & Live Generation Animation

**Date:** 2026-02-25
**Status:** Complete

## What happened

Series of iterative refinements to `hub-graph.html` based on real usage, plus a chat widget fix for report spec streaming.

### Prompts (verbatim)

1. > "remove the experience filter"
2. > "remove it from the stats bar" (re: experience count showing "11 experiences" from bogus KV entries)
3. > "prioritise nodes by number of connections (and adjust size of the bubble based on that) show at least 10 titles of the highest priority nodes"
4. > "looks good commit journal and update CLAUDE.md"
5. > "move /reports/hub-graph to /hub"
6. > "in all reports change the link to Hub to point to /hub"
7. > "how would the new node be added to the graphic when user request the generation of a new report? define the UX"
8. > "yes implement it" (re: three-phase animation design)
9. > (reported unparsed `:::REPORT_SPEC` JSON visible in chat during streaming)
10. > (reported network error during live generation test)

### Changes made

**Experience filter removal** — Removed `.exp-pill` CSS, exp-filters HTML div, and all experience filter JS. Also removed experience count from the stats bar. Root cause of "11 experiences": KV API returned extra reports with non-standard IDs, and the naive `id.split('-').slice(0,2).join('-')` prefix derivation created bogus experience names.

**Connection-based node sizing** — Changed node radius from manifest-based (`5 + r.size * 5` where size derived from `related.length`) to connection-based (`Math.max(6, 4 + conns * 2.5)` where conns = `neighbors[i].size`). This makes heavily-connected nodes visually prominent. Label selection changed from top-N by `r.size` to top-N by connection count, with a per-category guarantee so every category gets at least one visible label.

**`/hub` redirect** — Added `/ hub /reports/hub-graph 302` to `_redirects`. Updated `href="hub.html"` to `href="/hub"` across all 15 report HTML files using a parallel agent. Also fixed the generate-report template which still had the old link.

**Three-phase live generation animation:**
- **Phase 1 (generating):** Node appears at category centroid via `enteringNodeId`, fades in with CSS transition. No layout recompute — existing nodes stay put.
- **Phase 2 (generated):** `animateFromPositions` map captures current positions, full `rebuildGraph()` runs, nodes CSS-transition from old positions to new (0.8s cubic-bezier). Edges start invisible and fade in after settle. The new node appears from its generating position.
- **Phase 3 (settled):** Normal state, all transitions removed.

Auto-pan: When a generating node appears, the viewport auto-pans to center it if it's near the edge.

**Chat `:::REPORT_SPEC` streaming fix:**
- Old regex required closing `\n:::` which LLM sometimes doesn't produce
- New tolerant regex: `(?:\n:::|\n?$)` accepts end-of-string as alternative
- Added JSON brace salvage for truncated streams (counts `{` vs `}`, appends missing closes)
- Added `indexOf(':::REPORT_SPEC')` fallback in `stripReportSpec` to hide partial spec blocks during streaming

**Network error investigation:**
Initial "Network error" during live generation test was stale/zombie wrangler processes (6+ instances, none serving). Killed all and restarted fresh.

Second "Network error" was more subtle: clicking any node during generation navigates the page (`window.location.href`), which aborts the in-flight SSE stream to `/api/generate-report`. The catch block in chat.js persisted a false error to localStorage. Two-part fix:
1. Hub graph opens links in new tab (`window.open`) while any report is generating, preserving the SSE stream
2. Chat.js catch block detects navigation aborts (`AbortError` or `TypeError` with fetch/network message while `document.visibilityState === 'hidden'`) and silently ignores them

Also made generating nodes non-clickable (early return + `cursor: default`).

## Files changed

- `reports/hub-graph.html` — experience filter removal, connection-based sizing, animation system, new-tab-during-generation, non-clickable generating nodes
- `reports/chat.js` — tolerant REPORT_SPEC regex, JSON salvage, streaming strip, navigation abort tolerance
- `_redirects` — added `/hub` redirect
- `functions/api/generate-report.js` — hub link updated to `/hub`
- `CLAUDE.md` — added network graph hub documentation, local dev server instructions
- 15 report HTML files — `hub.html` → `/hub` link change

## Reflections

The experience filter removal is telling: we built it for multi-experience scale, but when real data created false positives (bogus experiences from non-standard KV entries), the right move was to remove it entirely rather than fix the edge cases. Features for hypothetical scale can wait until the scale actually arrives.

Connection-based sizing is a better information hierarchy than manifest metadata. The `related` array is author-declared; connection count is structurally computed. The graph now communicates importance through its own topology rather than relying on external annotations.

The three-phase animation is the most sophisticated UI work in Blazar so far. It preserves spatial memory during layout changes — users don't lose their mental map when new reports appear. The key insight: Phase 1 is cheap (just add a node, no recompute) and Phase 2 is smooth (animate from old positions). Together they make live generation feel organic rather than jarring.

The chat streaming fix highlights a recurring pattern: LLMs don't reliably produce structured output delimiters. The `:::REPORT_SPEC` fence is a contract between the system prompt and the client-side parser, but streaming means the client sees partial output. Defensive parsing (tolerant regex + brace salvage + indexOf fallback) is not optional — it's required for any LLM-to-UI protocol.

The navigation-during-generation bug is a class of problem unique to SPAs with long-running background tasks. Traditional web apps don't have persistent client-side streams that survive across page loads. The fix (new tab during generation) is pragmatic — it preserves the stream while still letting users browse. The abort detection in chat.js is a safety net for cases where the new-tab approach doesn't apply (e.g., user manually navigates or refreshes).
