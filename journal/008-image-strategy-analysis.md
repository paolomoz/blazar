# 008 — Image Strategy & Quality Analysis

**Date:** 2026-02-24
**Type:** Analysis

## What happened

User requested a comprehensive image usage and quality analysis across aem.live. The prompt was specific and detailed — fetch 5 named pages plus brand assets, analyze image types, quality, alt text, responsiveness, styling consistency, brand alignment, broken images, and OG/social sharing images.

Fetched and analyzed 7+ pages in detail: homepage, /home, /developer/tutorial, /docs/setup-customer-sharepoint, /docs/sidekick, /docs/authoring, /docs/architecture, /developer/block-collection. Also fetched styles.css, scripts.js, the query index (197 entries), and the official /docs/media documentation page. Attempted /new-logo.svg (404) and /developer/ (404, already known).

## Key findings

**The paradox:** World-class image delivery infrastructure paired with near-total accessibility failure.

**Infrastructure (A+ grade):**
- Media Bus with Content Addressable Storage and automatic deduplication
- Automatic `<picture>` elements with 4 variants per image (750px mobile + 2000px desktop, each in WebP + original format)
- Lazy loading by default, LCP priority for hero images
- Same-origin delivery, immutable caching via content-addressed URLs
- Dynamic manipulation via query parameters (width, height, format, optimize)

**Accessibility (F grade):**
- ~95% of images across the site have empty `alt=""` — this includes informative screenshots, diagrams, and illustrations
- Only 1 image across all analyzed pages had meaningful alt text: "White Adobe logo on a red square"
- The authoring guide page that says "set an alternative text for all images" has zero alt text on its own images

**OG/Social (weak):**
- 89 of 197 pages (45%) use the generic `default-social.png` fallback
- No `og:image`, `og:title`, or `twitter:card` meta tags found in HTML source of any page
- High-traffic pages (homepage, /developer, /docs/) all use the generic fallback

**Other findings:**
- 4 partner logos still reference the old `hlx.live` domain, causing 301 redirects
- No header logo — text-only "Adobe Experience Manager" branding
- Screenshots lack annotations (arrows, highlights, callouts)
- No `<figure>`/`<figcaption>` patterns used anywhere
- Blog page has no visual cards or thumbnails
- CSS has mature image design tokens (border-radius, drop-shadow) but documentation screenshots don't use them

## Decisions

- Produced a full visual HTML report with 11 sections: executive summary, infrastructure deep-dive, coverage analysis, accessibility audit, per-page breakdowns, image types/formats, styling consistency, brand assets, OG/social, naming conventions, and 10 prioritized recommendations.
- Registered in manifest and hub as category "audit" (like content gaps) since it's a site assessment.

## Artifacts

- `reports/aem-live-image-analysis.html` — new report
- `reports/README.md` — manifest updated with new entry
- `reports/hub.html` — hub manifest updated

## What I learned

- EDS Media Bus is genuinely impressive infrastructure — content-addressed deduplication, automatic format conversion, responsive picture generation, same-origin delivery. This is the kind of infrastructure that's invisible when it works and very hard to build from scratch.
- The alt text problem is systemic — it stems from the authoring workflow (Word/Google Docs) where alt text is an extra step that authors skip. The platform supports it, the docs recommend it, but nobody actually does it. This is a governance problem, not a technical one.
- Missing OG meta tags in the HTML is a potentially significant finding that needs investigation. The query index has image data, but it doesn't seem to make it into the rendered `<head>`. Could be a WebFetch artifact (not seeing dynamically injected tags) or a real gap.
- SVGs and PDFs are treated differently from raster images in EDS — not through Media Bus, not content-addressed. This explains why architecture diagrams have human-readable filenames while screenshots have hashes.
