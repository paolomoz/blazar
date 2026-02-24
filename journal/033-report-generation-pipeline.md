# 033 — Report Generation Pipeline

**Date:** 2026-02-24

## What Happened

Implemented the full report generation pipeline: chat proposes a report, user confirms, Cerebras LLM emits a `:::REPORT_SPEC` JSON block, client-side detects it and POSTs to a new Cloudflare Pages Function that calls the Claude API to generate full HTML, stores it in KV, updates a manifest, and the hub mind map picks up the new report dynamically.

## The Prompt

> Implement the report generation pipeline plan: chat proposes, user confirms, Claude generates HTML, stored in KV, appears in hub mind map.

## What Was Changed

### New Files
- **`functions/api/generate-report.js`** — POST handler. Accepts a spec, calls Claude Sonnet via streaming, stores HTML in `REPORTS` KV, updates `MANIFEST` KV with the new entry. Streams SSE events (`progress`, `chunk`, `done`, `error`) back to the client.
- **`functions/api/manifest.js`** — GET handler. Returns the dynamic manifest entries from `MANIFEST` KV as JSON array.
- **`functions/r/[[id]].js`** — Catch-all GET handler. Serves generated HTML from `REPORTS` KV at `/r/{slug}`.

### Modified Files
- **`wrangler.toml`** — Added `REPORTS` and `MANIFEST` KV namespace bindings (IDs TBD — need `wrangler kv:namespace create`).
- **`.dev.vars`** — Added `ANTHROPIC_API_KEY` placeholder.
- **`functions/api/chat.js`** — Expanded `WRITE_PROMPT` with instructions for the LLM to output `:::REPORT_SPEC` JSON blocks when user confirms report generation.
- **`reports/chat.js`** — Added: spec extraction/stripping functions, generation card CSS (~50 lines), `renderGenerationCard()` for progress/done/error states, `triggerGeneration()` that POSTs to `/api/generate-report` and reads the SSE stream, detection hook in `sendMessage()` after streaming completes.
- **`reports/hub.html`** — Added `loadDynamicManifest()` that fetches `/api/manifest`, merges new entries into the static manifest, and rebuilds the mind map + timeline.

## Architecture Decisions

- **Two-model flow:** Cerebras (fast/cheap) handles conversation; Claude (capable) generates the actual HTML report. The `:::REPORT_SPEC` block is the handoff protocol.
- **KV over R2:** Reports are 50-200KB HTML — KV is simpler for key-value edge reads.
- **Absolute paths in generated reports:** `/blazar-reports.css`, `/chat.js` — because they're served from `/r/{id}` (different path than static reports).
- **SSE for progress:** Generation takes 10-30s; SSE gives the user real-time feedback.

## What I Learned

- Cloudflare Pages Functions support `context.waitUntil()` for background work while returning a streaming response immediately.
- The `var` keyword for `currentEvent` in the SSE parsing loop was intentional — it needs to persist across loop iterations in the same scope (across the `event:` and `data:` lines).

## Next Steps

1. Create KV namespaces with `wrangler kv:namespace create REPORTS` and `wrangler kv:namespace create MANIFEST`
2. Add the real namespace IDs to `wrangler.toml`
3. Add `ANTHROPIC_API_KEY` to `.dev.vars` with real key
4. Test end-to-end: toggle write mode, ask for a report, confirm, watch generation
