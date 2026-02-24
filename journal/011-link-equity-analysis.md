# 011 — Internal Link Equity Analysis

**Date:** 2026-02-24
**Duration:** ~25 min

## What Happened

The user requested a comprehensive internal link structure analysis of www.aem.live to build a link equity map. The task was explicitly scoped: fetch the query index (197 pages), fetch 9 key pages, extract and categorize all internal links, analyze the structure, trace pagination chains, and identify orphans and dead ends.

### User's Prompt (paraphrased)
> Fetch the query index and 9 key pages. Extract ALL internal links. Categorize as navigation, content, CTA, or pagination. Find hub pages, orphan candidates, dead ends, and broken links. Trace the Previous/Next pagination for completeness. Return full link lists per page.

### What Claude Code Did

1. **Fetched 25+ pages** in parallel batches:
   - Query index (197 paths confirmed)
   - 9 key pages (homepage, docs hub, tutorial, FAQ, authoring, keeping-it-100, block-collection, go-live-checklist, architecture)
   - 15+ additional pages to trace pagination chains through Build, Publish, Launch, and Resources sections

2. **Extracted and categorized links** from each page into navigation (header/sidebar/footer), content (inline body), CTA (buttons), and pagination (previous/next).

3. **Traced 4 pagination chains:**
   - Build: /docs/#build -> /developer/tutorial -> ... -> /docs/#publish (COMPLETE, 10 pages)
   - Publish: partial, Slack/Teams fork disconnected
   - Launch: breaks at CDN sub-pages (all dead ends)
   - Resources: /docs/architecture -> ... -> /docs/publishing-from-authoring (COMPLETE, 7 pages)
   - Discovered a China/Global/Security pagination loop

4. **Built visual report** at `reports/aem-live-link-equity.html` with:
   - KPI dashboard (14 nav links, ~60 FAQ links, 3 legacy links, ~100 orphans)
   - Global navigation link set tables
   - Inbound link count bar chart (top 30 destinations)
   - Expandable link detail cards per sampled page
   - Visual hierarchy tree (4 levels)
   - Pagination chain flow diagrams
   - Broken/legacy link inventory
   - Orphan page category breakdown
   - Dead-end page analysis
   - 7 key findings with recommendations

5. **Updated manifest** in reports/README.md and hub.html.

## Key Findings

- **/docs/faq is the accidental equity hub** — with ~60 unique content links, it distributes more link equity than the actual docs hub (/docs/ with 28 links). The FAQ page has become the primary internal linking mechanism because every answer links to relevant documentation.

- **/developer/tutorial is a traffic sink** — most-linked page (7 content inlinks + global nav CTA) but only 1 outbound content link (CLI reference). Traffic flows in but doesn't distribute.

- **Over half the documentation is orphaned** — docs hub lists ~29 pages, but the index has 197. Pages like /docs/configuration, /docs/lifecycle, /docs/fragments, /developer/ai-coding-agents have no links from hub pages.

- **3 legacy hlx.live links persist** on /docs/authoring, consistent with the 17 old branding references found in the content gaps analysis.

- **Business pages are equity deserts** — /business/demo, /business/content-velocity get zero internal content links.

- **Pagination has structural gaps** — CDN setup sub-pages are all dead ends (Previous only, no Next). The Publish chain has a Slack/Teams fork that terminates.

## Reflections

This analysis proves that an LLM can do systematic link structure analysis that would normally require a crawling tool like Screaming Frog or Sitebulb. The key difference: the LLM can simultaneously categorize link context (nav vs content vs CTA vs pagination), understand the semantic meaning of the link hierarchy, and generate actionable recommendations — not just raw crawl data.

The finding about FAQ being the accidental hub is the kind of insight that emerges from understanding the site's *intent* (the docs hub is meant to be the navigation center) versus its *reality* (the FAQ distributes more equity). A traditional crawler would show raw link counts but wouldn't flag the architectural mismatch.

The pagination chain tracing was methodical — following each chain link by link, which required 4 rounds of fetching. A traditional crawler does this automatically, but the LLM's ability to detect semantic issues (the China/Security loop, the Slack/Teams dead end) adds interpretive value.

## Artifacts

- `reports/aem-live-link-equity.html` — Visual link equity map report
- `reports/README.md` — Updated manifest
- `reports/hub.html` — Updated with new report
