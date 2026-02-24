/* Blazar Chat Widget — Manus-inspired conversational sidebar */
(function () {
  'use strict';

  const STORE_KEY = 'blazar-chat-store';
  const OLD_STORAGE_KEY = 'blazar-chat-history';
  const WIDTH_KEY = 'blazar-chat-width';
  const MAX_MESSAGES = 50;
  const MAX_CHATS = 100;
  const API_URL = '/api/chat';
  const DEFAULT_WIDTH = 420;
  const MIN_WIDTH = 320;
  const MAX_WIDTH = 800;

  /* ── State ── */
  let store = { chats: [], openTabs: [], activeTab: null };
  let isOpen = true;
  let isStreaming = false;
  let abortController = null;
  let discoveryPrompts = null;
  let historyOpen = false;

  /* ── Styles ── */
  const css = `
    :root { --blazar-w: ${DEFAULT_WIDTH}px; }
    html.blazar-chat-active body {
      margin-right: var(--blazar-w) !important;
      transition: margin-right 0.25s ease;
    }
    html body { transition: margin-right 0.25s ease; }

    .blazar-chat-panel {
      position: fixed;
      top: 0; right: 0;
      width: var(--blazar-w);
      height: 100vh;
      background: #FFFFFF;
      border-left: 1px solid #EBEBEB;
      z-index: 10001;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      font-size: 15px;
      color: #1A1A1A;
      line-height: 1.6;
      transform: translateX(0);
      transition: transform 0.25s ease;
    }
    .blazar-chat-panel.blazar-chat-collapsed { transform: translateX(100%); }

    /* Toggle tab */
    .blazar-chat-toggle {
      position: fixed;
      top: 50%; right: var(--blazar-w);
      transform: translateY(-50%);
      width: 20px; height: 56px;
      background: #FAFAFA;
      border: 1px solid #EBEBEB;
      border-right: none;
      border-radius: 6px 0 0 6px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      z-index: 10002;
      transition: right 0.25s ease;
      padding: 0;
      color: #999;
    }
    .blazar-chat-toggle:hover { background: #F0F0F0; color: #666; }
    .blazar-chat-toggle svg { width: 12px; height: 12px; transition: transform 0.25s ease; }
    .blazar-chat-toggle.blazar-chat-toggle-collapsed { right: 0; }
    .blazar-chat-toggle.blazar-chat-toggle-collapsed svg { transform: rotate(180deg); }

    /* Header — minimal like Manus */
    .blazar-chat-header {
      padding: 16px 20px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid #EBEBEB;
      flex-shrink: 0;
    }
    .blazar-chat-header-title {
      font-size: 16px; font-weight: 700; color: #1A1A1A;
    }
    .blazar-chat-new {
      font-size: 13px; color: #999; background: none; border: none;
      cursor: pointer; font-family: inherit; padding: 4px 8px; border-radius: 6px;
      transition: all 0.15s;
    }
    .blazar-chat-new:hover { color: #1A1A1A; background: #F5F5F5; }

    /* Messages area */
    .blazar-chat-messages {
      flex: 1; overflow-y: auto;
      padding: 0;
      display: flex; flex-direction: column;
    }

    /* User message — subtle card like Manus */
    .blazar-chat-msg-user {
      margin: 20px 20px 0;
      padding: 14px 16px;
      background: #F7F7F8;
      border-radius: 12px;
      font-size: 15px; line-height: 1.6;
      color: #1A1A1A;
    }

    /* Assistant message — flowing document */
    .blazar-chat-msg-assistant-wrap {
      padding: 20px 20px 0;
    }
    .blazar-chat-msg-label {
      display: flex; align-items: center; gap: 6px;
      margin-bottom: 10px;
      font-size: 14px; font-weight: 700; color: #1A1A1A;
    }
    .blazar-chat-msg-label svg { width: 16px; height: 16px; }
    .blazar-chat-msg-body {
      font-size: 15px; line-height: 1.65; color: #333;
      word-wrap: break-word; overflow-wrap: break-word;
    }
    .blazar-chat-msg-body a { color: #1A1A1A; text-decoration: underline; text-decoration-color: #CCC; text-underline-offset: 2px; }
    .blazar-chat-msg-body a:hover { text-decoration-color: #1A1A1A; }
    .blazar-chat-msg-body p { margin: 0 0 12px; }
    .blazar-chat-msg-body p:last-child { margin-bottom: 0; }
    .blazar-chat-msg-body strong { font-weight: 700; color: #1A1A1A; }
    .blazar-chat-msg-body em { font-style: italic; }
    .blazar-chat-msg-body code {
      background: #F3F3F3; padding: 2px 6px; border-radius: 4px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; font-size: 13px;
    }
    .blazar-chat-msg-body pre {
      background: #F7F7F8; padding: 12px 14px; border-radius: 8px;
      overflow-x: auto; margin: 10px 0; font-size: 13px; line-height: 1.5;
      border: 1px solid #EBEBEB;
    }
    .blazar-chat-msg-body pre code { background: none; padding: 0; }
    .blazar-chat-msg-body ul, .blazar-chat-msg-body ol {
      margin: 6px 0 12px; padding-left: 20px;
    }
    .blazar-chat-msg-body li { margin-bottom: 6px; line-height: 1.55; }
    .blazar-chat-msg-body li::marker { color: #BBB; }
    .blazar-chat-msg-body h3 {
      font-size: 14px; font-weight: 700; color: #1A1A1A;
      margin: 16px 0 8px;
    }
    .blazar-chat-msg-body h3:first-child { margin-top: 0; }
    .blazar-chat-msg-body h4 { font-size: 15px; font-weight: 700; color: #1A1A1A; margin: 12px 0 6px; }
    .blazar-chat-msg-body h4:first-child { margin-top: 0; }
    .blazar-chat-msg-body hr { border: none; border-top: 1px solid #EBEBEB; margin: 16px 0; }

    /* Report link cards — Manus-style */
    .blazar-chat-card {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; margin: 6px 0;
      background: #FFFFFF;
      border: 1px solid #EBEBEB; border-radius: 8px;
      text-decoration: none !important; color: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .blazar-chat-card:hover {
      border-color: #D0D0D0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .blazar-chat-card-icon {
      width: 28px; height: 28px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-size: 14px;
      background: #F7F7F8;
    }
    .blazar-chat-card-body { flex: 1; min-width: 0; }
    .blazar-chat-card-title {
      font-size: 13px; font-weight: 600; color: #1A1A1A; line-height: 1.3;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .blazar-chat-card-section { font-size: 11px; color: #999; margin-top: 1px; }
    .blazar-chat-card-action {
      font-size: 12px; font-weight: 500; color: #1A1A1A;
      padding: 3px 10px; border: 1px solid #EBEBEB; border-radius: 5px;
      flex-shrink: 0; background: #FFFFFF;
      transition: background 0.15s;
    }
    .blazar-chat-card:hover .blazar-chat-card-action { background: #F7F7F8; }

    /* Inline report links */
    .blazar-chat-inline-link {
      color: #1A1A1A; font-weight: 600;
      text-decoration: underline; text-decoration-color: #CCCCCC;
      text-underline-offset: 2px;
      transition: text-decoration-color 0.15s;
    }
    .blazar-chat-inline-link:hover { text-decoration-color: #1A1A1A; }

    /* Tables */
    .blazar-chat-table {
      width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13px;
    }
    .blazar-chat-table th, .blazar-chat-table td {
      padding: 6px 10px; text-align: left; border-bottom: 1px solid #EBEBEB;
    }
    .blazar-chat-table th { font-weight: 600; color: #1A1A1A; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; }
    .blazar-chat-table td { color: #444; }
    .blazar-chat-table tr:last-child td { border-bottom: none; }

    /* Drag handle */
    .blazar-chat-drag {
      position: absolute;
      top: 0; left: -3px;
      width: 6px; height: 100%;
      cursor: col-resize;
      z-index: 10003;
    }
    .blazar-chat-drag:hover, .blazar-chat-drag.active { background: #D0D0D0; }
    html.blazar-chat-dragging * { cursor: col-resize !important; user-select: none !important; }
    html.blazar-chat-dragging .blazar-chat-panel,
    html.blazar-chat-dragging .blazar-chat-toggle,
    html.blazar-chat-dragging body { transition: none !important; }

    /* Error */
    .blazar-chat-msg-error {
      margin: 16px 20px 0;
      padding: 12px 14px;
      background: #FFF5F5; border: 1px solid #FFE0E0; border-radius: 10px;
      color: #CC3333; font-size: 13px;
    }

    /* Typing indicator */
    .blazar-chat-typing-wrap { padding: 20px 20px 0; }
    .blazar-chat-typing {
      display: inline-flex; gap: 5px; padding: 8px 0;
    }
    .blazar-chat-typing span {
      width: 5px; height: 5px; border-radius: 50%;
      background: #CCC; animation: blazar-chat-bounce 1.2s infinite;
    }
    .blazar-chat-typing span:nth-child(2) { animation-delay: 0.2s; }
    .blazar-chat-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blazar-chat-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }

    /* Discovery prompts — Manus suggested follow-ups style */
    .blazar-chat-discovery {
      padding: 20px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .blazar-chat-discovery-cat {
      font-size: 13px; font-weight: 600; color: #999; margin-bottom: 2px;
    }
    .blazar-chat-discovery-group {
      display: flex; flex-direction: column; gap: 0;
    }
    .blazar-chat-prompt-btn {
      display: flex; align-items: center; gap: 10px;
      width: 100%; background: none; border: none;
      padding: 12px 4px;
      border-bottom: 1px solid #F3F3F3;
      font-family: inherit; font-size: 14px; color: #1A1A1A;
      cursor: pointer; text-align: left; line-height: 1.45;
      transition: background 0.15s;
    }
    .blazar-chat-prompt-btn:last-child { border-bottom: none; }
    .blazar-chat-prompt-btn:hover { background: #FAFAFA; }
    .blazar-chat-prompt-btn::before {
      content: '';
      width: 20px; height: 20px; flex-shrink: 0;
      background: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%23BBB' stroke-width='1.5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat;
    }
    .blazar-chat-prompt-btn::after {
      content: '\u203A'; margin-left: auto; color: #CCC; font-size: 18px; flex-shrink: 0;
    }

    /* Input area — Manus style */
    .blazar-chat-input-area {
      padding: 16px 20px 20px;
      flex-shrink: 0;
    }
    .blazar-chat-input-wrap {
      border: 1px solid #EBEBEB; border-radius: 12px;
      background: #FFFFFF;
      display: flex; flex-direction: column;
      transition: border-color 0.15s;
    }
    .blazar-chat-input-wrap:focus-within { border-color: #CCC; }
    .blazar-chat-textarea {
      flex: 1; border: none; outline: none;
      padding: 12px 14px 4px; font-family: inherit; font-size: 15px;
      line-height: 1.5; resize: none; min-height: 24px; max-height: 120px;
      color: #1A1A1A; background: transparent;
    }
    .blazar-chat-textarea::placeholder { color: #BBB; }
    .blazar-chat-input-actions {
      display: flex; align-items: center; justify-content: flex-end;
      padding: 4px 8px 8px;
    }
    .blazar-chat-send {
      width: 32px; height: 32px; border-radius: 50%;
      background: #1A1A1A; color: white; border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.15s;
    }
    .blazar-chat-send:disabled { opacity: 0.15; cursor: default; }
    .blazar-chat-send:not(:disabled):hover { opacity: 0.8; }
    .blazar-chat-send svg { width: 16px; height: 16px; }
    .blazar-chat-send.blazar-chat-stop { background: #1A1A1A; }

    /* Bottom spacer for scroll */
    .blazar-chat-spacer { height: 20px; flex-shrink: 0; }

    /* Tab bar */
    .blazar-chat-tabs {
      display: flex; align-items: center;
      overflow-x: auto; overflow-y: hidden;
      border-bottom: 1px solid #EBEBEB;
      background: #F7F7F8;
      flex-shrink: 0;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .blazar-chat-tabs::-webkit-scrollbar { display: none; }
    .blazar-chat-tabs.blazar-chat-tabs-hidden { display: none; }
    .blazar-chat-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 12px;
      font-family: inherit; font-size: 13px;
      color: #999; background: transparent;
      border: none; border-bottom: 2px solid transparent;
      cursor: pointer; white-space: nowrap;
      max-width: 180px; flex-shrink: 0;
      transition: color 0.15s, background 0.15s;
    }
    .blazar-chat-tab:hover { color: #666; background: #F0F0F0; }
    .blazar-chat-tab.active {
      color: #1A1A1A; font-weight: 600;
      background: #FFFFFF;
      border-bottom-color: #1A1A1A;
    }
    .blazar-chat-tab-title {
      overflow: hidden; text-overflow: ellipsis;
    }
    .blazar-chat-tab-close {
      display: inline-flex; align-items: center; justify-content: center;
      width: 16px; height: 16px; border-radius: 50%;
      font-size: 11px; line-height: 1;
      color: #CCC; background: none; border: none;
      cursor: pointer; flex-shrink: 0;
      transition: color 0.15s, background 0.15s;
    }
    .blazar-chat-tab-close:hover { color: #666; background: #E8E8E8; }

    /* History dropdown */
    .blazar-chat-history-wrap { position: relative; }
    .blazar-chat-history-dropdown {
      position: absolute; top: calc(100% + 6px); right: 0;
      width: 280px; max-height: 340px; overflow-y: auto;
      background: #FFFFFF;
      border: 1px solid #EBEBEB; border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      z-index: 10010;
      display: none;
    }
    .blazar-chat-history-dropdown.open { display: block; }
    .blazar-chat-history-dropdown-header {
      padding: 12px 14px 8px;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: #999;
      border-bottom: 1px solid #F3F3F3;
    }
    .blazar-chat-history-item {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 10px 14px;
      background: none; border: none; border-bottom: 1px solid #F7F7F8;
      cursor: pointer; font-family: inherit; text-align: left;
      transition: background 0.12s;
    }
    .blazar-chat-history-item:last-child { border-bottom: none; }
    .blazar-chat-history-item:hover { background: #F7F7F8; }
    .blazar-chat-history-item-body { flex: 1; min-width: 0; }
    .blazar-chat-history-item-title {
      font-size: 13px; font-weight: 600; color: #1A1A1A;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .blazar-chat-history-item-time { font-size: 11px; color: #999; margin-top: 1px; }
    .blazar-chat-history-item-del {
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; border-radius: 50%;
      font-size: 12px; color: #CCC; background: none; border: none;
      cursor: pointer; flex-shrink: 0;
      transition: color 0.15s, background 0.15s;
    }
    .blazar-chat-history-item-del:hover { color: #CC3333; background: #FFF0F0; }
    .blazar-chat-history-empty {
      padding: 20px 14px; text-align: center;
      font-size: 13px; color: #999;
    }

    /* Responsive */
    @media (max-width: 768px) {
      html.blazar-chat-active body { margin-right: 0 !important; }
      .blazar-chat-panel { width: 100vw; }
      .blazar-chat-toggle { right: 0 !important; }
    }
    @media (prefers-reduced-motion: reduce) {
      .blazar-chat-panel, .blazar-chat-toggle, .blazar-chat-toggle svg,
      html.blazar-chat-active body, html body { transition: none; }
      .blazar-chat-typing span { animation: none; }
    }
  `;

  /* ── Report metadata for link cards ── */
  const REPORT_META = {
    'aem-live-content-gaps.html':       { title: 'Content Gaps Analysis',       cat: 'audit',        icon: '\u{1F50D}' },
    'aem-live-action-plan.html':        { title: 'Action Plan',                 cat: 'optimization', icon: '\u{1F3AF}' },
    'aem-live-brand-guidelines.html':   { title: 'Brand Guidelines',            cat: 'brand',        icon: '\u{1F3A8}' },
    'aem-live-brand-opportunities.html':{ title: 'Improvement Opportunities',   cat: 'brand',        icon: '\u{1F4A1}' },
    'aem-live-link-equity.html':        { title: 'Internal Link Equity',        cat: 'audit',        icon: '\u{1F517}' },
    'aem-live-image-quality.html':      { title: 'Image Quality',               cat: 'brand',        icon: '\u{1F5BC}' },
    'aem-live-competitor-positioning.html': { title: 'Competitor Positioning',   cat: 'brand',        icon: '\u{1F4CA}' },
    'aem-live-brand-consistency.html':  { title: 'Brand Consistency',           cat: 'brand',        icon: '\u{2705}' },
    'aem-live-seo-signals.html':        { title: 'SEO Brand Signals',           cat: 'performance',  icon: '\u{1F50E}' },
    'aem-live-readability.html':        { title: 'Content Readability',         cat: 'brand',        icon: '\u{1F4D6}' },
    'aem-live-rum-analysis.html':       { title: 'RUM Traffic Intelligence',    cat: 'performance',  icon: '\u{1F4C8}' },
    'aem-live-brand-evolution.html':    { title: 'Brand Evolution Timeline',    cat: 'brand',        icon: '\u{1F4C5}' },
    'aem-live-performance-validation.html': { title: 'Performance Validation',  cat: 'performance',  icon: '\u26A1' },
  };

  function sectionLabel(id) {
    const map = {
      summary: 'Summary', distribution: 'Distribution', structural: 'Structural Issues',
      metadata: 'Metadata', freshness: 'Freshness', brand: 'Branding', inventory: 'Inventory',
      overview: 'Overview', p1: 'Critical Priority', p2: 'High Priority', p3: 'Medium Priority', p4: 'Low Priority',
      positioning: 'Positioning', tone: 'Tone of Voice', personality: 'Personality',
      terminology: 'Terminology', structure: 'Structure', 'doc-patterns': 'Doc Patterns',
      images: 'Images', 'visual-identity': 'Visual Identity',
      critical: 'Critical', high: 'High Priority', medium: 'Medium Priority', low: 'Low Priority',
      matrix: 'Impact/Effort Matrix', 'peer-review': 'Peer Review', validation: 'Validation',
    };
    return map[id] || id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function buildCardHTML(label, href) {
    const [file, hash] = href.split('#');
    const meta = REPORT_META[file];
    if (!meta) return `<a href="${href}">${label}</a>`;
    const section = hash ? sectionLabel(hash) : '';
    // Use meta title if the label is just a filename/URL
    const displayTitle = label.includes('.html') ? (section ? `${meta.title}: ${section}` : meta.title) : label;
    const breadcrumb = section ? `${meta.title} \u2192 ${section}` : meta.title;
    return `<a class="blazar-chat-card" href="${href}">
      <div class="blazar-chat-card-icon">${meta.icon}</div>
      <div class="blazar-chat-card-body">
        <div class="blazar-chat-card-title">${displayTitle}</div>
        <div class="blazar-chat-card-section">${breadcrumb}</div>
      </div>
      <div class="blazar-chat-card-action">View</div>
    </a>`;
  }

  /* ── Markdown renderer ── */
  function renderMarkdown(text) {
    // Code blocks
    text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code>${esc(code.trim())}</code></pre>`
    );
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Inline formatting
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(?<!=)\*([^*<]+?)\*/g, '<em>$1</em>');
    text = text.replace(/^---$/gm, '<hr>');
    text = text.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    // Tables → HTML tables
    text = text.replace(/((?:^\|.+\|[ ]*\n)+)/gm, (tableBlock) => {
      const rows = tableBlock.trim().split('\n');
      if (rows.length < 2) return tableBlock;
      let html = '<table class="blazar-chat-table">';
      rows.forEach((row, i) => {
        const cells = row.split('|').slice(1, -1).map(c => c.trim());
        // Skip separator rows (|---|---|)
        if (cells.every(c => /^[-:]+$/.test(c))) return;
        const tag = i === 0 ? 'th' : 'td';
        html += '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
      });
      html += '</table>';
      return html;
    });
    // Standalone report links → cards (entire line is just the link)
    text = text.replace(/^\[([^\]]+)\]\((aem-live-[^)]+\.html(?:#[^)]*)?)\)\s*$/gm,
      (_, label, href) => buildCardHTML(label, href)
    );
    // Inline report links → styled inline links (NOT cards)
    text = text.replace(/\[([^\]]+)\]\((aem-live-[^)]+\.html(?:#[^)]*)?)\)/g,
      (_, label, href) => {
        const [file, hash] = href.split('#');
        const meta = REPORT_META[file];
        const displayLabel = label.includes('.html') && meta ? meta.title : label;
        return `<a href="${href}" class="blazar-chat-inline-link">${displayLabel}</a>`;
      }
    );
    // Other links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // Lists
    text = text.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`);
    text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    // Paragraphs
    text = text.split(/\n{2,}/).map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(pre|ul|ol|h[34]|hr|a class|table)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('');
    return text;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ── Persistence ── */
  function loadMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) messages = JSON.parse(raw).slice(-MAX_MESSAGES);
    } catch { messages = []; }
  }
  function saveMessages() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES))); }
    catch { /* quota */ }
  }

  function getPageContext() {
    const title = document.title;
    if (title && !title.toLowerCase().includes('hub')) return `[Currently viewing: ${title}]`;
    return '';
  }

  async function loadDiscovery() {
    try {
      const resp = await fetch('chat-context.json');
      if (resp.ok) {
        const data = await resp.json();
        discoveryPrompts = data.prompts;
        if (messages.length === 0) renderMessages();
      }
    } catch {}
  }

  /* ── Refs ── */
  let messagesEl, textarea, sendBtn, panel, toggleBtn;

  const SPARKLE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>`;
  const SEND_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 16 12 8"/><polyline points="8 12 12 8 16 12"/></svg>`;
  const STOP_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`;

  /* ── DOM ── */
  function init() {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    panel = document.createElement('div');
    panel.className = 'blazar-chat-panel';
    panel.setAttribute('role', 'complementary');
    panel.setAttribute('aria-label', 'Blazar assistant');
    panel.innerHTML = `
      <div class="blazar-chat-header">
        <div class="blazar-chat-header-title">Blazar</div>
        <button class="blazar-chat-new" aria-label="New conversation">New chat</button>
      </div>
      <div class="blazar-chat-messages" aria-live="polite"></div>
      <div class="blazar-chat-spacer"></div>
      <div class="blazar-chat-input-area">
        <div class="blazar-chat-input-wrap">
          <textarea class="blazar-chat-textarea" placeholder="Send message to Blazar" rows="1"></textarea>
          <div class="blazar-chat-input-actions">
            <button class="blazar-chat-send" aria-label="Send message" disabled>${SEND_SVG}</button>
          </div>
        </div>
      </div>
    `;
    const dragHandle = document.createElement('div');
    dragHandle.className = 'blazar-chat-drag';
    panel.appendChild(dragHandle);
    document.body.appendChild(panel);

    /* Restore saved width */
    const savedW = parseInt(localStorage.getItem(WIDTH_KEY), 10);
    if (savedW >= MIN_WIDTH && savedW <= MAX_WIDTH) {
      document.documentElement.style.setProperty('--blazar-w', savedW + 'px');
    }

    /* Drag-to-resize */
    dragHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragHandle.classList.add('active');
      document.documentElement.classList.add('blazar-chat-dragging');
      let rafId = 0;
      const onMove = (ev) => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const w = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - ev.clientX));
          document.documentElement.style.setProperty('--blazar-w', w + 'px');
          window.dispatchEvent(new Event('blazar-chat-resize'));
        });
      };
      const onUp = () => {
        cancelAnimationFrame(rafId);
        dragHandle.classList.remove('active');
        document.documentElement.classList.remove('blazar-chat-dragging');
        const current = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--blazar-w'), 10);
        if (current) localStorage.setItem(WIDTH_KEY, current);
        window.dispatchEvent(new Event('blazar-chat-resize'));
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    toggleBtn = document.createElement('button');
    toggleBtn.className = 'blazar-chat-toggle';
    toggleBtn.setAttribute('aria-label', 'Collapse assistant');
    toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
    document.body.appendChild(toggleBtn);

    messagesEl = panel.querySelector('.blazar-chat-messages');
    textarea = panel.querySelector('.blazar-chat-textarea');
    sendBtn = panel.querySelector('.blazar-chat-send');
    const newBtn = panel.querySelector('.blazar-chat-new');

    function expand() {
      isOpen = true;
      panel.classList.remove('blazar-chat-collapsed');
      toggleBtn.classList.remove('blazar-chat-toggle-collapsed');
      document.documentElement.classList.add('blazar-chat-active');
      textarea.focus();
    }
    function collapse() {
      isOpen = false;
      panel.classList.add('blazar-chat-collapsed');
      toggleBtn.classList.add('blazar-chat-toggle-collapsed');
      document.documentElement.classList.remove('blazar-chat-active');
    }

    toggleBtn.addEventListener('click', () => { isOpen ? collapse() : expand(); });
    expand();

    newBtn.addEventListener('click', () => { messages = []; saveMessages(); renderMessages(); });

    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) collapse(); });

    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isStreaming && textarea.value.trim()) sendMessage();
      }
    });

    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      sendBtn.disabled = !textarea.value.trim() && !isStreaming;
    });

    sendBtn.addEventListener('click', () => {
      if (isStreaming) { if (abortController) abortController.abort(); }
      else if (textarea.value.trim()) sendMessage();
    });

    loadMessages();
    loadDiscovery();
    renderMessages();
  }

  /* ── Render ── */
  function renderMessages() {
    if (!messagesEl) return;

    if (messages.length === 0 && discoveryPrompts) {
      messagesEl.innerHTML = '';
      const disc = document.createElement('div');
      disc.className = 'blazar-chat-discovery';
      Object.entries(discoveryPrompts).forEach(([cat, prompts]) => {
        const group = document.createElement('div');
        group.className = 'blazar-chat-discovery-group';
        group.innerHTML = `<div class="blazar-chat-discovery-cat">${esc(cat)}</div>`;
        prompts.forEach(p => {
          const btn = document.createElement('button');
          btn.className = 'blazar-chat-prompt-btn';
          btn.textContent = p;
          btn.addEventListener('click', () => {
            textarea.value = p;
            textarea.dispatchEvent(new Event('input'));
            sendMessage();
          });
          group.appendChild(btn);
        });
        disc.appendChild(group);
      });
      messagesEl.appendChild(disc);
      return;
    }

    messagesEl.innerHTML = '';
    messages.forEach(msg => {
      if (msg.role === 'error') {
        const el = document.createElement('div');
        el.className = 'blazar-chat-msg-error';
        el.textContent = msg.content;
        messagesEl.appendChild(el);
      } else if (msg.role === 'user') {
        const el = document.createElement('div');
        el.className = 'blazar-chat-msg-user';
        el.textContent = msg.content;
        messagesEl.appendChild(el);
      } else {
        const wrap = document.createElement('div');
        wrap.className = 'blazar-chat-msg-assistant-wrap';
        wrap.innerHTML = `<div class="blazar-chat-msg-label">${SPARKLE_SVG} blazar</div><div class="blazar-chat-msg-body">${renderMarkdown(msg.content)}</div>`;
        messagesEl.appendChild(wrap);
      }
    });

    if (isStreaming && messages.length > 0 && messages[messages.length - 1].role !== 'assistant') {
      const wrap = document.createElement('div');
      wrap.className = 'blazar-chat-typing-wrap';
      wrap.innerHTML = `<div class="blazar-chat-msg-label">${SPARKLE_SVG} blazar</div><div class="blazar-chat-typing"><span></span><span></span><span></span></div>`;
      messagesEl.appendChild(wrap);
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function updateLastAssistant(content) {
    if (!messagesEl) return;
    const wraps = messagesEl.querySelectorAll('.blazar-chat-msg-assistant-wrap');
    const last = wraps[wraps.length - 1];
    if (last) {
      const body = last.querySelector('.blazar-chat-msg-body');
      if (body) { body.innerHTML = renderMarkdown(content); messagesEl.scrollTop = messagesEl.scrollHeight; }
    }
  }

  /* ── Send ── */
  async function sendMessage() {
    const text = textarea.value.trim();
    if (!text) return;
    textarea.value = '';
    textarea.style.height = 'auto';
    textarea.dispatchEvent(new Event('input'));

    let userContent = text;
    const ctx = getPageContext();
    if (ctx && messages.filter(m => m.role === 'user').length === 0) userContent = `${ctx}\n\n${text}`;

    messages.push({ role: 'user', content: userContent });
    saveMessages();
    renderMessages();

    isStreaming = true;
    sendBtn.disabled = false;
    sendBtn.classList.add('blazar-chat-stop');
    sendBtn.innerHTML = STOP_SVG;
    textarea.disabled = true;
    abortController = new AbortController();

    const apiMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortController.signal,
      });
      if (!resp.ok) throw new Error(`API error (${resp.status})`);

      messages.push({ role: 'assistant', content: '' });
      renderMessages();

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              messages[messages.length - 1].content += delta;
              updateLastAssistant(messages[messages.length - 1].content);
            }
          } catch {}
        }
      }
      saveMessages();
      renderMessages();
    } catch (err) {
      if (err.name === 'AbortError') {
        if (messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !messages[messages.length - 1].content) messages.pop();
        saveMessages(); renderMessages();
      } else {
        messages.push({ role: 'error', content: `Could not reach the assistant. ${err.message}` });
        renderMessages();
      }
    } finally {
      isStreaming = false;
      sendBtn.classList.remove('blazar-chat-stop');
      sendBtn.innerHTML = SEND_SVG;
      textarea.disabled = false;
      sendBtn.disabled = !textarea.value.trim();
      textarea.focus();
      abortController = null;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
