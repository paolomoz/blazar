# Visual UI System

## Purpose

Every relevant artifact in this project gets a visual HTML interface designed for business users — not developers, not terminal users. These are standalone HTML files that open in a browser.

## Rules

- **Build a visual UI** for any artifact a business stakeholder would care about (reports, audits, analyses, dashboards, optimization results).
- **Follow the design system** at `/Users/paolo/excat/nova/DESIGN.md` for all visual UIs.
- **Register every UI** in the manifest below so the hub can find it.
- **Update existing UIs** when their underlying context changes — don't leave stale reports.
- **Hub navigation** (`hub.html`) provides two views:
  - **Chronological** — timeline of all UIs in creation order
  - **Mind map** — conceptual relationships between artifacts

## Manifest

Each entry: `id`, `file`, `title`, `date`, `category`, `related` (IDs of connected artifacts).

```json
[
  {
    "id": "aem-live-content-gaps",
    "file": "aem-live-content-gaps.html",
    "title": "Content Gaps Analysis: www.aem.live",
    "date": "2026-02-24",
    "category": "audit",
    "summary": "197 indexed pages, 192 sitemap URLs. 10 pages missing from sitemap, 5 sitemap-only pages, 4 broken nav links, 65 missing OG images, 72 stale pages (37%), 17 old branding references.",
    "related": []
  }
]
```

## Categories

- `audit` — Site assessments, gap analyses, compliance checks
- `brand` — Brand guidelines, validation, identity artifacts
- `content` — Content planning, analysis, editorial artifacts
- `performance` — Speed, SEO, technical performance reports
- `optimization` — Recommendations, improvements, A/B analysis
- `infra` — Architecture, deployment, technical reports

## File Conventions

- Files live in `reports/` directory
- Filename: `{id}.html` (matches manifest ID)
- Each file is fully self-contained (inline CSS, no external dependencies except Google Fonts)
- Open directly in a browser — no build step, no server required
