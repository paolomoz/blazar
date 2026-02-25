export async function onRequestGet(context) {
  const { params, env } = context;

  if (!env.REPORTS) {
    return new Response('Report storage not configured', { status: 500 });
  }

  // [[id]] catch-all gives an array of path segments — join them back
  const slug = (params.id || []).join('/');
  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const html = await env.REPORTS.get(slug);

  // KV hit → serve the completed report
  if (html) {
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'no-cache',
      },
    });
  }

  // KV miss → serve the live viewer shell (report is being generated)
  return new Response(liveViewerShell(slug), {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
}

function liveViewerShell(slug) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Generating report\u2026 \u2014 Blazar</title>
<link rel="preload" href="/blazar-reports.css" as="style">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8F8F8; }
  .live-bar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    display: flex; align-items: center; gap: 10px;
    padding: 10px 20px; background: #1A1A1A; color: #fff; font-size: 13px;
  }
  .live-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #3B63FB;
    animation: dot-pulse 1.5s ease-in-out infinite;
  }
  @keyframes dot-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }
  .live-status { flex: 1; }
  .live-kb { color: #888; font-variant-numeric: tabular-nums; }
  .live-complete {
    display: none; align-items: center; gap: 8px;
    color: #4ADE80; font-weight: 600;
  }
  .live-complete.show { display: flex; }
  .live-spinner {
    display: flex; align-items: center; justify-content: center;
    height: calc(100vh - 44px); margin-top: 44px;
    color: #999; font-size: 15px;
  }
  .live-spinner.hidden { display: none; }
  .live-frame {
    display: none; width: 100%; border: none;
    height: calc(100vh - 44px); margin-top: 44px;
  }
  .live-frame.active { display: block; }
</style>
</head>
<body>
<div class="live-bar">
  <div class="live-dot" id="live-dot"></div>
  <div class="live-status" id="live-status">Waiting for report stream\u2026</div>
  <div class="live-kb" id="live-kb"></div>
  <div class="live-complete" id="live-complete">\u2713 Report complete</div>
</div>
<div class="live-spinner" id="live-spinner">Connecting to report stream\u2026</div>
<iframe class="live-frame" id="live-frame"></iframe>
<script>
(function() {
  var slug = ${JSON.stringify(slug)};
  var bc;
  try { bc = new BroadcastChannel('blazar-report-' + slug); } catch(e) {}

  var frame = document.getElementById('live-frame');
  var spinner = document.getElementById('live-spinner');
  var statusEl = document.getElementById('live-status');
  var kbEl = document.getElementById('live-kb');
  var dotEl = document.getElementById('live-dot');
  var completeEl = document.getElementById('live-complete');
  var totalBytes = 0;
  var started = false;
  var done = false;
  var synced = false;
  var baseInjected = false;  // ensure <base> is injected once

  // Inject <base href="/reports/"> after the first <head> tag so relative
  // paths (blazar-reports.css, images) resolve correctly inside the iframe
  function injectBase(html) {
    if (baseInjected) return html;
    var headIdx = html.indexOf('<head>');
    if (headIdx === -1) headIdx = html.indexOf('<head ');
    if (headIdx !== -1) {
      var closeIdx = html.indexOf('>', headIdx);
      if (closeIdx !== -1) {
        baseInjected = true;
        return html.slice(0, closeIdx + 1) + '<meta charset="UTF-8"><base href="/reports/">' + html.slice(closeIdx + 1);
      }
    }
    return html;
  }

  function showFrame() {
    if (started) return;
    started = true;
    spinner.classList.add('hidden');
    frame.classList.add('active');
    frame.contentDocument.open();
  }

  function finish() {
    if (done) return;
    done = true;
    dotEl.style.background = '#4ADE80';
    dotEl.style.animation = 'none';
    statusEl.textContent = 'Reloading\u2026';
    completeEl.classList.add('show');
    if (started) {
      try { frame.contentDocument.close(); } catch(e) {}
    }
    setTimeout(function() { location.reload(); }, 2000);
  }

  if (bc) {
    bc.onmessage = function(e) {
      var msg = e.data;
      if (msg.type === 'full') {
        synced = true;
        showFrame();
        var html = injectBase(msg.html || '');
        totalBytes = html.length;
        kbEl.textContent = (totalBytes / 1024).toFixed(1) + ' KB';
        statusEl.textContent = 'Streaming report\u2026';
        try { frame.contentDocument.write(html); } catch(err) {}
      } else if (msg.type === 'chunk') {
        showFrame();
        var delta = injectBase(msg.delta || '');
        totalBytes += delta.length;
        kbEl.textContent = (totalBytes / 1024).toFixed(1) + ' KB';
        statusEl.textContent = 'Streaming report\u2026';
        try { frame.contentDocument.write(delta); } catch(err) {}
      } else if (msg.type === 'done') {
        finish();
        bc.close();
      } else if (msg.type === 'error') {
        statusEl.textContent = 'Generation failed';
        dotEl.style.background = '#EF4444';
        dotEl.style.animation = 'none';
        bc.close();
      }
    };

    // Request accumulated HTML from the generator tab
    bc.postMessage({ type: 'sync' });
  }

  // Timeout: if no messages after 10s, assume generation finished, try reload
  setTimeout(function() {
    if (!started && !done) {
      statusEl.textContent = 'Checking for completed report\u2026';
      location.reload();
    }
  }, 10000);
})();
</script>
<script src="/reports/chat.js"></script>
</body>
</html>`;
}
