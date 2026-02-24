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
    "related": ["aem-live-action-plan", "aem-live-brand-guidelines"]
  },
  {
    "id": "aem-live-action-plan",
    "file": "aem-live-action-plan.html",
    "title": "Action Plan: www.aem.live",
    "date": "2026-02-24",
    "category": "optimization",
    "summary": "18 prioritized actions derived from content gaps analysis. 4 critical (dead page, sitemap/index sync, nav fix), 5 high (rebranding, stale content triage, metadata), 5 medium (legacy pages, labs review, deprecation), 4 low (index hygiene, monitoring).",
    "related": ["aem-live-content-gaps", "aem-live-brand-guidelines"]
  },
  {
    "id": "aem-live-brand-guidelines",
    "file": "aem-live-brand-guidelines.html",
    "title": "Brand Guidelines Extraction: www.aem.live",
    "date": "2026-02-24",
    "category": "brand",
    "summary": "Comprehensive brand analysis across 10 pages. 4 positioning pillars, tone-of-voice spectrum mapped across 7 axes, 6 personality traits with 42 evidence quotes, terminology map, 7 documentation patterns, image quality grades (A+ infrastructure, F accessibility, D social sharing), visual identity extraction.",
    "related": ["aem-live-brand-opportunities", "aem-live-content-gaps", "aem-live-action-plan"]
  },
  {
    "id": "aem-live-brand-opportunities",
    "file": "aem-live-brand-opportunities.html",
    "title": "Improvement Opportunities: www.aem.live Brand & Docs",
    "date": "2026-02-24",
    "category": "optimization",
    "summary": "22 prioritized improvement opportunities across accessibility, brand consistency, documentation architecture, and image strategy. 5 critical (alt text, /developer/ 404, block docs, naming, OG tags), 6 high (how-tos, code examples, asset migration, social images, deduplication, CTAs), 6 medium, 5 low. Impact/effort matrix with 4-sprint execution plan.",
    "related": ["aem-live-brand-guidelines", "aem-live-content-gaps", "aem-live-action-plan"]
  },
  {
    "id": "aem-live-link-equity",
    "file": "aem-live-link-equity.html",
    "title": "Internal Link Equity Map: www.aem.live",
    "date": "2026-02-24",
    "category": "audit",
    "summary": "Internal link structure analysis across 197 indexed pages. 14 global nav links, ~60 FAQ content links (top hub), 3 legacy hlx.live links, ~100 orphan page candidates, 2 complete pagination chains, 2 broken chains, 7 dead-end pages. /docs/faq is the accidental equity hub, /developer/tutorial is over-linked but under-linking.",
    "related": ["aem-live-content-gaps", "aem-live-action-plan", "aem-live-brand-opportunities"]
  },
  {
    "id": "aem-live-image-quality",
    "file": "aem-live-image-quality.html",
    "title": "Image Quality & AI Improvement: www.aem.live",
    "date": "2026-02-24",
    "category": "brand",
    "summary": "197 pages inventoried (132 custom, 65 fallback). HEAD checks on all custom URLs, format/size distribution. 5 candidates analyzed by Gemini: avg brand alignment 3.6/10. AI-generated improved images for homepage, docs/authoring, architecture, blog, developer hub. 10 prioritized recommendations.",
    "related": ["aem-live-brand-guidelines", "aem-live-brand-opportunities", "aem-live-content-gaps"]
  },
  {
    "id": "aem-live-competitor-positioning",
    "file": "aem-live-competitor-positioning.html",
    "title": "Competitor Brand Positioning Audit: www.aem.live",
    "date": "2026-02-24",
    "category": "brand",
    "summary": "6-brand competitive analysis across 10 dimensions. aem.live vs Contentful, Sanity, Netlify, Vercel, WordPress VIP. Positioning map, 7-axis tone comparison, CTA strategy, pricing transparency, social proof analysis, audience targeting. Key findings: aem.live leads on performance and educational tone; trails on AI messaging, free tier, and pricing transparency.",
    "related": ["aem-live-brand-guidelines", "aem-live-brand-opportunities"]
  },
  {
    "id": "aem-live-seo-signals",
    "file": "aem-live-seo-signals.html",
    "title": "SEO Brand Signals: www.aem.live",
    "date": "2026-02-24",
    "category": "performance",
    "summary": "8-page SEO metadata audit. All pages have title/description/OG/Twitter/canonical/single-H1. All 8 pages missing: lang attribute, og:type, favicon link tag, hreflang. 7/8 missing structured data. 7/8 titles lack brand name. FAQ description leads with deprecated 'Franklin and Helix' names. Site does not rank top-10 for 'aem edge delivery services'. Trailing slash inconsistency. 241 sitemap URLs vs 197 query index pages.",
    "related": ["aem-live-content-gaps", "aem-live-brand-guidelines", "aem-live-brand-opportunities", "aem-live-action-plan"]
  },
  {
    "id": "aem-live-brand-consistency",
    "file": "aem-live-brand-consistency.html",
    "title": "Brand Consistency Scorecard: www.aem.live",
    "date": "2026-02-24",
    "category": "brand",
    "summary": "Page-level brand voice audit across 12 pages. Mean score 76/100. 4 strong alignment (keeping-it-100: 92, tutorial: 90, architecture: 85, go-live: 83), 5 minor drift, 3 significant deviation (custom-headers: 63, FAQ: 58, business/demo: 48). 6 personality traits scored per page, 7 tone axes mapped. Key finding: developer pages average 82.5 vs docs pages 72.7. FAQ is the highest-risk page (high traffic, low alignment).",
    "related": ["aem-live-brand-guidelines", "aem-live-brand-opportunities", "aem-live-content-gaps"]
  },
  {
    "id": "aem-live-developer-touchpoints",
    "file": "aem-live-developer-touchpoints.html",
    "title": "Developer Touchpoint Brand Audit: aem.live Ecosystem",
    "date": "2026-02-24",
    "category": "brand",
    "summary": "5 developer touchpoints audited: 4 GitHub repos (aem-boilerplate, aem-block-collection, helix-cli, aem-sidekick) + npm package + AGENTS.md. 14 legacy 'helix' references in active use. Only 33% of naming touchpoints exclusively use AEM brand. CONTRIBUTING.md in template repo still says 'Project Helix'. npm package has null keywords and 2-word description. window.hlx runtime namespace, .hlxignore, admin.hlx.page all expose legacy naming. AGENTS.md is the strongest brand document in the entire ecosystem. Sidekick has best error messages. Overall grade: B+ (strong code, weak metadata).",
    "related": ["aem-live-brand-guidelines", "aem-live-brand-opportunities", "aem-live-brand-consistency"]
  },
  {
    "id": "aem-live-readability",
    "file": "aem-live-readability.html",
    "title": "Content Readability Scoring: www.aem.live",
    "date": "2026-02-24",
    "category": "brand",
    "summary": "10-page readability analysis testing 'inclusive directness' brand claim. FK Grade range 7.8 (homepage) to 13.8 (markup docs). Author docs avg Grade 9.1, developer docs avg 11.6. 86% active voice site-wide (brand strength). 3 pages inaccessible to non-technical stakeholders. Jargon density is primary barrier, not sentence structure. 52 undefined acronyms on the performance page alone.",
    "related": ["aem-live-brand-guidelines", "aem-live-brand-opportunities", "aem-live-content-gaps"]
  },
  {
    "id": "aem-live-rum-analysis",
    "file": "aem-live-rum-analysis.html",
    "title": "Traffic-Weighted Content Intelligence: www.aem.live",
    "date": "2026-02-24",
    "category": "performance",
    "summary": "157K estimated views over 10 days across 152 URLs. Cross-references RUM telemetry with static content analysis. 5 actions upgraded, 4 downgraded, 4 new from telemetry. 31 stale pages with traffic (update), 41 without (archive). 28 pages with CWV issues. 13.9K JS errors/period.",
    "related": ["aem-live-content-gaps", "aem-live-action-plan", "aem-live-brand-guidelines"]
  },
  {
    "id": "aem-live-brand-evolution",
    "file": "aem-live-brand-evolution.html",
    "title": "Brand Evolution Timeline: AEM Edge Delivery Services",
    "date": "2026-02-24",
    "category": "brand",
    "summary": "Brand archaeology tracing 8 years and 6+ product names: Project Helix (2018) to Project Franklin (2022) to Next-Gen Composability (Summit 2023) to Edge Delivery Services (Oct 2023). Domain migration from hlx.page/hlx.live to aem.page/aem.live (blocked Dec 2025). 13 legacy naming remnants on aem.live (93% clean). 40+ GitHub repos still named helix-*/franklin-*. Developer API surface only 30% rebranded (window.hlx, .helix/ config). hlx.live returns 403 not 301 (SEO risk). 19 hackathons documented since 2018. Architecture versions oscillate: Helix 1-2-3/Franklin 3-4-Helix 5.",
    "related": ["aem-live-brand-guidelines", "aem-live-developer-touchpoints", "aem-live-seo-signals", "aem-live-content-gaps"]
  },
  {
    "id": "aem-live-performance-validation",
    "file": "aem-live-performance-validation.html",
    "title": "Performance Brand Validation: www.aem.live",
    "date": "2026-02-24",
    "category": "performance",
    "summary": "Tests whether aem.live lives up to its 'Lighthouse 100' brand promise. CrUX field data: LCP 0.8s, INP 50ms, CLS 0.00 — all 'Good'. Critical path ~29 KB (under 100 KB target). E-L-D loading architecture verified in source code. All 7 performance standards from keeping-it-100 tested and passed. Key finding: performance promise substantiated, but accessibility failures (0% alt text, no lang attribute) prevent true Lighthouse 100 across all categories.",
    "related": ["aem-live-brand-guidelines", "aem-live-seo-signals", "aem-live-brand-opportunities"]
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
- **Shared CSS:** `blazar-reports.css` contains all shared design tokens, reset, and common components (nav, header, cards, tables, badges, etc.). Each report links this file and adds only report-specific overrides inline.
- Open directly in a browser — no build step, no server required
- Google Fonts `<link>` tags stay in each HTML `<head>` (not @import — better rendering performance)
