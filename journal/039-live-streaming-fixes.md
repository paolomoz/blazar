# 039 — Live Streaming Fixes: Format, Replay, Chat

**Date:** 2026-02-25
**Status:** Complete

## What happened

Fixed three issues with the live viewer at `/r/{id}` during report generation, plus discovered and fixed the root cause of broken CSS in all generated reports.

### 1. CSS never loaded (root cause)

The system prompt in `generate-report.js` instructed the LLM to use `/blazar-reports.css`, `/chat.js`, `/blazar-logo-36.svg` — but these files live at `/reports/...`. The paths 404'd. This affected **all** generated reports, not just the live viewer. Fixed the system prompt to use `/reports/` prefix. Added `_redirects` for backward compatibility with already-generated reports in KV.

### 2. UTF-8 encoding in iframe

The iframe created via `document.open()` + `document.write()` defaults to Latin-1 encoding. Unicode characters (`←`, `—`) rendered as mojibake (`â`, `â€"`). Fixed by injecting `<meta charset="UTF-8">` immediately after `<head>` in the streamed HTML, before any non-ASCII content arrives.

### 3. Replay protocol for mid-stream viewers

BroadcastChannel only delivers future messages. Opening `/r/{id}` mid-generation missed all prior content. Fix: `chat.js` now accumulates all HTML deltas in `genMsg.genHtml` and responds to `{ type: 'sync' }` requests with `{ type: 'full', html }`. The live viewer sends `sync` on load to catch up.

### 4. Chat widget in live viewer

Added `<script src="/reports/chat.js"></script>` to the live viewer shell so users have the chat panel during streaming.

### 5. Root redirects

Added `_redirects` file: `/` and `/reports` redirect to `/reports/hub`. Asset paths (`/blazar-reports.css`, etc.) redirect to `/reports/` equivalents.

## Files changed

- `functions/api/generate-report.js` — Fixed all asset paths from `/x` to `/reports/x`
- `functions/r/[[id]].js` — Rewrote `liveViewerShell()` with `<base>` + `<meta charset>` injection, replay protocol, chat widget
- `reports/chat.js` — Added `genHtml` accumulator and `bc.onmessage` sync handler in `triggerGeneration()`
- `_redirects` — New file with root redirects and asset path redirects

## Key lesson

When reports are served from `/r/{id}` (KV), relative paths resolve against `/r/`, not `/reports/`. Always use absolute paths with the correct `/reports/` prefix for assets. The `<base href="/reports/">` injection in the iframe handles relative paths, but absolute paths must be correct at the source.

## Protocol

```
Viewer opens → sends { type: 'sync' }
Generator responds → { type: 'full', html: accumulated }
Subsequent chunks → { type: 'chunk', delta }
Generation ends → { type: 'done' }
```
