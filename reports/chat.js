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
  let writeMode = false;

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
      border-bottom: none;
      flex-shrink: 0;
    }
    .blazar-chat-header-title {
      font-size: 16px; font-weight: 700; color: #1A1A1A;
    }
    .blazar-chat-new {
      font-size: 13px; color: #999; background: none; border: none;
      cursor: pointer; font-family: inherit; padding: 6px 10px; border-radius: 6px;
      display: inline-flex; align-items: center; gap: 4px;
      transition: all 0.15s;
    }
    .blazar-chat-new:hover { color: #1A1A1A; background: #F5F5F5; }
    .blazar-chat-new svg { width: 15px; height: 15px; flex-shrink: 0; }

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
      display: flex; align-items: center; justify-content: space-between;
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

    /* Write mode toggle */
    .blazar-chat-write-toggle {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px 4px 7px;
      border-radius: 20px;
      border: 1px solid #E0E0E0;
      background: #FFFFFF;
      font-family: inherit; font-size: 12px; font-weight: 500;
      color: #999;
      cursor: pointer;
      transition: all 0.2s ease;
      line-height: 1;
      white-space: nowrap;
    }
    .blazar-chat-write-toggle:hover { border-color: #CCC; color: #666; }
    .blazar-chat-write-toggle.active {
      background: #1A1A1A; border-color: #1A1A1A;
      color: #FFFFFF;
    }
    .blazar-chat-write-toggle.active:hover { background: #333; border-color: #333; }
    .blazar-chat-write-toggle svg { width: 13px; height: 13px; flex-shrink: 0; }

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
    .blazar-chat-tabs.blazar-chat-tabs-hidden + .blazar-chat-messages { border-top: 1px solid #EBEBEB; }
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
      width: 24px; height: 24px; border-radius: 50%;
      font-size: 12px; line-height: 1;
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
    .blazar-chat-history-item-preview {
      font-size: 12px; color: #999;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-top: 2px;
    }
    .blazar-chat-history-item-time { font-size: 11px; color: #999; margin-top: 1px; }
    .blazar-chat-history-item-del {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 50%;
      font-size: 13px; color: #CCC; background: none; border: none;
      cursor: pointer; flex-shrink: 0;
      transition: color 0.15s, background 0.15s;
    }
    .blazar-chat-history-item-del:hover { color: #CC3333; background: #FFF0F0; }
    .blazar-chat-history-empty {
      padding: 20px 14px; text-align: center;
      font-size: 13px; color: #999;
    }

    /* Generation progress card */
    .blazar-chat-generation-card {
      margin: 16px 20px 0;
      padding: 16px;
      background: #F7F7F8;
      border: 1px solid #EBEBEB;
      border-radius: 12px;
    }
    .blazar-chat-generation-card .gen-header {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 10px; font-size: 13px; font-weight: 600; color: #1A1A1A;
    }
    .blazar-chat-generation-card .gen-header svg { width: 16px; height: 16px; }
    .blazar-chat-generation-card .gen-status {
      font-size: 13px; color: #666; margin-bottom: 8px;
    }
    .blazar-chat-generation-card .gen-bar {
      height: 4px; background: #E8E8E8; border-radius: 2px; overflow: hidden;
    }
    .blazar-chat-generation-card .gen-bar-fill {
      height: 100%; background: #1A1A1A; border-radius: 2px;
      width: 0%; transition: width 0.3s ease;
    }
    .blazar-chat-generation-card.gen-indeterminate .gen-bar-fill {
      width: 40%;
      animation: blazar-gen-slide 1.5s ease-in-out infinite;
    }
    @keyframes blazar-gen-slide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }
    .blazar-chat-generation-card .gen-link {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; margin-top: 10px;
      background: #FFFFFF; border: 1px solid #EBEBEB; border-radius: 8px;
      text-decoration: none; color: #1A1A1A;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .blazar-chat-generation-card .gen-link:hover {
      border-color: #CCC; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .blazar-chat-generation-card .gen-link-icon {
      width: 32px; height: 32px; border-radius: 8px;
      background: #1A1A1A; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; flex-shrink: 0;
    }
    .blazar-chat-generation-card .gen-link-body { flex: 1; min-width: 0; }
    .blazar-chat-generation-card .gen-link-title {
      font-size: 14px; font-weight: 600; color: #1A1A1A;
    }
    .blazar-chat-generation-card .gen-link-url {
      font-size: 12px; color: #999; margin-top: 1px;
    }
    .blazar-chat-generation-card .gen-error {
      margin-top: 8px; padding: 8px 10px;
      background: #FFF5F5; border: 1px solid #FFE0E0; border-radius: 8px;
      color: #CC3333; font-size: 13px;
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

  /* ── Report spec extraction ── */
  function extractReportSpec(text) {
    const match = text.match(/:::REPORT_SPEC\s*\n([\s\S]*?)\n:::/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }

  function stripReportSpec(text) {
    return text.replace(/:::REPORT_SPEC\s*\n[\s\S]*?\n:::/g, '').trim();
  }

  /* ── Markdown renderer ── */
  function renderMarkdown(text) {
    // Strip report spec blocks before rendering
    text = stripReportSpec(text);
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
  function genId() { return crypto.randomUUID().slice(0, 8); }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        store = JSON.parse(raw);
        // Ensure shape
        if (!Array.isArray(store.chats)) store.chats = [];
        if (!Array.isArray(store.openTabs)) store.openTabs = [];
        // Prune orphaned openTabs
        const ids = new Set(store.chats.map(c => c.id));
        store.openTabs = store.openTabs.filter(id => ids.has(id));
        if (store.activeTab && !ids.has(store.activeTab)) store.activeTab = null;
        return;
      }
      // Migrate from old single-conversation key
      const old = localStorage.getItem(OLD_STORAGE_KEY);
      if (old) {
        const msgs = JSON.parse(old).slice(-MAX_MESSAGES);
        if (msgs.length > 0) {
          const id = genId();
          const firstUser = msgs.find(m => m.role === 'user');
          const title = firstUser ? firstUser.content.slice(0, 40) : 'New chat';
          store = {
            chats: [{ id, title, messages: msgs, ts: Date.now() }],
            openTabs: [id],
            activeTab: id,
          };
          saveStore();
          localStorage.removeItem(OLD_STORAGE_KEY);
          return;
        }
      }
      store = { chats: [], openTabs: [], activeTab: null };
    } catch {
      store = { chats: [], openTabs: [], activeTab: null };
    }
  }

  function saveStore() {
    try {
      // Cap messages per chat, prune oldest chats
      store.chats.forEach(c => { c.messages = c.messages.slice(-MAX_MESSAGES); });
      if (store.chats.length > MAX_CHATS) {
        const openSet = new Set(store.openTabs);
        // Sort closed chats by ts ascending, remove oldest
        const closed = store.chats.filter(c => !openSet.has(c.id)).sort((a, b) => a.ts - b.ts);
        while (store.chats.length > MAX_CHATS && closed.length > 0) {
          const victim = closed.shift();
          store.chats = store.chats.filter(c => c.id !== victim.id);
        }
      }
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch { /* quota */ }
  }

  function getActiveChat() {
    return store.chats.find(c => c.id === store.activeTab) || null;
  }

  function createChat() {
    const id = genId();
    const chat = { id, title: 'New chat', messages: [], ts: Date.now() };
    store.chats.push(chat);
    store.openTabs.push(id);
    store.activeTab = id;
    saveStore();
    return chat;
  }

  function switchTab(id) {
    if (store.activeTab === id) return;
    store.activeTab = id;
    saveStore();
    renderTabs();
    renderMessages();
  }

  function closeTab(id) {
    const idx = store.openTabs.indexOf(id);
    if (idx === -1) return;
    store.openTabs.splice(idx, 1);

    // If closing the active tab, switch to adjacent
    if (store.activeTab === id) {
      if (store.openTabs.length > 0) {
        store.activeTab = store.openTabs[Math.min(idx, store.openTabs.length - 1)];
      } else {
        // Last tab closed — create a fresh one
        const fresh = { id: genId(), title: 'New chat', messages: [], ts: Date.now() };
        store.chats.push(fresh);
        store.openTabs.push(fresh.id);
        store.activeTab = fresh.id;
      }
    }

    // Remove chat from store entirely if it has no messages (no point keeping empty chats in history)
    const chat = store.chats.find(c => c.id === id);
    if (chat && chat.messages.length === 0) {
      store.chats = store.chats.filter(c => c.id !== id);
    }

    saveStore();
    renderTabs();
    renderMessages();
  }

  function reopenChat(id) {
    if (store.openTabs.includes(id)) {
      switchTab(id);
      return;
    }
    store.openTabs.push(id);
    store.activeTab = id;
    saveStore();
    renderTabs();
    renderMessages();
  }

  function deleteChat(id) {
    // Remove from openTabs if present
    store.openTabs = store.openTabs.filter(tid => tid !== id);
    store.chats = store.chats.filter(c => c.id !== id);
    if (store.activeTab === id) {
      if (store.openTabs.length > 0) {
        store.activeTab = store.openTabs[store.openTabs.length - 1];
      } else {
        store.activeTab = null;
      }
    }
    saveStore();
    renderTabs();
    renderHistory();
    renderMessages();
  }

  function updateChatTitle(chat) {
    const firstUser = chat.messages.find(m => m.role === 'user');
    if (firstUser) {
      chat.title = firstUser.content.replace(/^\[Currently viewing:.*?\]\s*/s, '').slice(0, 40);
      if (!chat.title) chat.title = firstUser.content.slice(0, 40);
    }
  }

  function relativeTime(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
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
        const chat = getActiveChat();
        if (!chat || chat.messages.length === 0) renderMessages();
      }
    } catch {}
  }

  /* ── Refs ── */
  let messagesEl, textarea, sendBtn, panel, toggleBtn, tabsEl, historyDropdownEl;

  const SPARKLE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>`;
  const WRITE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`;
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
        <div style="display:flex;align-items:center;gap:4px;">
          <div class="blazar-chat-history-wrap">
            <button class="blazar-chat-new" aria-label="Chat history" data-history><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>History</button>
            <div class="blazar-chat-history-dropdown"></div>
          </div>
          <button class="blazar-chat-new" aria-label="New tab" data-newtab><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
        </div>
      </div>
      <div class="blazar-chat-tabs blazar-chat-tabs-hidden"></div>
      <div class="blazar-chat-messages" aria-live="polite"></div>
      <div class="blazar-chat-spacer"></div>
      <div class="blazar-chat-input-area">
        <div class="blazar-chat-input-wrap">
          <textarea class="blazar-chat-textarea" placeholder="Ask about reports..." rows="1"></textarea>
          <div class="blazar-chat-input-actions">
            <button class="blazar-chat-write-toggle" aria-label="Toggle write mode" data-write-toggle>${WRITE_SVG}</button>
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
    tabsEl = panel.querySelector('.blazar-chat-tabs');
    historyDropdownEl = panel.querySelector('.blazar-chat-history-dropdown');
    const newTabBtn = panel.querySelector('[data-newtab]');
    const historyBtn = panel.querySelector('[data-history]');

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

    newTabBtn.addEventListener('click', () => {
      createChat();
      renderTabs();
      renderMessages();
      textarea.focus();
    });

    const writeToggleBtn = panel.querySelector('[data-write-toggle]');
    writeToggleBtn.addEventListener('click', () => {
      writeMode = !writeMode;
      writeToggleBtn.classList.toggle('active', writeMode);
      textarea.placeholder = writeMode ? 'Ask anything or request a new report...' : 'Ask about reports...';
      textarea.focus();
    });

    historyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      historyOpen = !historyOpen;
      renderHistory();
    });

    // Close history dropdown on outside click
    document.addEventListener('click', (e) => {
      if (historyOpen && !historyDropdownEl.contains(e.target) && e.target !== historyBtn) {
        historyOpen = false;
        renderHistory();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (historyOpen) { historyOpen = false; renderHistory(); }
        else if (isOpen) collapse();
      }
    });

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

    loadStore();
    // Ensure at least one open tab
    if (store.openTabs.length === 0) createChat();
    if (!store.activeTab || !store.openTabs.includes(store.activeTab)) {
      store.activeTab = store.openTabs[0];
      saveStore();
    }
    loadDiscovery();
    renderTabs();
    renderMessages();
  }

  /* ── Render ── */
  function renderTabs() {
    if (!tabsEl) return;
    const hasHistory = store.chats.some(c => !new Set(store.openTabs).has(c.id) && c.messages.length > 0);
    const shouldHide = store.openTabs.length <= 1 && getActiveChat() && getActiveChat().messages.length === 0 && !hasHistory;
    tabsEl.classList.toggle('blazar-chat-tabs-hidden', shouldHide);

    tabsEl.innerHTML = '';
    store.openTabs.forEach(id => {
      const chat = store.chats.find(c => c.id === id);
      if (!chat) return;
      const tab = document.createElement('button');
      tab.className = 'blazar-chat-tab' + (id === store.activeTab ? ' active' : '');
      tab.innerHTML = `<span class="blazar-chat-tab-title">${esc(chat.title)}</span><span class="blazar-chat-tab-close" data-close="${id}">\u2715</span>`;
      tab.addEventListener('click', (e) => {
        if (e.target.dataset.close) {
          e.stopPropagation();
          closeTab(e.target.dataset.close);
          return;
        }
        switchTab(id);
      });
      tabsEl.appendChild(tab);
    });
  }

  function renderHistory() {
    if (!historyDropdownEl) return;
    historyDropdownEl.classList.toggle('open', historyOpen);
    if (!historyOpen) return;

    const openSet = new Set(store.openTabs);
    const closed = store.chats
      .filter(c => !openSet.has(c.id) && c.messages.length > 0)
      .sort((a, b) => b.ts - a.ts);

    if (closed.length === 0) {
      historyDropdownEl.innerHTML = `<div class="blazar-chat-history-dropdown-header">History</div><div class="blazar-chat-history-empty">No past conversations</div>`;
      return;
    }

    historyDropdownEl.innerHTML = `<div class="blazar-chat-history-dropdown-header">History</div>`;
    closed.forEach(chat => {
      const row = document.createElement('div');
      row.className = 'blazar-chat-history-item';
      const lastMsg = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
      const preview = lastMsg ? (lastMsg.content || '').replace(/[#*_`\n]+/g, ' ').trim().slice(0, 60) : '';
      const count = chat.messages.length;
      row.innerHTML = `
        <div class="blazar-chat-history-item-body">
          <div class="blazar-chat-history-item-title">${esc(chat.title)}</div>
          ${preview ? `<div class="blazar-chat-history-item-preview">${esc(preview)}</div>` : ''}
          <div class="blazar-chat-history-item-time">${count} msg${count !== 1 ? 's' : ''} \u00b7 ${relativeTime(chat.ts)}</div>
        </div>
        <button class="blazar-chat-history-item-del" data-del="${chat.id}" aria-label="Delete">\u2715</button>
      `;
      row.addEventListener('click', (e) => {
        if (e.target.closest('[data-del]')) {
          e.stopPropagation();
          deleteChat(e.target.closest('[data-del]').dataset.del);
          return;
        }
        historyOpen = false;
        reopenChat(chat.id);
        renderHistory();
      });
      historyDropdownEl.appendChild(row);
    });
  }

  function renderMessages() {
    if (!messagesEl) return;
    const chat = getActiveChat();
    const messages = chat ? chat.messages : [];

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
      } else if (msg.role === 'generation') {
        messagesEl.appendChild(renderGenerationCard(msg));
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

  /* ── Report generation ── */
  function renderGenerationCard(msg) {
    const card = document.createElement('div');
    card.className = 'blazar-chat-generation-card' + (msg.genState === 'generating' ? ' gen-indeterminate' : '');
    const BOLT_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;

    let inner = `<div class="gen-header">${BOLT_SVG} Generating Report</div>`;
    inner += `<div class="gen-status">${esc(msg.genStatus || 'Starting...')}</div>`;

    if (msg.genState === 'generating') {
      inner += `<div class="gen-bar"><div class="gen-bar-fill"></div></div>`;
    } else if (msg.genState === 'done' && msg.genUrl) {
      const title = msg.genTitle || 'Generated Report';
      inner += `<a class="gen-link" href="${msg.genUrl}">
        <div class="gen-link-icon">\u{1F4CB}</div>
        <div class="gen-link-body">
          <div class="gen-link-title">${esc(title)}</div>
          <div class="gen-link-url">${msg.genUrl}</div>
        </div>
      </a>`;
    } else if (msg.genState === 'error') {
      inner += `<div class="gen-error">${esc(msg.genError || 'Generation failed')}</div>`;
    }

    card.innerHTML = inner;
    return card;
  }

  async function triggerGeneration(spec, chat) {
    // Add a generation message to the chat
    const genMsg = {
      role: 'generation',
      genState: 'generating',
      genStatus: 'Starting report generation...',
      genTitle: spec.title,
      content: '',
    };
    chat.messages.push(genMsg);
    chat.ts = Date.now();
    saveStore();
    renderMessages();

    try {
      const resp = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec }),
      });

      if (!resp.ok) {
        genMsg.genState = 'error';
        genMsg.genError = `API error (${resp.status})`;
        saveStore();
        renderMessages();
        return;
      }

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
          if (line.startsWith('event: ')) {
            var currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ') && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === 'progress') {
                genMsg.genStatus = data.status;
                renderMessages();
              } else if (currentEvent === 'chunk') {
                genMsg.genStatus = `Generating HTML... (${Math.round(data.length / 1024)}KB)`;
                renderMessages();
              } else if (currentEvent === 'done') {
                genMsg.genState = 'done';
                genMsg.genUrl = data.reportUrl;
                genMsg.genStatus = 'Report generated successfully!';
                chat.ts = Date.now();
                saveStore();
                renderMessages();
              } else if (currentEvent === 'error') {
                genMsg.genState = 'error';
                genMsg.genError = data.message;
                saveStore();
                renderMessages();
              }
            } catch {}
            currentEvent = null;
          }
        }
      }

      // If we finished reading but never got a 'done' event
      if (genMsg.genState === 'generating') {
        genMsg.genState = 'error';
        genMsg.genError = 'Stream ended without completion';
        saveStore();
        renderMessages();
      }
    } catch (err) {
      genMsg.genState = 'error';
      genMsg.genError = err.message || 'Network error';
      saveStore();
      renderMessages();
    }
  }

  /* ── Send ── */
  async function sendMessage() {
    const text = textarea.value.trim();
    if (!text) return;
    textarea.value = '';
    textarea.style.height = 'auto';
    textarea.dispatchEvent(new Event('input'));

    const chat = getActiveChat();
    if (!chat) return;

    let userContent = text;
    const ctx = getPageContext();
    if (ctx && chat.messages.filter(m => m.role === 'user').length === 0) userContent = `${ctx}\n\n${text}`;

    chat.messages.push({ role: 'user', content: userContent });
    chat.ts = Date.now();
    updateChatTitle(chat);
    saveStore();
    renderTabs();
    renderMessages();

    isStreaming = true;
    sendBtn.disabled = false;
    sendBtn.classList.add('blazar-chat-stop');
    sendBtn.innerHTML = STOP_SVG;
    textarea.disabled = true;
    abortController = new AbortController();

    const apiMessages = chat.messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, mode: writeMode ? 'write' : 'read' }),
        signal: abortController.signal,
      });
      if (!resp.ok) throw new Error(`API error (${resp.status})`);

      chat.messages.push({ role: 'assistant', content: '' });
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
              chat.messages[chat.messages.length - 1].content += delta;
              updateLastAssistant(chat.messages[chat.messages.length - 1].content);
            }
          } catch {}
        }
      }
      chat.ts = Date.now();
      saveStore();
      renderMessages();

      // Check for report spec in the completed assistant message
      const lastMsg = chat.messages[chat.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        const spec = extractReportSpec(lastMsg.content);
        if (spec && spec.id && spec.title) {
          triggerGeneration(spec, chat);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (chat.messages.length > 0 && chat.messages[chat.messages.length - 1].role === 'assistant' && !chat.messages[chat.messages.length - 1].content) chat.messages.pop();
        saveStore(); renderMessages();
      } else {
        chat.messages.push({ role: 'error', content: `Could not reach the assistant. ${err.message}` });
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
