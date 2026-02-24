# 017 — SEO Brand Signals Analysis

**Date:** 2026-02-24
**Category:** Performance / SEO

## What Happened

User requested a comprehensive SEO brand signals analysis for www.aem.live — specifically how the brand presents itself in search results. The scope was ambitious: fetch 8 key pages and extract every SEO-relevant metadata element, check robots.txt and sitemap, verify HTTPS/trailing-slash behavior, and search for the brand's actual SERP presence.

## What Was Done

1. **Fetched raw HTML `<head>` from all 8 pages** via curl — not WebFetch, because the rendering tool strips `<head>` content. This was a key insight: always use raw curl for metadata audits.

2. **Extracted from each page:** title, meta description, og:title/description/image/type, twitter card tags, canonical URL, robots meta, JSON-LD, html lang attribute, hreflang, favicon link tags, H1 text and count, heading hierarchy.

3. **Verified technical signals via HTTP headers:** HTTPS redirect chain (http->https, non-www->www), HSTS, HTTP/2+H3, trailing slash behavior across 6 URL patterns.

4. **Fetched and analyzed robots.txt and sitemap.xml:** 241 URLs in sitemap, lastmod range 2025-11-13 to 2026-02-23, mixed trailing slash patterns.

5. **Ran web searches** for "aem edge delivery services" and "adobe edge delivery services" to see actual SERP rankings.

6. **Built visual report** at `reports/aem-live-seo-signals.html` with page-by-page metadata cards, coverage matrix, SERP previews, technical SEO findings, and brand consistency analysis.

## Key Findings

The basics are solid — all 8 pages have title, description, OG tags, Twitter cards, canonical URLs, and exactly 1 H1 each. But the brand optimization layer is almost entirely absent:

- **0/8 pages have lang="en"** — bare `<html>` everywhere (WCAG 3.1.1 failure)
- **0/8 pages have og:type** — required by OG protocol
- **0/8 pages have favicon link tags** — relies on /favicon.ico convention
- **0/8 pages have hreflang**
- **7/8 pages have no structured data** — only homepage has a minimal Corporation JSON-LD
- **7/8 title tags contain no brand name** — "Documentation", "Architecture", "Go-Live Checklist" could be any product
- **FAQ meta description starts with "Franklin and Helix"** — deprecated internal names in SERP

The most damning finding: **www.aem.live does not appear in the top 10 search results for "aem edge delivery services"**. Third-party agency blog posts outrank the official product site. For "adobe edge delivery services", only the architecture page barely makes it (position ~9) — because its description actually mentions "Edge Delivery Services".

## Artifacts

- `reports/aem-live-seo-signals.html` — full visual report
- Updated `reports/README.md` manifest
- Updated `reports/hub.html` manifest

## Reflections

This is where the LLM-as-CMS thesis becomes particularly powerful. A traditional SEO audit tool (Screaming Frog, Ahrefs) would catch the missing tags. But connecting "the FAQ description mentions deprecated brand names" to "this is why you're invisible in SERP" to "the architecture page ranks because it's the only one that says 'Edge Delivery Services'" — that synthesis across brand strategy, SEO mechanics, and competitive landscape is exactly what an LLM does that a tool cannot.

The finding that aem.live doesn't rank for its own brand term is a genuine strategic insight. The site's own go-live checklist talks about canonical URLs and sitemaps, but the site itself has never had a brand-aware SEO strategy. The irony: the product that promises 100 Lighthouse scores forgot that search visibility matters as much as performance scores.
