# 034 — Report Not Found Investigation

**Date:** 2026-02-25

## What Happened

User spotted a "Report not found" page at `localhost:8788/r/test-progress-2` and asked whether it was something we created or a failed user action. Investigated the full report generation pipeline to trace the origin.

## The Prompt

> what is this? did we create it or was this some failed action from a user?

(Accompanied by a screenshot showing the bare "Report not found" text at `localhost:8788/r/test-progress-2`.)

## Investigation

Explored the report serving architecture:

1. **Route handler** (`functions/r/[[id]].js`) — catch-all that looks up the slug in the `REPORTS` KV namespace and returns "Report not found" if the key doesn't exist.
2. **Report generation** (`functions/api/generate-report.js`) — POST endpoint that stores generated HTML in KV at the spec's `id` key.
3. **Static reports** — 14 hardcoded in `reports/hub.html` manifest, served directly from `/reports/` directory.
4. **Dynamic reports** — generated via the API, stored in KV, served via `/r/{slug}`.

`test-progress-2` exists in none of these places. Not in the static manifest, not in KV.

## Conclusion

**Failed or ephemeral user action.** Most likely scenario: someone triggered the `/api/generate-report` endpoint (possibly during testing of the write-mode pipeline from journal entry 033), the report was stored in local KV, and then the dev server restarted — wiping the ephemeral KV data. A stale browser tab was left pointing at the now-gone report.

No code changes needed. No bug to fix.

## Files Changed

None.

## Reflection

This is the first time we've encountered a "ghost" from the report generation pipeline — a URL that once worked but no longer resolves because local KV is ephemeral. It's a natural consequence of the architecture: generated reports live in KV, not on disk, so they vanish when the dev server restarts.

For production this is fine (Cloudflare KV is persistent). For local dev, it raises the question of whether generated reports should also be written to disk as a cache/backup. But that's premature optimization — the real fix is just deploying to production where KV persists.

The interesting meta-observation: the user's instinct was to ask the LLM "what is this?" rather than dig through code themselves. That's the thesis in action — the LLM as the primary interface for understanding the system it built.
