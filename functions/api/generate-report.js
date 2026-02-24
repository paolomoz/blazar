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
  <link rel="stylesheet" href="/blazar-reports.css">
  <style>/* report-specific overrides only */</style>
</head>
<body>
  <nav class="report-nav">
    <a href="/hub.html" class="nav-hub">← Hub</a>
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
          <img src="/blazar-logo-36.svg" width="28" height="28" alt="" class="logo-mark">
          Blazar
        </div>
        <span class="report-date">{Date}</span>
      </div>
    </div>
  </header>

  <div class="container">
    <!-- Jump nav, sections, stat cards, tables, charts, etc. -->
  </div>

  <script src="/chat.js"></script>
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
- Use ABSOLUTE paths for all assets: /blazar-reports.css, /chat.js, /blazar-logo-36.svg
- Do NOT embed the CSS inline — always use the external stylesheet link
- Make the content detailed, data-rich, and visually structured
- Use stat cards for key metrics, bar charts for distributions, tables for detailed data
- Include a validation stamp at the bottom
- Today's date: ${new Date().toISOString().split('T')[0]}
- The report should be informative even without external data — use the information provided in the spec`;

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
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
      sendSSE('progress', { status: 'Calling Claude API...' });

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          stream: true,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        sendSSE('error', { message: `Claude API error: ${resp.status}`, detail: err });
        writer.close();
        return;
      }

      sendSSE('progress', { status: 'Generating HTML...' });

      let html = '';
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              html += parsed.delta.text;
              chunkCount++;
              // Send preview every 20 chunks
              if (chunkCount % 20 === 0) {
                sendSSE('chunk', { length: html.length });
              }
            }
          } catch {}
        }
      }

      if (!html.includes('<!DOCTYPE html>') && !html.includes('<html')) {
        sendSSE('error', { message: 'Generated content is not valid HTML' });
        writer.close();
        return;
      }

      sendSSE('progress', { status: 'Storing report...' });

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
