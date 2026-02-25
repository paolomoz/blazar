# Blazar

## Project Purpose

LLM-driven content and experience management and optimization system. Enables organisations to maximize brand visibility and make digital experiences successful — entirely from the LLM. Evolution of classic CMS: instead of a SaaS admin panel, the LLM runs analysis, builds visual reports, connects them in a navigable mindmap, and eventually reads/writes code and content directly.

**Phase 1 (current):** Read-only analysis and reports on existing experiences.
**Phase 2:** Read/write — the LLM modifies code and content of the managed experience.

## Rules

- **Auto-journal:** After every user request, write a journal entry. See `.claude/commands/journal.md` for format.
- **Self-update:** When you learn something useful across conversations (quirks, preferences, conventions), add it to this file. Keep it short — details go in separate files.
- **Design system:** When building visual HTML interfaces, read and follow `/Users/paolo/excat/nova/DESIGN.md`.
- **Visual UIs:** Every relevant artifact gets a visual HTML interface for business users. See `reports/README.md` for the system — includes a hub with chronological and mind map navigation. UIs must be updated when context changes.
- **Keep context in sync:** After any change that affects multiple artifacts, run the update process (see `.claude/commands/update.md`). Reports, hub, journal, and CLAUDE.md must stay consistent. Use `/update` for a full sweep.
- **Cross-validate:** Every report must be independently verified before being declared complete. Run HTTP spot-checks, recount raw data, sample content. Claude must not grade its own work. Add a validation stamp to the report showing what was checked and what was corrected.
- **Don't bloat this file.** Keep instructions short. Reference separate files for details.

## Architecture

- **Content-infrastructure agnostic.** Blazar manages experiences regardless of their stack. Test cases:
  - AEM Edge Delivery Services (use installed EDS skills for analysis and development)
  - Cloudflare stack (Astro + CF Pages/Workers)
- **Blazar's own infrastructure runs on Cloudflare** — Pages, Workers, R2, KV, D1, etc. Only use something else if Cloudflare genuinely can't do it.
- **Reference project:** `/Users/paolo/excat/wknd-trendsetters-playground` — the experiment that proved this concept. 32 journal entries documenting LLM-driven website management, 12 visual reports with hub/mindmap navigation, semantic content graph, brand governance, Zenith page builder.

## Tech Stack

TBD — to be defined as we build. Cloudflare-first for all blazar infrastructure.

## Managed Experiences

### www.aem.live (AEM EDS)
- **Query index:** `https://www.aem.live/query-index.json` — 197 pages, columns: path, title, image, description, lastModified, publicationDate, deprecation, labs.
- **Sitemap:** `https://www.aem.live/sitemap.xml` — 192 URLs.
- **Content gap analysis:** `reports/aem-live-content-gaps.html` — first analysis run 2026-02-24. Key findings: 72 stale pages (37%), 65 missing OG images, 17 old branding references, 10 pages missing from sitemap.
- **Analysis script:** `scripts/aem-live-content-gaps.mjs` — fetches query index, sitemap, and nav links, cross-references them, outputs JSON analysis to `data/aem-live/`.
- **RUM analysis:** `reports/aem-live-rum-analysis.html` — traffic-weighted content intelligence. 157K views over 10 days (Feb 2026), 152 URLs. Cross-references RUM telemetry with static analysis to reshuffle priorities: 5 actions upgraded, 4 downgraded, 4 new from telemetry.
- **RUM script:** `scripts/aem-live-rum-analysis.mjs` — processes raw RUM bundles, cross-references with analysis.json, outputs `data/aem-live/rum-feb-2026.json`.
- **Brand audit suite:** 10 reports covering guidelines, opportunities, link equity, competitor positioning, SEO signals, brand consistency (mean 76/100), readability (FK 7.8–13.8), developer touchpoints, brand evolution (6+ names, 8 years), performance validation. 14 total reports in hub.

## Operational Notes

- **LLM API:** Always use AWS Bedrock (via ABSK token), never the direct Anthropic API. Billing goes through AWS. The ABSK token authenticates with `Authorization: Bearer` against `bedrock-runtime.{region}.amazonaws.com`.
- **API keys:** `.env` file in project root (gitignored).
- **AEM EDS skills:** 17 skills installed via `aem-edge-delivery-services` plugin — use for all EDS analysis and development work.
- **Reports:** Design follows `/Users/paolo/excat/nova/DESIGN.md`. To preview, use the local dev server (`npx wrangler pages dev .` or equivalent) at `localhost` — never open HTML files directly as `file://` because the chat widget and API calls require a server.
- **Local dev server:** Always start wrangler with `.` (project root) as the directory: `npx wrangler pages dev . --port 8788`. Do NOT use `reports` as the directory — it breaks the `/reports/` path prefix and `_redirects` rules.
- **Shared CSS:** `reports/blazar-reports.css` — shared tokens, reset, and components for all reports. Reports link this file and keep only report-specific overrides inline. Change a token once, it propagates to all 14 reports.
- **Report navigation:** Every report must include a sticky `.report-nav` bar at the top of `<body>` with a link back to `hub.html` and pill links to all `related` reports from the manifest. When creating or updating reports, always add this nav bar.
- **Chat widget:** Every report includes `<script src="chat.js"></script>` before `</body>`. Persistent multi-tab chat assistant powered by Cloudflare Pages Function + Cerebras llama3.1-8b. Supports parallel conversations as browser-style tabs, history dropdown for reopening closed chats, localStorage persistence with migration from legacy format.
- **Parallel agents:** For multi-report sprints, launch all research agents in a single tool call for maximum parallelism. Wall-clock time = slowest agent, not sum. Coordinate manifests after all agents complete.
- **Generated report asset paths:** Reports served from `/r/{id}` (KV) must use absolute paths with `/reports/` prefix: `/reports/blazar-reports.css`, `/reports/chat.js`, `/reports/blazar-logo-36.svg`, `/reports/hub.html`. Never use bare `/blazar-reports.css` — it 404s. The `_redirects` file provides fallback redirects for backward compatibility.
- **Live viewer streaming:** `/r/{id}` serves a live viewer shell when KV misses. Uses BroadcastChannel with sync/full/chunk/done protocol for replay support. The iframe needs `<meta charset="UTF-8">` and `<base href="/reports/">` injected after `<head>` to fix encoding and relative path resolution.
- **Network graph hub:** `reports/hub-graph.html` — force-directed network graph of all reports. Reads `manifest.json` + `/api/manifest`, nodes sized by connection count, labels prioritized by connections with per-category coverage guarantee. Click navigates to report. Supports live generation events (pulsing nodes). Uses `ResizeObserver` to refit when chat panel initializes.
- **Design refinement:** Use `/impeccable:critique` then the appropriate follow-up (`/impeccable:bolder`, `/impeccable:simplify`, etc.). Critique identifies specific issues; follow-up fixes them. Key principles: color as communication (not decoration), section-specific accents as visual landmarks, typography scale jumps for hierarchy. For simplification: lead with the single most important number/finding, use `<details>` for progressive disclosure, compress supporting sections into tables, remove redundant stat grids.
