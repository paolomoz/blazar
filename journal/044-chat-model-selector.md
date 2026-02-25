# 044 — Chat Model Selector

**Date:** 2026-02-25
**Status:** Complete

## What happened

Added a model picker to the chat widget so users can switch between GPT-OSS 120B (Cerebras) and Opus 4.6 (AWS Bedrock). The selector sits in the input bar as a pill button that cycles between the two models on click.

### Prompts (verbatim)

1. User provided a detailed implementation plan covering frontend state, CSS, HTML layout, click handler, API body changes, and backend model routing with Bedrock binary EventStream → OpenAI SSE conversion.

### Changes made

**Frontend (`reports/chat.js`):**
- Added `MODELS` constant (array of `{key, label}`) and `selectedModel` state persisted to `localStorage('blazar-chat-model')`, defaulting to `gpt-oss-120b`
- New `.blazar-chat-model-select` CSS: pill button styled like write-toggle (12px font, `#999` text, 1px `#E0E0E0` border, 20px border-radius)
- Restructured input-actions layout: `[write-toggle] ... [model-select ▾] [send-btn]` with a `.blazar-chat-input-right` flex wrapper grouping model selector + send button
- Click handler cycles to next model (modulo array length), updates button label + chevron SVG, saves to localStorage
- Added `model: selectedModel` to the `fetch()` body alongside existing `messages` and `mode`

**Backend (`functions/api/chat.js`):**
- Extracted existing Cerebras logic into `handleCerebras(env, messages)` function
- Added `parseBedrockStream()` async generator (copied from `generate-report.js`) — parses AWS EventStream binary format (4-byte length headers, base64 JSON payloads)
- Added `handleBedrock(context, systemPrompt, userMessages)`:
  - Auth via `env.ANTHROPIC_AWS_BEARER_TOKEN_BEDROCK`
  - Calls `bedrock-runtime.{region}.amazonaws.com/model/{modelId}/invoke-with-response-stream`
  - Uses `TransformStream` + `context.waitUntil()` to convert Bedrock events to OpenAI-format SSE (`content_block_delta` → `data: {"choices":[{"delta":{"content":"..."}}]}\n\n`)
  - Error handling inlines error message as final content delta before `[DONE]`
- `onRequestPost` routes on `body.model`: `'opus-4.6'` → Bedrock, default → Cerebras
- Bedrock uses Anthropic message format (`system` as top-level field, no system message in array) while Cerebras gets OpenAI format (system message in messages array)

## Observations

- The two-model architecture creates an interesting split: Cerebras for fast, lightweight chat (exploring reports, quick questions) and Opus for deeper reasoning (proposing new analyses, write-mode report generation). The selector lets users choose based on their task.
- `parseBedrockStream` is now duplicated between `chat.js` and `generate-report.js`. If a third function needs it, worth extracting to a shared module.
- The click-to-cycle UX (no dropdown menu) works cleanly with only 2 models. Would need a proper dropdown if more models are added.

## Thesis connection

The model selector is a small but meaningful step: Blazar as an experience management platform needs to support multiple AI backends, not be locked to one provider. Different models have different strengths — fast inference for navigation, deep reasoning for analysis. Giving users the choice directly in the chat input bar (not buried in settings) makes the AI capability itself a first-class UX element.
