# 021 — Brand Evolution Archaeology

**Date:** 2026-02-24
**Type:** Research / Brand Analysis

## What Happened

The user asked for a comprehensive brand archaeology report tracing the naming evolution of what is now "Adobe Experience Manager Edge Delivery Services" -- from its earliest codenames through to current branding. The request was detailed and specific: search the web for history across multiple naming eras, fetch the FAQ and query index for remnants, search GitHub for repo naming patterns, find conference presentations under different names, and build a timeline with dates, evidence, exact quotes, and analysis.

## What Was Produced

A visual timeline report (`reports/aem-live-brand-evolution.html`) with 11 sections:

1. **Executive Summary** -- 6+ distinct names, 8-year lifespan, 93% website rebrand completion
2. **Name Roster** -- All 6 names documented with the official Adobe architecture.md quote listing them all
3. **Full Chronological Timeline** -- 5 eras with dated events, evidence quotes, and context
4. **Domain Archaeology** -- Every known domain verified via cURL with current HTTP status codes
5. **GitHub Repo Naming** -- 30+ helix-* repos, 11 franklin-*, 30+ aem-* with transition table
6. **Legacy Remnants** -- 13 pages with old naming on aem.live, plus developer-facing references
7. **Rebrand Completeness** -- Progress meters: 93% site content, 42% GitHub repos, 85% domains, 30% developer API
8. **SEO Consequences** -- Critical finding: hlx.live returns 403 not 301, losing link equity
9. **Community Impact** -- Hacker News quotes, partner confusion timeline, developer documentation gaps
10. **Strategic Analysis** -- Why each rename happened, current naming assessment, 6 recommendations
11. **Cross-Validation Stamp** -- 9 independent verification methods listed

## Research Method

Ran parallel web searches and page fetches across multiple threads:
- 10+ web searches across different naming eras and contexts
- 7 page fetches (FAQ, blog posts, GitHub architecture docs, hackathon list, partner blogs, Hacker News)
- GitHub API queries for helix-*, franklin-*, aem-* repos with creation dates and archive status
- cURL verification of 6 domains (project-helix.io, hlx.live, hlx.page, aem.live, aem.page, status.hlx.live)
- Query index scan of all 197 entries for franklin/helix/hlx references

## Key Findings

The product has had at least 6 names: Project Helix, Project Franklin, Next-Gen Composability, Success Edge, AEM Edge Delivery Services, and Edge Delivery Services. The full official name is 89 characters long.

Most remarkable finding: the architecture versioning oscillates between names -- Helix 1, Helix 2, Helix/Franklin 3, Franklin 4, back to Helix 5. The oldest name is also the most current internal name.

The 403 response on hlx.live (instead of 301) is a real SEO risk -- all inbound links to old domains lose their equity entirely.

## Reflections

This is the kind of analysis that would take a human researcher days of manual work -- combing through blog archives, checking HTTP status codes, cross-referencing GitHub creation dates, scanning JSON indexes. The LLM did it in one session with parallel research threads, producing a publication-ready visual report.

The brand archaeology genre is interesting for the Blazar thesis: it's not just content management, it's content intelligence. Understanding the naming history of a managed experience is critical context for any content optimization work. Every stale "franklin" reference on aem.live is a brand debt item that only makes sense in the context of this history.
