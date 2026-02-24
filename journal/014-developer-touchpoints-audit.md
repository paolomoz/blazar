# 014 — Developer Touchpoint Brand Audit

**Date:** 2026-02-24
**Type:** Brand Analysis

## What Happened

User asked to audit whether the aem.live brand voice extends consistently into developer touchpoints beyond the website: GitHub repos, CLI tools, npm packages, and the Sidekick browser extension.

**Prompt (paraphrased):** "I need to audit how the aem.live brand voice extends into developer touchpoints beyond the website. Does the brand consistency hold in GitHub repos, tools, and code?"

Six research tasks defined:
1. Analyze adobe/aem-boilerplate (README, code, CONTRIBUTING, templates, license)
2. Analyze adobe/aem-block-collection (same dimensions)
3. Analyze adobe/helix-cli aka @adobe/aem-cli (README, CLI help text, error messages, naming)
4. Analyze adobe/aem-sidekick (README, UI text/labels, error messages)
5. Fetch npm package metadata for @adobe/aem-cli
6. Search for other relevant repos in the Adobe GitHub org

## What Claude Code Did

All data fetched via GitHub API (`gh api repos/adobe/{name}/...`):
- Repository metadata (description, topics, license, dates)
- README.md files (base64-decoded)
- CONTRIBUTING.md files from all 4 repos
- PR templates and issue templates
- Full source code of key files: `scripts/aem.js`, `scripts/scripts.js`, `blocks/cards/cards.js`, `blocks/header/header.js`, `blocks/carousel/carousel.js`
- CLI source: `src/cli.js`, `src/up.js`, `src/up.cmd.js`, `src/server/HelixServer.js`, `src/update-check.js`
- Sidekick UI locale: `_locales/en/messages.json` (200+ strings)
- AGENTS.md and CLAUDE.md from boilerplate
- File trees for all repos
- npm metadata via `npm view @adobe/aem-cli --json`
- GitHub org search for all adobe/aem-* and adobe/helix-* repos (30+ each)

Key discovery: the CLI repo is still named `adobe/helix-cli` (not `aem-cli`), the npm package `@adobe/aem-cli` points back to it, and internal classes are still `HelixServer`, `HelixProject`, etc.

## What Was Produced

Visual HTML report: `reports/aem-live-developer-touchpoints.html`

Sections:
- Executive summary with 4 key stats (5 touchpoints, 67% naming consistency, 14 legacy refs, B+ grade)
- Naming consistency table (12 naming touchpoints, 4/12 exclusively AEM)
- Per-touchpoint deep analysis with exact quotes from source files
- Brand trait score bars per touchpoint
- Full heatmap: 6 touchpoints x 6 brand traits (with www.aem.live baseline)
- 6 critical inconsistencies documented with impact assessment
- Overall verdict with strengths/weaknesses/quick wins
- Cross-validation stamp

## Key Findings

1. **window.hlx is the most impactful naming issue** -- every page, every developer, every day
2. **CONTRIBUTING.md in the template repo says "Contributing to Project Helix"** -- inherited by every new project
3. **npm package has null keywords and a 2-word description** -- zero discoverability
4. **AGENTS.md is the single strongest brand document** -- scores 5/5 on all 6 traits
5. **Sidekick has the best error messages** -- specific limits, actionable alternatives, the only place that says "Apologies"
6. **helix- repos outnumber aem- repos ~8:1** in the active EDS ecosystem
7. **Engineering Pragmatism is the trait that survives** everywhere (avg 4.3/5) -- the code IS the brand

## Reflections

This analysis reveals an interesting pattern for the Blazar thesis: the strongest brand expression in the developer ecosystem is not a marketing artifact or a documentation page -- it is AGENTS.md, a document written specifically for AI coding assistants. It carries all 6 brand traits because it was written recently, by people who deeply understand both the product and the audience.

This suggests that LLM-driven experience management might actually improve brand consistency in developer tools. If AI agents are the primary consumers of these instructions (and increasingly they are), then the AGENTS.md pattern -- authoritative, opinionated, transparent -- is the future of developer documentation. The fact that it is the best-branded document in the ecosystem is not a coincidence; it is a signal.

The naming debt (helix -> franklin -> aem) is a real-world example of what happens when brand governance does not extend to infrastructure. The website was rebranded; the repos were not. An LLM-driven governance system could detect and flag these inconsistencies automatically -- exactly what this audit does.
