# 042 — Hub Graph 404 Links

**Date:** 2026-02-25
**Status:** Complete

## What happened

User's first external tester hit the network graph and got 404s on every report link. The graph shipped yesterday (entry 041) and worked in dev, but in production the links broke.

### Prompts (verbatim)

> "from a user: - I managed to see it yesterday. Today, all links give me a 404 from the mindmap"

Accompanied by a screenshot showing `blazar.pages.dev/aem-live-rum-analysis` returning a Cloudflare Pages 404.

Then, after investigation:

> "reports moved, like https://blazar.pages.dev/reports/aem-live-brand-evolution need to update links and set a redirect too"

### Root cause

The manifest had relative `file` paths (`aem-live-rum-analysis.html`). When the hub-graph is served at `/reports/hub-graph`, the browser resolves these relative to `/reports/` — which works. But when accessed from a different path context (e.g., via `/hub` redirect, KV serving, or bookmarked URL), the relative paths resolve against the wrong base, producing bare slugs like `/aem-live-rum-analysis` instead of `/reports/aem-live-rum-analysis`.

The reports exist at `/reports/aem-live-rum-analysis` (Cloudflare Pages serves `reports/aem-live-rum-analysis.html` with pretty URLs). The bare slug `/aem-live-rum-analysis` has no static file and no function handler — hence 404.

### What was fixed

1. **`reports/manifest.json`** — All 14 `file` values changed from relative to absolute:
   - Before: `"file": "aem-live-rum-analysis.html"`
   - After: `"file": "/reports/aem-live-rum-analysis"`

2. **`_redirects`** — Added 14 redirect rules for bare slugs:
   ```
   /aem-live-rum-analysis /reports/aem-live-rum-analysis 301
   ```
   Catches anyone who bookmarked or cached the broken URLs.

3. **`reports/hub-graph.html`** — Defensive normalization in `normalizeReport()`:
   ```js
   file: m.file ? (m.file.startsWith('/') ? m.file : '/reports/' + m.file.replace(/\.html$/, '')) : ''
   ```
   If a relative path slips through (e.g., from the KV API manifest), it gets auto-prefixed.

4. **`reports/hub.html`** — Same defensive normalization after manifest load, before `buildMindmap()`.

## Files changed

- `reports/manifest.json` — 14 file paths made absolute
- `_redirects` — 14 report redirect rules added
- `reports/hub-graph.html` — defensive file path normalization
- `reports/hub.html` — defensive file path normalization

## Reflections

First real bug report from an external user. The classic relative-vs-absolute path problem — works in one context, breaks in another. The fix is simple but the lesson matters: in a system where the same content is served from multiple URL contexts (static files, KV functions, redirects), all internal links must be absolute.

This is a CMS-grade concern. Traditional CMS platforms solve it with base URL configuration and canonical URL resolution. Blazar hit the same problem naturally — the manifest is a content registry, the hub is a navigation layer, and the reports are served from multiple paths. The manifest's `file` field is effectively a canonical URL and should have been absolute from the start.

The defensive normalizers in both hubs are belt-and-suspenders — the manifest is now correct, but any future manifest entry (from KV API, from a generation event) that forgets the `/reports/` prefix will still resolve correctly.
