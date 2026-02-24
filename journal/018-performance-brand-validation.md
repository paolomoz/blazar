# 018 - Performance Brand Validation: "Lighthouse 100" Audit

**Date:** 2026-02-24
**Category:** Brand Audit > Performance

## What Happened

User requested a deep performance validation of www.aem.live against its own "Lighthouse 100" brand promise. This is the most technical audit so far -- not just checking claims, but reverse-engineering the actual delivery architecture from raw HTML, CSS, JavaScript, HTTP headers, and CrUX field data.

### The Request

> "I need to validate whether www.aem.live lives up to its own 'Lighthouse 100' brand promise."

Seven specific research tasks: fetch 4 pages with full performance analysis, check for public PSI data, get actual Lighthouse scores from PageSpeed, and extract exact quotes from their keeping-it-100 guide to compare claims vs. reality.

### What Was Done

1. **Fetched raw HTML** via `curl` for 5 pages (homepage, tutorial, docs, FAQ, keeping-it-100) with timing data
2. **Counted every performance-relevant element** across all pages: script tags, stylesheets, picture elements, lazy loading attributes, width/height dimensions, WebP sources, srcset attributes, DOM elements, alt text
3. **Fetched and measured all CSS and JS files** -- both raw and compressed sizes
4. **Analyzed HTTP headers** for CDN stack, caching, compression, CSP, HSTS
5. **Read source code** of `lib-franklin.js`, `scripts.js`, `delayed.js` to verify E-L-D loading architecture
6. **Checked font loading**: discovered the smart `lazy-styles.css` pattern with `font-display: swap` and `size-adjust` fallbacks
7. **Measured image sizes** in both WebP and PNG, at mobile (750px) and desktop (2000px) breakpoints
8. **Ran multiple TTFB measurements** (5 per page) for reliability
9. **Attempted PageSpeed Insights API** -- rate limited, API not enabled on available key
10. **Found real CrUX field data** via Treo.sh: LCP 0.8s, INP 50ms, CLS 0.00
11. **Extracted exact quotes** from keeping-it-100 and go-live-checklist for brand audit comparison

### Key Findings

**The "Lighthouse 100" brand promise is substantiated:**
- Critical path payload: ~29 KB compressed (vs. their 100 KB limit)
- CrUX field data: LCP 0.8s, INP 50ms, CLS 0.00 -- all "Good"
- Three-phase loading (E-L-D) faithfully implemented in source code
- Body hidden until ready, font fallback with size-adjust, WebP with responsive srcset
- No third-party scripts in critical path
- Dual CDN (Cloudflare + Fastly) with Brotli and high cache hit rates

**Gaps found:**
- 100% empty alt attributes across all 83 images (accessibility, not performance)
- Testing artifact (`indexing-test.js`) in production critical path
- Monolithic CSS (56 KB raw) serving all templates
- 94.3% desktop traffic skews field data away from mobile (despite mobile-first testing claim)
- TTFB variance up to 1,035ms on some requests

**Architecture is genuinely performance-first** -- this is not marketing theater. Every technique they describe in documentation is verifiable in source code.

## Technical Detail

Full resource inventory, per-page analysis, and architecture assessment delivered as structured data ready for visual report production.

## Reflections

This is the first audit where the LLM's ability to read and analyze raw source code proved essential. No traditional SEO tool would catch the `waitForLCP()` function dynamically upgrading `loading="lazy"` to `loading="eager"`, or the `body { display: none }` / `body.appear { display: unset }` pattern, or the `setTimeout(3000)` delayed phase. This is the kind of deep technical validation that normally requires a performance engineer reading the codebase.

The irony: the site's biggest brand gap is accessibility (empty alt text), not performance. They've optimized for one Lighthouse category (Performance) while neglecting another (Accessibility). This is a strategic insight for the brand audit.
