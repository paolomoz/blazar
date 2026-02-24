# 019 — Persistent Chat Interface

**Date:** 2026-02-24
**Prompt:** "Implement the following plan: Persistent Chat Interface for Blazar Reports"

## What happened

User provided a detailed implementation plan for a persistent chat assistant widget that lives on every report page, backed by Cerebras's fast inference API via a Cloudflare Pages Function.

### Files created
- `wrangler.toml` — Cloudflare Pages config (static root = `reports/`, functions auto-discovered)
- `.dev.vars` — Local dev secrets for Cerebras API key
- `functions/api/chat.js` — Streaming SSE proxy (~90 lines). Prepends a detailed system prompt containing all 4 report summaries, section IDs, and linking conventions. Pipes Cerebras streaming response through to the client.
- `reports/chat-context.json` — Report index with discovery prompts (Learn/Analyze/Optimize categories)
- `reports/chat.js` — Self-contained IIFE chat widget (~450 lines). Floating bubble, expanding panel, SSE streaming, minimal markdown renderer, localStorage persistence, discovery prompts, abort support, keyboard shortcuts, responsive layout, ARIA accessibility.

### Files modified
- `package.json` — Added `dev`/`deploy` scripts and `wrangler` devDependency
- All 5 report HTML files — Added `<script src="chat.js"></script>` before `</body>`

### Friction points
- Initial model name `llama-4-scout-17b-16e-instruct` didn't exist on Cerebras. Listed available models via API, switched to `llama3.1-8b`. Fast and works.
- `sleep` with float arguments failed on macOS `sleep` (BSD version expects integer). Minor, worked around.

### Verification
- `npm run dev` starts wrangler on port 8788
- All static files served (hub.html, chat.js, chat-context.json)
- POST `/api/chat` streams SSE with correct report deep links in the response
- Model generates links like `[Content Gaps Analysis](aem-live-content-gaps.html#summary)` — exactly what the system prompt asked for

## Reflections

This is the first real infrastructure piece — Cloudflare Pages deployment with Functions. Every previous artifact was static HTML opened in a browser. Now there's a server, an API, and a streaming LLM integration. The chat widget sits on top of the read-only analysis reports and makes them conversational.

The system prompt approach is interesting: rather than RAG or embeddings, the full report knowledge (titles, summaries, section anchors, key findings) is embedded as a constant in the function. With 4 reports and ~60 sections, this fits easily in context. When the report count grows past 20-30 this will need to shift to retrieval, but for now the simplicity is a feature.

The widget follows DESIGN.md's AI response bubble spec (8px radius, Source Sans Pro, gradient header) and rail pattern (right-anchored panel, discovery prompts). It's the first time the Nova design system has been applied to an interactive component rather than a static report.

Cerebras at `llama3.1-8b` is extremely fast — the streaming feels near-instant. Good enough for a report assistant that mostly needs to look up facts and link to sections.
