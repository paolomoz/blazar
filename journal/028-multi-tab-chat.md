# 028 — Multi-Tab Chat with History

**Date:** 2026-02-24

## What Happened

Replaced the single-conversation chat widget with a multi-tab system. Users can now run parallel chats as browser-style tabs, close tabs (preserving the conversation in history), reopen past chats from a history dropdown, and have all state survive page refresh.

## The Prompt

User provided a complete implementation plan covering:
- Data model (`blazar-chat-store` localStorage key with `chats`, `openTabs`, `activeTab`)
- Tab bar UI (pill tabs with close buttons, auto-hidden when single empty tab)
- History dropdown (recency-sorted, with delete buttons and relative timestamps)
- Migration from old `blazar-chat-history` single-array format
- All function signatures and rendering changes

The plan was detailed enough to be implemented as a single pass — no ambiguity on behavior.

## What Was Built

### Data Model
- `store` object: `{ chats: [{id, title, messages, ts}...], openTabs: [id...], activeTab: id }`
- IDs via `crypto.randomUUID().slice(0,8)`
- Titles auto-generated from first user message (first 40 chars, stripping page context prefix)
- Max 50 messages per chat, max 100 chats in store (oldest closed chats pruned)

### Tab Bar
- Horizontal scrollable bar between header and messages
- Active tab: white bg, bold text, dark bottom border
- Inactive: transparent bg, muted text
- Close button (`✕`) on each tab
- Auto-hidden when only 1 tab and it's empty (clean first-load UX)

### History Dropdown
- Triggered by "History" button in header (replaced old "New chat")
- Absolute positioned, white bg, shadow, max-height 340px scrollable
- Shows title + relative time ("just now", "5m ago", "2d ago", etc.)
- Click to reopen as a new tab, `✕` to permanently delete
- Closes on outside click or Escape
- Only shows closed chats with messages (empty chats are garbage-collected on close)

### Header Changes
- "New chat" button replaced with `+` (creates new empty tab)
- "History" button added with dropdown wrapper

### Migration
On first load: if old `blazar-chat-history` key exists, wraps its messages into a single chat in the new store format, then deletes the old key.

## Process

All changes within `reports/chat.js` — a single IIFE file, no build step. The edit was surgical: 6 targeted replacements that converted the flat `messages[]` model to the multi-chat store without touching unrelated code (markdown renderer, card builder, report metadata, drag-to-resize). Node syntax check passed first try.

Key state management functions added:
- `loadStore()` / `saveStore()` — full store persistence with migration
- `createChat()` / `switchTab()` / `closeTab()` / `reopenChat()` / `deleteChat()`
- `renderTabs()` / `renderHistory()` — new rendering functions
- `renderMessages()` / `sendMessage()` — rewired to read from `getActiveChat()`

## Files Changed

| File | Change |
|------|--------|
| `reports/chat.js` | Multi-tab data model, tab bar UI, history dropdown, migration logic |

## Reflection

This is the first time the chat widget got a genuine UX architecture upgrade rather than a visual restyling. The single-conversation model was fine for a demo but fundamentally limiting: you couldn't ask about SEO signals while keeping a brand consistency thread open. Tabs fix that, and the history dropdown means no conversation is ever lost — just closed.

The implementation plan was detailed enough that the entire feature was built in a single pass with no rework. That's the ideal pattern: the LLM plans exhaustively in plan mode (exploring code, designing data models, specifying CSS), then executes mechanically. The planning phase is where the intelligence lives; the execution is just typing.

From the Blazar thesis perspective: a traditional CMS chat widget would never evolve like this. It would require a product ticket, a sprint, a designer, a frontend developer. Here the entire feature — data model, state management, UI, migration — was specified and shipped in one conversation turn.
