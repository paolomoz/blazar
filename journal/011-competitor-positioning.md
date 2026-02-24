# 011 — Competitor Brand Positioning Audit

**Date:** 2026-02-24
**Prompt:** "I need to compare www.aem.live's brand positioning against 5 competitors. This is for a brand audit report."

## What Happened

User requested a competitive brand positioning analysis comparing aem.live against 5 specific competitors: Contentful, Sanity, Netlify, Vercel, and WordPress VIP. Required 10 analysis dimensions per competitor including exact hero messaging quotes, 7-axis tone scoring, CTA strategy, social proof, audience targeting, pricing transparency, and strategic differentiation.

## What Was Built

### Data Collection
- Fetched all 6 homepages live (aem.live + 5 competitors)
- Fetched 5 competitor pricing pages independently for cross-validation
- Extracted exact headline text, CTAs, positioning claims, and social proof from each

### Visual Report
`reports/aem-live-competitor-positioning.html` — comprehensive competitive intelligence report with:
- **Executive summary** with 6 key findings
- **SVG positioning map** — 2-axis plot (developer/business vs performance/content) with all 6 brands
- **Hero messaging comparison** — exact quotes from all 6 homepages with pattern analysis
- **7-axis tone comparison** — visual spectrum bars with 6 brand markers per axis, plus data table
- **CTA strategy cards** — visual mockups of each brand's primary CTA + free tier status
- **Audience focus table** — developer vs business priority with evidence
- **Pricing transparency matrix** — transparency scores from 1-5 with tier details
- **Social proof strategies** — logos, testimonials, metrics, case studies per brand
- **6 full brand profiles** — complete 10-dimension cards
- **8 strategic insights** for aem.live — opportunities and gaps identified
- **Competitive ranking table** — aem.live ranked across 10 dimensions

### Key Findings
1. **aem.live owns performance.** Lighthouse 100 guarantee is unique — no competitor claims this.
2. **AI is the universal land grab.** 4 of 5 competitors lead with AI in their hero. aem.live has zero AI messaging.
3. **aem.live is the most educational.** Scoring 82 on educational axis vs Contentful's 28. This builds developer trust.
4. **No free tier is the biggest gap.** Every developer-first competitor offers generous free tiers. aem.live has no self-serve path.
5. **Category fragmentation is extreme.** No two brands claim the same category. aem.live doesn't clearly name its own.

## Reflections

This is the kind of analysis that would take a human brand strategist 2-3 weeks of manual research, homepage screenshots, and spreadsheet scoring. The LLM completed it in a single session: fetched 11 live web pages, scored tone across 42 data points (7 axes x 6 brands), built a publication-ready visual report with SVG positioning map, and identified actionable strategic gaps.

The cross-validation approach (fetching pricing pages independently of homepages to verify claims) catches the kind of errors that happen when you rely on a single data pass. WordPress VIP's pricing page exists but contains no actual pricing — something you only discover by checking.

The positioning map visualization is particularly useful. Seeing all 6 brands plotted on developer-vs-business and performance-vs-content axes makes the competitive landscape immediately legible. aem.live occupies a genuinely unique quadrant (performance-first, balanced audience) that no competitor directly challenges.

This is Blazar doing what it was built for: turning raw competitive intelligence into visual decision-making artifacts, entirely from the LLM.
