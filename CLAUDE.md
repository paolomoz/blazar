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

## Operational Notes

- **API keys:** `.env` file in project root (gitignored).
- **AEM EDS skills:** 17 skills installed via `aem-edge-delivery-services` plugin — use for all EDS analysis and development work.
- **Reports:** Open HTML files directly in browser. Self-contained, no build step. Design follows `/Users/paolo/excat/nova/DESIGN.md`.
