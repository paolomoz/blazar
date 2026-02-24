# 022 — Brand Analysis Sprint

**Date:** 2026-02-24
**Type:** Sprint / Brand Analysis

## What Happened

The user asked to "extract the brand guidelines from aem.live and build a report. focus on tone, structure, logic of the documentation and quality of the images. then in a separate report analyse the improvement opportunities." Two reports were produced. Then the user asked "what else can we analyse around branding?" — 8 additional analyses were suggested. The user's response: "do all of them in separate reports."

This triggered a sprint: 8 parallel research agents launched simultaneously, each fetching pages, analyzing data, and building visual HTML reports. The full set of brand analyses produced in this session:

1. **Brand Guidelines Extraction** — consolidated from 3 intermediate agent reports into one
2. **Improvement Opportunities** — 22 prioritized recommendations with 4-sprint execution plan
3. **Internal Link Equity** — FAQ is the accidental equity hub, ~100 orphan pages
4. **Competitor Positioning** — 6-brand comparison across 10 dimensions
5. **SEO Brand Signals** — 0/8 pages with lang attribute, 7/8 titles missing brand name
6. **Brand Consistency Scorecard** — mean 76/100, FAQ at 58 is highest-risk page
7. **Content Readability** — FK Grade 7.8 to 13.8, jargon density is the barrier
8. **Developer Touchpoints** — only 33% of naming exclusively uses AEM brand
9. **Brand Evolution Timeline** — 8 years, 6+ names, hlx.live returns 403 not 301
10. **Performance Validation** — "Lighthouse 100" promise substantiated, but 0% alt text

## How It Was Built

The 8-report sprint used maximum parallelism: all 8 research agents launched in one tool call. Each agent independently fetched live pages via WebFetch, ran analysis, and wrote its HTML report. Seven of the eight agents produced complete reports. The performance validation agent gathered all the data but didn't write the HTML — that was built manually from its research output.

Three intermediate reports (brand-guidelines, brand-voice, image-analysis) were consolidated into two final reports per the user's original instruction ("in a separate report"), then the intermediates were deleted. This is noteworthy: the system generated too many artifacts initially and had to self-correct.

## Key Technical Details

- **Parallel agent execution:** 8 agents running simultaneously, each with its own web fetches and file writes
- **Manifest management:** `reports/README.md` manifest and `reports/hub.html` JS manifest updated multiple times to keep all 14 reports in sync
- **Report conventions:** Each report includes sticky `.report-nav` bar, `chat.js` script, related report pills, cross-validation stamp
- **Agent limitation observed:** One of 8 agents (performance validation) completed research but didn't produce the HTML artifact, requiring manual completion

## Reflections

This session is the strongest evidence yet for the Blazar thesis. In a single sitting, the system produced a 10-report brand audit suite that would take a traditional agency weeks. The key insight isn't just speed — it's the interconnection. Each report references and links to related reports. The competitor analysis informs the brand consistency scorecard. The SEO signals validate the developer touchpoints. The readability scores contextualize the brand voice guidelines.

The 8-agent parallel sprint is also a process insight. Launching all analyses simultaneously means the total wall-clock time is bounded by the slowest agent, not the sum. The bottleneck was manifest coordination — keeping `README.md` and `hub.html` in sync as reports arrived.

The consolidation step (3 reports → 2) shows the system can self-correct when it overshoots. The user asked for 2 reports; agents produced 3. The system recognized the mismatch and fixed it. This is closer to how an LLM-driven CMS would actually work: generate, evaluate, refine.

14 visual reports now live in the hub. The mind map has gone from a concept to a meaningful navigation tool — the density of connections between brand reports creates a genuine knowledge graph of the managed experience.
