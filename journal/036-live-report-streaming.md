# 036 — Live Report Generation Streaming

**Date:** 2026-02-25
**Status:** Complete

## What Changed

Implemented real-time streaming for report generation — users can now watch reports being written live instead of staring at a progress bar.

### Architecture

```
Chat confirms spec → BroadcastChannel created
                   → CustomEvent fires to hub
                   → POST /api/generate-report (SSE stream)
                   → Server streams HTML chunks from Anthropic API
                   → chat.js relays via BroadcastChannel
                   → /r/{id} live viewer renders progressively
                   → Done → KV store → auto-reload → permanent URL
```

### Files Modified (4)

1. **`functions/api/generate-report.js`** — Switched from Bedrock non-streaming `invoke` to Anthropic Messages API with `stream: true`. Parses `content_block_delta` events, relays as `event: chunk` SSE with delta text, progress percent, and total length. Progress formula: `min(90, 10 + (len/18000)*80)`.

2. **`reports/chat.js`** — `triggerGeneration()` now creates a BroadcastChannel per report ID, dispatches `blazar-report-generating` / `blazar-report-generated` CustomEvents for hub, sets `genUrl` immediately (not just on done). Broadcasts chunk/done/error to the channel. `renderGenerationCard()` shows a pulsing "View live" link during generation. Added `.gen-link-live` CSS with pulse animation.

3. **`functions/r/[[id]].js`** — Dual-mode serving. KV hit → completed HTML. KV miss → live viewer shell (~80 lines inline HTML). Shell has dark top bar with pulsing dot, KB counter, BroadcastChannel listener, iframe with `document.write()` for progressive rendering, auto-reload 2s after done. 10s timeout for late-opening tabs.

4. **`reports/hub.html`** — CSS for `.node-report.generating` (pulsing blue border, shimmer accent bar, italic blue summary). JS event listeners: `blazar-report-generating` adds temp entry with `_generating: true` to manifest and rebuilds. `blazar-report-generated` replaces with permanent entry.

## Key Decisions

- **BroadcastChannel** over WebSocket/polling — lightest cross-tab mechanism, no server state
- **CustomEvent** for chat→hub — same window, zero overhead
- **`document.write()` into iframe** — progressive rendering without reflowing
- **Same URL `/r/{id}`** — KV miss = live mode, KV hit = permanent mode
- **Anthropic API** with `x-api-key` instead of Bedrock — standard SSE format, no binary parsing
