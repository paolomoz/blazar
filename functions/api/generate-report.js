function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

const SYSTEM_PROMPT = `You are Blazar's report generator. You produce complete, self-contained HTML report pages that follow the Blazar design system.

## Output Format
Return ONLY the full HTML document (<!DOCTYPE html> through </html>). No markdown, no code fences, no explanation.

## HTML Structure
Every report must follow this exact structure:

\`\`\`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Report Title} — Blazar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700;900&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/reports/blazar-reports.css">
  <style>/* report-specific overrides only */</style>
</head>
<body>
  <nav class="report-nav">
    <a href="/reports/hub.html" class="nav-hub">← Hub</a>
    <span class="nav-sep">|</span>
    <!-- related report links as .nav-related pills -->
  </nav>

  <header class="report-header">
    <div class="report-header-inner">
      <div>
        <h1>{Title}</h1>
        <div class="subtitle">{Subtitle}</div>
      </div>
      <div style="display:flex;align-items:center;gap:16px;">
        <div class="report-branding">
          <img src="/reports/blazar-logo-36.svg" width="28" height="28" alt="" class="logo-mark">
          Blazar
        </div>
        <span class="report-date">{Date}</span>
      </div>
    </div>
  </header>

  <div class="container">
    <!-- Jump nav, sections, stat cards, tables, charts, etc. -->
  </div>

  <script src="/reports/chat.js"></script>
</body>
</html>
\`\`\`

## Available CSS Classes (from blazar-reports.css)
Use these classes to build the report content:

**Layout:** .container, .two-col, .three-col
**Sections:** .section, .section-title, .section-desc
**Stats:** .summary-grid, .stat-card (.accent/.positive/.warning/.critical/.info), .stat-value, .stat-label
**Cards:** .card, .card h3, .card p, .card ul/li
**Tables:** .table-wrap, .data-table, .data-table th/td
**Bars:** .bar-chart, .bar-row, .bar-label, .bar-track, .bar-fill (.green/.blue/.amber/.red/.purple/.cyan), .bar-count
**Badges:** .badge, .badge-pass/.badge-warn/.badge-fail/.badge-info/.badge-neutral
**Grades:** .grade-grid, .grade-card, .grade-letter (.a/.b/.c/.d/.f), .grade-aspect, .grade-detail
**Quotes:** .quote-block (.pass/.warn/.fail), .quote-text, .quote-source
**Navigation:** .jump-nav, .jump-nav-title, .jump-nav-links
**Validation:** .validation-stamp

## Rules
- Use ABSOLUTE paths for all assets: /reports/blazar-reports.css, /reports/chat.js, /reports/blazar-logo-36.svg
- Do NOT embed the CSS inline — always use the external stylesheet link
- Make the content detailed, data-rich, and visually structured
- Use stat cards for key metrics, bar charts for distributions, tables for detailed data
- Include a validation stamp at the bottom
- Today's date: ${new Date().toISOString().split('T')[0]}
- The report should be informative even without external data — use the information provided in the spec`;

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.ANTHROPIC_AWS_BEARER_TOKEN_BEDROCK;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_AWS_BEARER_TOKEN_BEDROCK not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const spec = body.spec;
  if (!spec || !spec.id || !spec.title) {
    return new Response(JSON.stringify({ error: 'Missing spec with id and title' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  // Build the user message from the spec
  const userPrompt = buildUserPrompt(spec);

  // Set up SSE stream back to client
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const sendSSE = (event, data) => {
    writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  };

  // Run generation in the background
  context.waitUntil((async () => {
    try {
      sendSSE('progress', { status: 'Analyzing report structure...', percent: 5 });

      const region = env.AWS_REGION || 'us-east-1';
      const modelId = env.REPORT_MODEL || 'us.anthropic.claude-sonnet-4-20250514-v1:0';
      const bedrockUrl = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/invoke-with-response-stream`;

      sendSSE('progress', { status: 'Writing report content...', percent: 10 });

      const resp = await fetch(bedrockUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 16000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        sendSSE('error', { message: `Report generation failed (${resp.status})`, detail: err });
        writer.close();
        return;
      }

      // Parse AWS EventStream binary format from Bedrock streaming response
      const reader = resp.body.getReader();
      let html = '';
      const EXPECTED_LENGTH = 18000;

      for await (const event of parseBedrockStream(reader)) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          const delta = event.delta.text;
          html += delta;
          const percent = Math.min(90, Math.round(10 + (html.length / EXPECTED_LENGTH) * 80));
          sendSSE('chunk', { delta, percent, totalLength: html.length });
        }
      }

      // Validate
      sendSSE('progress', { status: 'Validating report...', percent: 92 });

      if (!html.includes('<!DOCTYPE html>') && !html.includes('<html')) {
        sendSSE('error', { message: 'Generated content is not valid HTML' });
        writer.close();
        return;
      }

      sendSSE('progress', { status: 'Publishing to report hub...', percent: 95 });

      // Store HTML in KV
      if (env.REPORTS) {
        await env.REPORTS.put(spec.id, html);
      }

      // Update manifest
      const manifestEntry = {
        id: spec.id,
        file: `/r/${spec.id}`,
        title: spec.title,
        subtitle: spec.subtitle || '',
        date: new Date().toISOString().split('T')[0],
        category: spec.category || 'audit',
        summary: spec.summary || '',
        related: spec.related || [],
        sections: (spec.sections || []).map(s => ({
          id: s.id,
          label: s.description || s.title || s.id,
        })),
        generated: true,
      };

      if (env.MANIFEST) {
        const existing = (await env.MANIFEST.get('entries', 'json')) || [];
        // Upsert: replace if id exists, otherwise append
        const idx = existing.findIndex(e => e.id === spec.id);
        if (idx >= 0) {
          existing[idx] = manifestEntry;
        } else {
          existing.push(manifestEntry);
        }
        await env.MANIFEST.put('entries', JSON.stringify(existing));
      }

      sendSSE('done', {
        reportUrl: `/r/${spec.id}`,
        manifest: manifestEntry,
      });
    } catch (err) {
      sendSSE('error', { message: err.message || 'Generation failed' });
    } finally {
      writer.close();
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

/**
 * Parse AWS EventStream binary format from Bedrock invoke-with-response-stream.
 * Each message: [total_len:4][headers_len:4][prelude_crc:4][headers:N][payload:M][msg_crc:4]
 * Payload for chunk events contains base64-encoded JSON with Anthropic streaming events.
 */
async function* parseBedrockStream(reader) {
  let buf = new Uint8Array(0);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // Append new data to buffer
    const next = new Uint8Array(buf.length + value.length);
    next.set(buf);
    next.set(value, buf.length);
    buf = next;

    // Extract complete messages
    while (buf.length >= 12) {
      const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
      const totalLen = view.getUint32(0);
      if (buf.length < totalLen) break; // need more data

      const headersLen = view.getUint32(4);
      // prelude CRC at bytes 8-11 (skip)

      // Parse headers to find :event-type and :message-type
      const headers = {};
      let pos = 12;
      const headersEnd = 12 + headersLen;
      while (pos < headersEnd) {
        const nameLen = buf[pos]; pos += 1;
        const name = new TextDecoder().decode(buf.slice(pos, pos + nameLen)); pos += nameLen;
        const valueType = buf[pos]; pos += 1;
        if (valueType === 7) { // string
          const vLen = new DataView(buf.buffer, buf.byteOffset + pos, 2).getUint16(0); pos += 2;
          headers[name] = new TextDecoder().decode(buf.slice(pos, pos + vLen)); pos += vLen;
        } else {
          break; // unknown type — skip rest of headers
        }
      }

      // Extract payload
      const payloadLen = totalLen - 12 - headersLen - 4;
      const payload = buf.slice(12 + headersLen, 12 + headersLen + payloadLen);

      // Advance buffer
      buf = buf.slice(totalLen);

      // Decode chunk events
      if (headers[':message-type'] === 'event' && headers[':event-type'] === 'chunk') {
        try {
          const wrapper = JSON.parse(new TextDecoder().decode(payload));
          if (wrapper.bytes) {
            yield JSON.parse(atob(wrapper.bytes));
          }
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

function buildUserPrompt(spec) {
  let prompt = `Generate a complete HTML report with the following specification:\n\n`;
  prompt += `**Title:** ${spec.title}\n`;
  if (spec.subtitle) prompt += `**Subtitle:** ${spec.subtitle}\n`;
  prompt += `**Report ID:** ${spec.id}\n`;
  prompt += `**Category:** ${spec.category || 'audit'}\n`;
  if (spec.summary) prompt += `**Summary:** ${spec.summary}\n`;

  if (spec.related && spec.related.length > 0) {
    prompt += `\n**Related Reports (add as nav-related pills in the report-nav bar):**\n`;
    spec.related.forEach(r => { prompt += `- ${r}\n`; });
  }

  if (spec.sections && spec.sections.length > 0) {
    prompt += `\n**Sections to include:**\n`;
    spec.sections.forEach(s => {
      prompt += `- **${s.title || s.id}**: ${s.description || ''}\n`;
    });
  }

  if (spec.data_sources && spec.data_sources.length > 0) {
    prompt += `\n**Data sources to reference:**\n`;
    spec.data_sources.forEach(d => { prompt += `- ${d}\n`; });
  }

  if (spec.instructions) {
    prompt += `\n**Additional instructions:**\n${spec.instructions}\n`;
  }

  return prompt;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}
