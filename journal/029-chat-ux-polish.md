# 029 — Chat Widget Tab/History UX Polish

**Date:** 2026-02-24
**Scope:** reports/chat.js

## What happened

Applied 5 UX improvements to the multi-tab chat widget, all identified by the `/impeccable:critique` workflow:

1. **Touch targets enlarged** — Tab close buttons 16→24px, history delete buttons 20→28px, header buttons padding increased with inline-flex layout. All now meet 32px minimum computed hit area.

2. **Icon affordance on header buttons** — "History" got a clock SVG icon + text label, "+" got a plus SVG icon. Both use `inline-flex` with `gap: 4px` for icon-text alignment.

3. **Tab bar persistence** — Previously hid when only 1 empty tab existed. Now stays visible whenever closed conversations exist in history, acting as a persistent navigation landmark.

4. **History item previews** — Each closed conversation now shows a 1-line preview (last message, markdown stripped, truncated to 60 chars) and message count ("3 msgs · 2h ago").

5. **Header-tab border integration** — Removed `border-bottom` from header. Tab bar's own `border-bottom` serves as divider. When tabs are hidden, a CSS sibling selector adds `border-top` to the messages area as fallback.

## Technical notes

- All changes in a single file (`reports/chat.js`) — CSS string + two render functions.
- The `shouldHide` logic in `renderTabs()` now checks for history existence: `store.chats.some(c => !openSet.has(c.id) && c.messages.length > 0)`.
- Preview text strips markdown chars (`#*_`\n`) before truncating — avoids showing raw formatting in the dropdown.

## Reflection

Classic UX polish pass — none of these changes are individually dramatic, but together they transform the widget from "functional prototype" to "considered product." The critique→fix pipeline works well for this kind of targeted improvement. Touch target sizing is one of those things that's invisible when right and painful when wrong.
