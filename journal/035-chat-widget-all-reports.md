# 035 — Chat Widget on All Reports

**Date:** 2026-02-25

## What Happened

User reported the chat panel only appeared on the hub/mind map and when opening reports from chat cards, but not when navigating to a report from the mind map or landing directly on a report URL.

## Investigation

The chat widget (`reports/chat.js`) is a self-initializing IIFE that appends itself to `document.body` on DOMContentLoaded. It uses `position: fixed` with z-index 10001 and persists state via localStorage. The widget itself has no conditional rendering — it always shows when loaded.

The root cause: **9 out of 14 report HTML files were missing the `<script src="chat.js"></script>` tag** before `</body>`. Only 5 reports (action-plan, brand-guidelines, brand-opportunities, content-gaps, performance-validation) and hub.html had it.

## Fix

Added `<script src="chat.js"></script>` before `</body>` in all 9 missing reports:
- aem-live-brand-consistency.html
- aem-live-brand-evolution.html
- aem-live-competitor-positioning.html
- aem-live-developer-touchpoints.html
- aem-live-image-quality.html
- aem-live-link-equity.html
- aem-live-readability.html
- aem-live-rum-analysis.html
- aem-live-seo-signals.html

All 15 HTML files (14 reports + hub) now include chat.js.

## Lesson

When reports are generated at different times (sprint batches), the chat.js inclusion can be missed. The generate-report pipeline should ensure chat.js is always included in new reports.
