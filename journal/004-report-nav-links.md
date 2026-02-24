# 004 — Report Navigation Links

**Date:** 2026-02-24
**Type:** Infrastructure

## What happened

Added a sticky navigation bar to all reports linking them to the hub and to their related reports:

- **Content Gaps report** → hub + Action Plan
- **Action Plan report** → hub + Content Gaps Analysis

The nav bar is a `.report-nav` element at the top of `<body>`, sticky positioned, with a "Hub" link and pill-styled related report links.

Added a rule to CLAUDE.md: every report must include this nav bar.

## Artifacts changed

- `reports/aem-live-content-gaps.html` — added nav bar
- `reports/aem-live-action-plan.html` — added nav bar
- `CLAUDE.md` — added report navigation convention
