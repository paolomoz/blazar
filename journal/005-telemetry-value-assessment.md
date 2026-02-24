# 005 — Telemetry Value Assessment

**Date:** 2026-02-24
**Type:** Research

## What happened

After building the static content gap analysis and action plan (entries 002-003), the user asked the natural next question:

> "we have create some reports and actions for content gaps based on a static analysis (see the reports). what it provide any additional insights for content gaps to have access to the operational telemetry data for aem.live?"

They linked to `https://www.aem.live/docs/operational-telemetry` — AEM's Real User Monitoring (RUM) system. Two research agents ran in parallel: one fetched and analyzed the telemetry docs, the other reviewed our existing reports and data to understand the gap between what we have and what we'd gain.

## What we found

Our current analysis is entirely **structural/metadata-based** — query index, sitemap, nav links. It sees content from the inside out. Telemetry would add the **outside-in view**: what users actually do.

The most impactful telemetry signals for content gaps:

| Signal | What it unlocks |
|--------|----------------|
| **Page views by URL** | Traffic-weighted prioritization — our 18 actions are ranked by structural severity, but a stale page with 10k views is more urgent than one with zero |
| **404 checkpoint** | Demand-side gaps — broken links users actually hit from search, bookmarks, external referrers. We only found 4 structural dead links; real 404s could be 10x that |
| **`high-organic-low-ctr`** query | Pages ranking well in search but with poor click-through — a title/description gap our metadata check can't see |
| **`high-inorganic-high-bounce-rate`** query | Paid traffic landing on content that doesn't deliver — wasted spend |
| **On-site search** | Reveals content that *should* exist but doesn't — static analysis can only find problems in content that *does* exist |
| **CWV + errors** | Performance and JS errors as content gaps — slow/broken pages are effectively broken content from the user's perspective |

The RUM API (`@adobe/spacecat-shared-rum-api-client`) offers named queries for all of the above. Access requires a domain key for `www.aem.live` or an admin key.

## Decisions

- No code was written this session — purely a research/strategic assessment.
- Identified telemetry as the highest-leverage next data source to integrate.
- Access to RUM Explorer (`aem.live/tools/rum/explorer.html`) could allow manual exploration before building automated queries.

## Artifacts

- None (research only). Next step: build telemetry-enhanced analysis if/when RUM access is obtained.

## What I learned

- The static-to-dynamic analysis progression mirrors classic CMS evolution: you start with "what content do we have?" then graduate to "what are users doing with it?" Blazar needs both layers.
- AEM's telemetry is sampling-based (1 in 100 page views), privacy-first, no sessions/visitors — just checkpoints per page view. This means we can't do user journey analysis, but page-level engagement scoring is feasible.
- The most powerful insight would be cross-referencing our "stale" and "missing metadata" flags with actual traffic data. Some of those 72 stale pages might be getting heavy organic traffic (critical to fix) while others are genuinely dead (safe to remove). Without telemetry, we're guessing at priority.
