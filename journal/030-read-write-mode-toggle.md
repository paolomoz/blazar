# 030 — Read/Write Mode Toggle

**Date:** 2026-02-24

## What Happened

Added a read/write mode switch to the chat widget — a small toggle button in the input area that shifts the assistant from read-only (answer from existing reports) to write mode (propose and eventually generate new reports). This is the first concrete step toward Phase 2 of Blazar: an LLM that doesn't just read experiences but writes them.

## The Prompt

> I want to implement a read/write switch for the chat, where the current implementation is the read only, meaning user gets what they prompt out of the existing reports. while the write mode (new) would generate a new report if it makes sense, otherwise it would just answer based on existing data if data is already complete. the toggle should be "write" on or off with a small button like this example from Manus

User attached a screenshot of the Manus 1.6 input area showing small circular icon buttons below the textarea (the circled element: a puzzle-piece icon in a round button).

## What Was Built

### Frontend Toggle (`reports/chat.js`)

- **State:** New `writeMode` boolean (default `false`)
- **Button:** Small pill-shaped toggle in the input actions bar, left-aligned opposite the send button. Pencil icon + "Write" label. Dark fill + white text when active, light outline + muted text when inactive
- **Placeholder swap:** "Ask about reports..." (read) vs "Ask anything or request a new report..." (write)
- **API payload:** Sends `mode: 'write'` or `mode: 'read'` with every request

CSS is minimal — ~20 lines for the toggle states and transitions. The button sits in the existing `.blazar-chat-input-actions` bar, which was changed from `justify-content: flex-end` to `space-between` to accommodate left and right elements.

### Backend System Prompts (`functions/api/chat.js`)

Refactored from a single `SYSTEM_PROMPT` to three pieces:

- **`REPORTS_CONTEXT`** — shared report metadata (DRY, used by both modes)
- **`READ_PROMPT`** — original behavior: answer from existing reports, link to sections, flag gaps
- **`WRITE_PROMPT`** — new behavior with three-tier logic:
  1. If existing reports cover it → answer normally
  2. If the question reveals a gap → propose a new report (title, key questions, data sources, scope) and ask for confirmation
  3. If user explicitly requests a report → outline structure and confirm

The write prompt includes example topics (accessibility audit, content performance correlation, navigation architecture, mobile UX, dev docs completeness, page speed per template) to seed the LLM's imagination.

## Process

Straightforward implementation — no plan mode needed because the spec was clear from the screenshot and description. Read the full chat.js (1092 lines) and API function, then made 7 targeted edits:

1. Added `writeMode` state variable
2. Added CSS for `.blazar-chat-write-toggle` (normal + active + hover states)
3. Changed input actions to `space-between` layout
4. Added `WRITE_SVG` pencil icon constant
5. Modified input area HTML (toggle button + updated placeholder)
6. Added click handler for the toggle
7. Passed `mode` field in API request body

API side: split the monolithic prompt into shared context + two mode-specific prompts, updated the handler to select based on `body.mode`.

A linter ran automatically during edits and made minor cosmetic improvements (icon SVGs in header buttons, touch target sizes, history item previews). These were complementary, not conflicting.

## Files Changed

| File | Change |
|------|--------|
| `reports/chat.js` | Write toggle button, state, CSS, placeholder swap, mode in API payload |
| `functions/api/chat.js` | Split system prompt into READ/WRITE variants with shared report context |

## Reflection

This is the Phase 1 → Phase 2 inflection point. Until now, the chat was a read-only lens over static reports — a glorified search interface. The write toggle doesn't generate reports yet (the LLM proposes them, the actual generation would need to orchestrate scripts and HTML creation), but it establishes the contract: the user tells the system what they want to know, and the system decides whether the answer already exists or needs to be created.

The interesting design decision is the three-tier logic in write mode: don't generate a new report if the data already exists, only propose when there's a genuine gap. This prevents the "always generating" trap and keeps the system efficient. The LLM acts as a triage layer — read when you can, write when you must.

The Manus-inspired UI pattern (small icon toggle in the input toolbar) is the right affordance. It's discoverable but not distracting — most users will never touch it, but power users will live in write mode. The dark pill when active makes the mode switch unmissable.

From the thesis perspective: a traditional CMS would need separate "content creation" and "content viewing" modes with different UIs, permissions, and workflows. Here it's a single toggle that changes the system's intent. The interface stays the same — the intelligence behind it shifts.
