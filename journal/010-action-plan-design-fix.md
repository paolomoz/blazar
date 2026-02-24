# 010 — Action Plan Design Fix

**Date:** 2026-02-24
**Trigger:** User noticed design inconsistency in action plan report

## What happened

The `aem-live-action-plan.html` report was built with an older design pattern compared to the newer `aem-live-brand-guidelines.html`. Updated it to match the current design system.

## Changes

- **Container**: 960px → 1200px with responsive padding
- **Header**: Old `.header` + `.logo` → new `.report-header` with branding mark and date pill
- **Jump nav**: Bare pill links → card container with "In this report" title and styled links
- **Section titles**: Added blue underline accent (`border-bottom: 2px solid`)
- **Stat cards**: Plain colored numbers → `.stat-card` with colored top borders
- **Priority matrix**: Heavy colored backgrounds → subtle white cards with colored top borders
- **Action cards**: Shadow-only → shadow + border (1px solid)
- **Affected pages**: Added border to container
- **Nav bar**: Added missing related reports (Brand Guidelines, Brand Opportunities)
- **Peer review**: Moved inside `<main>`, cleaned up inline styles into `.review-card` class
- **CSS tokens**: Added cyan, fuchsia; updated font-mono stack; added `-webkit-font-smoothing: antialiased`
- **Typography**: line-height 1.6 → 1.5 to match other reports

## Design principle

All reports should share the same visual language. The brand guidelines report established the current standard — lighter cards with colored top-border accents instead of heavy colored backgrounds.
