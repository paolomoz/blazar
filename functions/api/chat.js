/**
 * Blazar Chat API — Cloudflare Pages Function
 *
 * Builds report knowledge dynamically from manifest.json (static reports)
 * + MANIFEST KV (generated reports). No hardcoded report list.
 */

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/* ── Build REPORTS_CONTEXT from manifest entries ── */
function buildReportsContext(entries) {
  let ctx = '## Reports Available\n';
  entries.forEach((r, i) => {
    const file = r.file || `${r.id}.html`;
    ctx += `\n### ${i + 1}. ${r.title} (${file})\n`;
    ctx += `${r.summary}\n`;
    if (r.sections && r.sections.length > 0) {
      ctx += 'Sections:\n';
      r.sections.forEach(s => {
        ctx += `- #${s.id} — ${s.label || s.title || s.description}\n`;
      });
    }
  });
  ctx += '\n### Hub (hub.html)\nCentral navigation hub with mind map and timeline views of all reports.';
  return ctx;
}

/* ── System prompts (context injected at runtime) ── */
function readPrompt(reportsContext) {
  return `You are Blazar, an AI assistant for the www.aem.live content management analysis dashboard. You help users understand report findings and navigate to specific sections.

IMPORTANT: When referencing report content, always include markdown links to the relevant report section using the format [text](report-file.html#section-id). These links work as same-site navigation.
${reportsContext}

## Response Guidelines
- Be concise and specific. Reference exact numbers from the reports.
- Always link to the relevant section when discussing specific findings.
- If asked about something not covered in the reports, say so clearly.
- Use markdown formatting for readability (bold key numbers, use lists).
- When suggesting next steps, link to the relevant action plan items.
- NEVER use markdown tables. Use bullet lists or bold labels instead. For comparisons, use a list like: **Label** — description.
- Put report links on their own line, not inside parentheses or sentences. Good: "See the full analysis:\\n[Content Gaps](aem-live-content-gaps.html#summary)". Bad: "(see [Content Gaps](aem-live-content-gaps.html#summary))".
- CRITICAL: ONLY link to report files and section IDs that are explicitly listed above in "Reports Available". NEVER invent or guess report filenames, section anchors, or hub.html#anchors. If the user asks about a topic spread across multiple reports, reference each relevant report individually — do not fabricate a combined page that does not exist.`;
}

function writePrompt(reportsContext) {
  return `You are Blazar in **Write mode** — an AI assistant for the www.aem.live content management analysis dashboard. You can both answer questions from existing reports AND propose and generate new analysis reports.

IMPORTANT: When referencing report content, always include markdown links to the relevant report section using the format [text](report-file.html#section-id). These links work as same-site navigation.
${reportsContext}

## Write Mode Behavior

When a user asks a question:

1. **If the existing reports already cover the topic comprehensively**, answer from the data — just like read mode. Don't generate a new report for something already analyzed.

2. **If the user's question reveals a gap** — something the existing reports don't cover, or a new angle that would benefit from dedicated analysis — propose a new report. Outline:
   - **Report title** — what it would be called
   - **Key questions** it would answer
   - **Data sources** it would analyze
   - **Estimated scope** (how many pages/items it would cover)
   - Ask the user to confirm before generating it.

3. **If the user explicitly asks to generate/create/build a report**, propose the report structure and ask for confirmation.

4. **When the user confirms** (says yes, go ahead, generate it, do it, etc.), output a report specification block. This block triggers the actual HTML report generation pipeline. Output it EXACTLY in this format:

:::REPORT_SPEC
{
  "id": "kebab-case-report-id",
  "title": "Full Report Title",
  "subtitle": "Brief description of the report",
  "category": "audit|optimization|brand|content|performance",
  "summary": "One-paragraph summary for the hub mind map card",
  "related": ["existing-report-id-1", "existing-report-id-2"],
  "sections": [
    { "id": "section-id", "title": "Section Title", "description": "What this section covers" }
  ],
  "data_sources": ["Description of data source 1", "Description of data source 2"],
  "instructions": "Any additional context or specific requirements for the report content"
}
:::

After the spec block, add a brief message like "Generating your report now..." The system will handle the rest.

**IMPORTANT rules for the spec block:**
- The id must be unique kebab-case (e.g., "accessibility-audit-aem-live")
- Category must be one of: audit, optimization, brand, content, performance
- Related should reference existing report IDs from the manifest
- Sections should have 4-8 entries covering the key areas
- Instructions should include all the context from the conversation that would help generate a detailed report
- Only output the spec block when the user has CONFIRMED they want the report generated

## Response Guidelines
- Be concise and specific. Reference exact numbers from the reports.
- Always link to the relevant section when discussing specific findings.
- Use markdown formatting for readability (bold key numbers, use lists).
- When suggesting next steps, link to the relevant action plan items.
- NEVER use markdown tables. Use bullet lists or bold labels instead.
- Put report links on their own line, not inside parentheses or sentences.
- When proposing a new report, be specific and actionable — not vague.
- CRITICAL: ONLY link to report files and section IDs that are explicitly listed above in "Reports Available". NEVER invent or guess report filenames, section anchors, or hub.html#anchors. If the user asks about a topic spread across multiple reports, reference each relevant report individually — do not fabricate a combined page that does not exist.`;
}

/* ── Load manifest: static file + KV generated reports ── */
async function loadManifest(env, requestUrl) {
  let staticEntries = [];
  let kvEntries = [];

  // 1. Static manifest from manifest.json (served as a static asset)
  try {
    const url = new URL('/manifest.json', requestUrl);
    const resp = await env.ASSETS.fetch(new Request(url));
    if (resp.ok) {
      staticEntries = await resp.json();
    }
  } catch {
    // ASSETS binding may not exist in local dev — fall through
  }

  // 2. Generated reports from MANIFEST KV
  if (env.MANIFEST) {
    try {
      kvEntries = (await env.MANIFEST.get('entries', 'json')) || [];
    } catch {
      // KV not available
    }
  }

  // Merge: KV entries override static entries with same id, append new ones
  const merged = new Map(staticEntries.map(e => [e.id, e]));
  for (const entry of kvEntries) {
    merged.set(entry.id, { ...merged.get(entry.id), ...entry });
  }

  return [...merged.values()];
}

/* ── Parse AWS EventStream binary format from Bedrock ── */
async function* parseBedrockStream(reader) {
  let buf = new Uint8Array(0);
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const next = new Uint8Array(buf.length + value.length);
    next.set(buf);
    next.set(value, buf.length);
    buf = next;
    while (buf.length >= 12) {
      const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
      const totalLen = view.getUint32(0);
      if (buf.length < totalLen) break;
      const headersLen = view.getUint32(4);
      const headers = {};
      let pos = 12;
      const headersEnd = 12 + headersLen;
      while (pos < headersEnd) {
        const nameLen = buf[pos]; pos += 1;
        const name = new TextDecoder().decode(buf.slice(pos, pos + nameLen)); pos += nameLen;
        const valueType = buf[pos]; pos += 1;
        if (valueType === 7) {
          const vLen = new DataView(buf.buffer, buf.byteOffset + pos, 2).getUint16(0); pos += 2;
          headers[name] = new TextDecoder().decode(buf.slice(pos, pos + vLen)); pos += vLen;
        } else { break; }
      }
      const payloadLen = totalLen - 12 - headersLen - 4;
      const payload = buf.slice(12 + headersLen, 12 + headersLen + payloadLen);
      buf = buf.slice(totalLen);
      if (headers[':message-type'] === 'event' && headers[':event-type'] === 'chunk') {
        try {
          const wrapper = JSON.parse(new TextDecoder().decode(payload));
          if (wrapper.bytes) yield JSON.parse(atob(wrapper.bytes));
        } catch {}
      } else if (headers[':message-type'] === 'exception') {
        try {
          const err = JSON.parse(new TextDecoder().decode(payload));
          throw new Error(err.message || 'Bedrock stream exception');
        } catch (e) {
          if (e instanceof Error && e.message !== 'Bedrock stream exception') throw e;
          throw new Error('Bedrock stream exception');
        }
      }
    }
  }
}

/* ── Cerebras path — proxy OpenAI-compatible SSE ── */
async function handleCerebras(env, messages) {
  const apiKey = env.CEREBRAS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'CEREBRAS_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const resp = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-oss-120b',
      messages,
      stream: true,
      max_tokens: 1024,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return new Response(JSON.stringify({ error: `Cerebras API error: ${resp.status}`, detail: err }), {
      status: resp.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  return new Response(resp.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders(),
    },
  });
}

/* ── Bedrock path — convert binary EventStream to OpenAI SSE ── */
async function handleBedrock(context, systemPrompt, userMessages) {
  const { env } = context;
  const apiKey = env.ANTHROPIC_AWS_BEARER_TOKEN_BEDROCK;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_AWS_BEARER_TOKEN_BEDROCK not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const region = env.AWS_REGION || 'us-east-1';
  const modelId = env.ANTHROPIC_MODEL || 'global.anthropic.claude-opus-4-6-v1';
  const bedrockUrl = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/invoke-with-response-stream`;

  const resp = await fetch(bedrockUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      system: systemPrompt,
      messages: userMessages,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    return new Response(JSON.stringify({ error: `Bedrock API error: ${resp.status}`, detail: err }), {
      status: resp.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  // Convert Bedrock binary EventStream → OpenAI-format SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  context.waitUntil((async () => {
    try {
      const reader = resp.body.getReader();
      for await (const event of parseBedrockStream(reader)) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          const chunk = JSON.stringify({ choices: [{ delta: { content: event.delta.text } }] });
          await writer.write(encoder.encode(`data: ${chunk}\n\n`));
        }
      }
      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } catch (err) {
      const errChunk = JSON.stringify({ choices: [{ delta: { content: `\n\n[Error: ${err.message}]` } }] });
      await writer.write(encoder.encode(`data: ${errChunk}\n\n`));
      await writer.write(encoder.encode('data: [DONE]\n\n'));
    } finally {
      await writer.close();
    }
  })());

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders(),
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  // Build report context dynamically from manifest
  const manifest = await loadManifest(env, request.url);
  const reportsContext = buildReportsContext(manifest);
  const systemPrompt = body.mode === 'write'
    ? writePrompt(reportsContext)
    : readPrompt(reportsContext);

  const requestedModel = body.model || 'opus-4.6';
  const userMessages = (body.messages || []).filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content }));

  if (requestedModel === 'opus-4.6') {
    return handleBedrock(context, systemPrompt, userMessages);
  }

  // Default: Cerebras path (OpenAI-compatible, system message in messages array)
  const messages = [
    { role: 'system', content: systemPrompt },
    ...userMessages,
  ];
  return handleCerebras(env, messages);
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
