# 004 — AEM.live Documentation Architecture Analysis

**Date:** 2026-02-24
**Type:** Analysis

## What happened

Deep-dive into the documentation structure of www.aem.live. Fetched and analyzed 8 pages across the docs hierarchy: the main docs hub, developer tutorial, markup/sections/blocks reference, block collection catalog, anatomy of a project, performance guide, authoring guide, and exploring-blocks bridge doc. Cross-referenced findings against the query index (197 pages, 85 under /docs/, 72 under /developer/).

## Prompt

> "Fetch and analyze the documentation structure and logic of aem.live. I need to understand how their docs are organized."

## Findings

### Information Architecture

Two parallel documentation trees:

1. **`/docs/` (85 pages)** — Audience: content authors, site operators, administrators. Topics: authoring workflows, CDN setup, authentication, publishing, go-live checklists, operational telemetry.
2. **`/developer/` (72 pages)** — Audience: developers. Topics: tutorial, blocks, markup, indexing, performance, forms, integrations.

Both trees are surfaced through a single hub (`/docs/`) organized around three lifecycle pillars:
- **Build** — developer-facing (links into /developer/)
- **Publish** — author-facing (links into /docs/)
- **Launch** — operations-facing (mix of both)

Plus two cross-cutting sections: **Resources** and **Architecture**.

### Documentation Types Identified

1. **Getting-started tutorial** (`/developer/tutorial`) — Sequential, 5-phase walkthrough. Prerequisites listed. CLI commands with copy-paste code blocks. Congratulations ending with community links. Classic tutorial pattern.
2. **Guided references** (`/developer/anatomy-of-a-project`, `/developer/markup-sections-blocks`) — Hybrid: narrative flow like a tutorial but structured for lookups. Explain concepts progressively, include file listings and conventions. Link to live examples on GitHub.
3. **Performance guide** (`/developer/keeping-it-100`) — Prescriptive how-to with metrics targets. Problem-explanation-solution structure. No inline code; conceptual and measurement-focused.
4. **Catalog pages** (`/developer/block-collection`) — Index of blocks with classification labels (Default Content, Block, Autoblock, Block Add-on, Deprecated). Links to detail pages.
5. **Block detail pages** (`/developer/block-collection/*`) — Redirect to Sidekick Library app (301 to `sidekick-library--aem-block-collection--adobe.aem.page`). Not traditional documentation pages; they're interactive previews inside the Sidekick tool.
6. **Author guides** (`/docs/authoring`) — Task-oriented, minimal jargon, empathetic tone ("you already know how to create content"). Heavy on screenshots, light on code.
7. **Bridge docs** (`/docs/exploring-blocks`) — Connect authoring and developer perspectives. Explain how Word/Docs tables become HTML blocks.

### Template Pattern

All pages share a consistent template:
- **Global nav:** Build / Publish / Launch pillars with dropdown descriptions
- **Resources sidebar:** Sidekick, Community (Discord), Admin API, Status, Blog
- **Content area:** H1 title, body content, embedded images/diagrams
- **Pagination:** Previous / Next links forming a reading order within each section
- **Footer:** Three-column layout — Guides, Resources, Help — plus legal links

### Navigation and Cross-linking

- **Linear sequence within sections:** Previous/Next links create a defined reading order. Developer track: Tutorial -> Anatomy -> Block Collection -> Block Party -> Spreadsheets -> Indexing -> Keeping it 100 -> Markup/Sections/Blocks -> ...
- **Hub-and-spoke for blocks:** Block Collection page is the hub; individual blocks link out to Sidekick Library (external app, not docs pages).
- **Cross-section links:** Performance guide references architecture concepts; authoring guide links to metadata and spreadsheets developer docs. Not systematic — more organic/contextual.
- **External links:** GitHub repos (aem-boilerplate, aem-block-collection), Discord, status.adobe.com, PageSpeed Insights.

### Code Example Patterns

- **Tutorial:** Shell commands (`npm install`, `git clone`) with placeholder tokens (`<owner>`, `<repo>`). Copy-paste friendly.
- **Markup reference:** Inline HTML showing DOM structure. Single focused code block showing the block div pattern.
- **Anatomy:** Links to GitHub repos instead of inline code. "See in Action" pattern pointing to live examples.
- **Performance guide:** No code at all — conceptual guidance with metric thresholds.

Code examples are sparse overall. The docs lean toward explanatory text and visual diagrams over code-heavy references.

### Structural Inconsistencies

1. **Block detail pages are not documentation.** They redirect to the Sidekick Library app. The query index lists them as pages with titles and descriptions, but they're interactive tool views, not readable docs. This creates a gap: there's no standalone reference page for any individual block.
2. **Dual-path duplication.** Some topics exist in both trees: `/developer/placeholders` and `/docs/placeholders`, `/developer/operational-telemetry` and `/docs/operational-telemetry`. Unclear which is canonical.
3. **Inconsistent content depth.** Tutorial is comprehensive and well-structured. Some reference pages (markup-sections-blocks) are thin — single code example for a concept that underpins the entire platform.
4. **Old branding artifacts.** Query index still contains "Franklin" references in descriptions (e.g., `/business/demo`). Description says "AEM Franklin" — a deprecated product name.
5. **Missing intermediate content.** Gap between "here's the tutorial" and "here's the full reference." No intermediate how-to guides for common tasks (e.g., "how to create a custom block from scratch," "how to set up local testing").
6. **Uneven navigation.** The Build section links primarily to /developer/ pages but some /docs/ pages (like `dev-collab-and-good-practices`) sit under /docs/ despite being developer-focused.

## Artifacts

- This journal entry (analysis only, no report generated)

## What I learned

- AEM.live's docs follow a lifecycle-based IA (Build/Publish/Launch) rather than a role-based or topic-based one. This works well for the initial journey but makes it harder to find specific reference information later.
- The Sidekick Library redirect pattern for block details is unusual — it means the documentation system itself doesn't contain block documentation; the tool does. Good for interactive exploration, bad for searchability and LLM-driven analysis.
- The two-tree structure (/docs/ vs /developer/) creates audience separation but also fragmentation. Some topics genuinely belong in both, leading to duplication.
