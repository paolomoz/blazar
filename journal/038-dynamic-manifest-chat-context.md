# 038 — Dynamic Manifest for Chat Context

**Date:** 2026-02-25

## What Happened

After fixing the hardcoded chat context in entry 035 (manually adding 10 missing reports), the user immediately asked the right follow-up question:

> will new reports be added to chat context automatically?

The answer was no — and the user's response was just two words:

> yes do it

So we built the long-term fix: a shared manifest that both the hub and chat read from, eliminating the duplicate data sources that caused the original problem.

## The Prompts

> will new reports be added to chat context automatically?

> yes do it

## Architecture

Created a three-layer manifest system:

1. **`reports/manifest.json`** — single source of truth for all static report metadata. Each entry includes `id`, `file`, `title`, `date`, `category`, `summary`, `related`, and `sections` (with `id` and `label` for each section anchor). Lives in the `reports/` directory because `wrangler.toml` sets `pages_build_output_dir = "reports"`.

2. **Chat API dynamic loading** (`functions/api/chat.js`) — completely rewritten. No more hardcoded `REPORTS_CONTEXT` string. Instead:
   - `loadManifest(env, requestUrl)` fetches `/manifest.json` via `env.ASSETS.fetch()` (static reports) and merges with `MANIFEST` KV entries (generated reports)
   - `buildReportsContext(entries)` formats the manifest array into the numbered text block the LLM receives
   - `readPrompt()` and `writePrompt()` are now functions that accept the context string, not template literals evaluated at module load

3. **Hub dynamic loading** (`reports/hub.html`) — removed the 120-line inline `const manifest = [...]` array. Replaced with `async function init()` that fetches `/manifest.json` first, then merges KV-generated entries via `/api/manifest`.

4. **Report generator** (`functions/api/generate-report.js`) — now includes `sections` in KV manifest entries (mapped from the spec's `sections` array), so generated reports also get proper chat context with deep-link anchors.

## Flow for New Reports

- **Static report** (built by Claude Code): add entry to `reports/manifest.json`. Both hub and chat pick it up. One file, one edit.
- **Generated report** (via write mode): the generate-report API writes the manifest entry to KV with sections. Chat API's `loadManifest()` merges KV entries on every request. Fully automatic — zero manual steps.

## Friction

One gotcha during implementation: `manifest.json` was initially created at the project root (`/Users/paolo/excat/blazar/manifest.json`) but got a 404. The `wrangler.toml` sets `pages_build_output_dir = "reports"`, so static assets must be in `reports/`. Moved to `reports/manifest.json` and it worked immediately.

Also had to follow the redirect — wrangler serves `hub.html` as `/hub` with a 308 redirect, which made `curl -s hub.html` return empty. Had to use `curl -sL /hub` to follow.

## Files Changed

- `reports/manifest.json` — new file, 14 report entries with sections (~250 lines)
- `functions/api/chat.js` — full rewrite, hardcoded context → dynamic loading (~170 lines, down from ~340)
- `functions/api/generate-report.js` — added `sections` mapping to KV manifest entry
- `reports/hub.html` — removed inline manifest array, replaced with async fetch init

## Reflection

This is a structural maturity milestone. The system went from "works if you remember to update three places" to "works if you update one place (or zero for generated reports)."

The original bug (chat denying reports exist) was a classic data synchronization problem — the same information maintained in two places inevitably drifts. The fix follows a basic engineering principle: single source of truth. But what's interesting is how this principle plays out in an LLM-driven system.

In a traditional CMS, the system *is* the database — it can't not know about its own content because the content lives inside it. The chat widget was an external observer of the report system, reading from a stale snapshot. By making it read from the same manifest the hub uses, we're approaching the CMS model: the system knows what it contains because it queries itself.

The next step would be to eliminate manifest.json entirely and have the system derive the manifest from the actual report files on disk (or in KV) — scanning HTML files for their metadata. That would make even the manifest.json maintenance unnecessary. But for now, one file to maintain is good enough.
