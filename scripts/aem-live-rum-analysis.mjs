#!/usr/bin/env node
/**
 * AEM Live RUM Analysis — Data Processing Script
 *
 * Reads raw RUM bundles from /tmp/aem-rum-feb.json and cross-references
 * with the static content analysis at data/aem-live/analysis.json.
 * Outputs a pre-aggregated JSON at data/aem-live/rum-feb-2026.json.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Load data ──
const rumRaw = JSON.parse(readFileSync('/tmp/aem-rum-feb.json', 'utf-8'));
const analysis = JSON.parse(readFileSync(resolve(ROOT, 'data/aem-live/analysis.json'), 'utf-8'));
const bundles = rumRaw.rumBundles;

console.log(`Loaded ${bundles.length} RUM bundles`);
console.log(`Loaded analysis with ${analysis.allEntries.length} index entries`);

// ── Per-URL aggregation ──
const urlMap = {};

function getOrCreate(path) {
  if (!urlMap[path]) {
    urlMap[path] = {
      path,
      views: 0,
      devices: { desktop: 0, mobile: 0, bot: 0, other: 0 },
      referrers: {},
      clicks: 0,
      enters: 0,
      errors: [],
      missingResources: {},
      cwv: { lcp: [], cls: [], inp: [], ttfb: [] },
      is404: false,
      viewblocks: {},
    };
  }
  return urlMap[path];
}

for (const b of bundles) {
  const path = b.url.replace('https://www.aem.live', '') || '/';
  const weight = b.weight || 1;
  const entry = getOrCreate(path);

  entry.views += weight;

  // Device
  const ua = b.userAgent || '';
  const device = ua.split(':')[0] || 'other';
  if (device === 'desktop') entry.devices.desktop += weight;
  else if (device === 'mobile') entry.devices.mobile += weight;
  else if (device === 'bot') entry.devices.bot += weight;
  else entry.devices.other += weight;

  for (const e of (b.events || [])) {
    const cp = e.checkpoint;

    if (cp === 'navigate' && e.source) {
      const ref = e.source.split('#')[0].replace(/\/$/, '');
      entry.referrers[ref] = (entry.referrers[ref] || 0) + weight;
    }

    if (cp === 'click') {
      entry.clicks += weight;
    }

    if (cp === 'enter') {
      entry.enters += weight;
    }

    if (cp === 'error') {
      entry.errors.push({
        source: (e.source || 'unknown').slice(0, 120),
        weight,
      });
    }

    if (cp === 'missingresource') {
      const src = e.source || 'unknown';
      entry.missingResources[src] = (entry.missingResources[src] || 0) + weight;
    }

    if (cp === '404') {
      entry.is404 = true;
    }

    if (cp === 'cwv-lcp' && e.value != null) entry.cwv.lcp.push({ value: e.value, weight });
    if (cp === 'cwv-cls' && e.value != null) entry.cwv.cls.push({ value: e.value, weight });
    if (cp === 'cwv-inp' && e.value != null) entry.cwv.inp.push({ value: e.value, weight });
    if (cp === 'cwv-ttfb' && e.value != null) entry.cwv.ttfb.push({ value: e.value, weight });

    if (cp === 'viewblock') {
      const block = e.source || 'unknown';
      entry.viewblocks[block] = (entry.viewblocks[block] || 0) + weight;
    }
  }
}

// ── Compute CWV aggregates ──
function cwvAggregate(samples) {
  if (!samples.length) return null;
  const values = samples.map(s => s.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const p75 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.75)] || avg;
  return { avg: Math.round(avg), p75: Math.round(p75), samples: samples.length };
}

// ── Build per-URL output ──
const pages = Object.values(urlMap).map(u => {
  // Aggregate errors
  const errorCounts = {};
  for (const e of u.errors) {
    errorCounts[e.source] = (errorCounts[e.source] || 0) + e.weight;
  }

  return {
    path: u.path,
    views: u.views,
    clicks: u.clicks,
    enters: u.enters,
    devices: u.devices,
    topReferrers: Object.entries(u.referrers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url, count]) => ({ url, count })),
    errors: Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({ source, count })),
    totalErrors: Object.values(errorCounts).reduce((a, b) => a + b, 0),
    missingResources: Object.entries(u.missingResources)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count })),
    is404: u.is404,
    cwv: {
      lcp: cwvAggregate(u.cwv.lcp),
      cls: u.cwv.cls.length ? {
        avg: +(u.cwv.cls.map(s => s.value).reduce((a, b) => a + b, 0) / u.cwv.cls.length).toFixed(3),
        p75: +(u.cwv.cls.map(s => s.value).sort((a, b) => a - b)[Math.floor(u.cwv.cls.length * 0.75)] || 0).toFixed(3),
        samples: u.cwv.cls.length,
      } : null,
      inp: cwvAggregate(u.cwv.inp),
      ttfb: cwvAggregate(u.cwv.ttfb),
    },
  };
}).sort((a, b) => b.views - a.views);

// ── Global aggregates ──
const totalViews = pages.reduce((a, p) => a + p.views, 0);
const totalClicks = pages.reduce((a, p) => a + p.clicks, 0);
const totalErrors = pages.reduce((a, p) => a + p.totalErrors, 0);
const totalEnters = pages.reduce((a, p) => a + p.enters, 0);
const uniqueUrls = pages.length;
const deviceTotals = { desktop: 0, mobile: 0, bot: 0, other: 0 };
pages.forEach(p => {
  deviceTotals.desktop += p.devices.desktop;
  deviceTotals.mobile += p.devices.mobile;
  deviceTotals.bot += p.devices.bot;
  deviceTotals.other += p.devices.other;
});

// Global referrers
const globalReferrers = {};
for (const b of bundles) {
  for (const e of (b.events || [])) {
    if (e.checkpoint === 'navigate' && e.source) {
      const ref = e.source.split('#')[0].replace(/\/$/, '');
      globalReferrers[ref] = (globalReferrers[ref] || 0) + (b.weight || 1);
    }
  }
}

// 404 pages
const fourOhFourPages = pages.filter(p => p.is404).map(p => p.path);

// Pages with poor CWV
const poorCwv = pages.filter(p => {
  const lcp = p.cwv.lcp;
  const cls = p.cwv.cls;
  const inp = p.cwv.inp;
  const ttfb = p.cwv.ttfb;
  return (lcp && lcp.avg > 2500) || (cls && cls.avg > 0.1) || (inp && inp.avg > 200) || (ttfb && ttfb.avg > 800);
}).map(p => ({
  path: p.path,
  views: p.views,
  issues: [
    ...(p.cwv.lcp && p.cwv.lcp.avg > 2500 ? [`LCP ${p.cwv.lcp.avg}ms`] : []),
    ...(p.cwv.cls && p.cwv.cls.avg > 0.1 ? [`CLS ${p.cwv.cls.avg}`] : []),
    ...(p.cwv.inp && p.cwv.inp.avg > 200 ? [`INP ${p.cwv.inp.avg}ms`] : []),
    ...(p.cwv.ttfb && p.cwv.ttfb.avg > 800 ? [`TTFB ${p.cwv.ttfb.avg}ms`] : []),
  ],
}));

// ── Cross-reference with static analysis ──
const stalePages = analysis.quality.staleContent || [];
const missingOgPages = analysis.metadata.missingCustomImage || [];
const oldBrandingPages = analysis.quality.oldBranding || [];
const indexPaths = new Set(analysis.allEntries.map(e => e.path));

// Build title map from index
const titleMap = {};
for (const entry of analysis.allEntries) {
  titleMap[entry.path] = entry.title;
}

// Stale pages with/without traffic
const staleWithTraffic = stalePages
  .filter(p => pages.find(pg => pg.path === p.path))
  .map(p => {
    const pg = pages.find(pg => pg.path === p.path);
    return { ...p, views: pg ? pg.views : 0 };
  })
  .sort((a, b) => b.views - a.views);

const staleNoTraffic = stalePages
  .filter(p => !pages.find(pg => pg.path === p.path))
  .map(p => ({ ...p, views: 0 }));

// OG image gaps with/without traffic
const ogWithTraffic = missingOgPages
  .filter(p => pages.find(pg => pg.path === p.path))
  .map(p => {
    const pg = pages.find(pg => pg.path === p.path);
    return { ...p, views: pg ? pg.views : 0 };
  })
  .sort((a, b) => b.views - a.views);

const ogNoTraffic = missingOgPages
  .filter(p => !pages.find(pg => pg.path === p.path))
  .map(p => ({ ...p, views: 0 }));

// Traffic concentration
const top10Views = pages.slice(0, 10).reduce((a, p) => a + p.views, 0);
const top10Pct = ((top10Views / totalViews) * 100).toFixed(1);
const top20Views = pages.slice(0, 20).reduce((a, p) => a + p.views, 0);
const top20Pct = ((top20Views / totalViews) * 100).toFixed(1);

// ── Missing resources (global)
const globalMissing = {};
for (const p of pages) {
  for (const mr of p.missingResources) {
    globalMissing[mr.source] = (globalMissing[mr.source] || 0) + mr.count;
  }
}

// ── Output ──
const output = {
  meta: {
    domain: 'www.aem.live',
    period: '2026-02-15 to 2026-02-24',
    generatedAt: new Date().toISOString(),
    bundleCount: bundles.length,
    samplingNote: 'RUM uses 1:100 sampling for production traffic, 1:10 for preview/sidekick. Weights are pre-applied.',
  },
  summary: {
    totalViews,
    uniqueUrls,
    totalClicks,
    totalEnters,
    totalErrors,
    devices: deviceTotals,
    top10TrafficPct: parseFloat(top10Pct),
    top20TrafficPct: parseFloat(top20Pct),
  },
  topReferrers: Object.entries(globalReferrers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([url, count]) => ({ url, count })),
  pages,
  crossReference: {
    staleWithTraffic,
    staleNoTraffic,
    ogWithTraffic,
    ogNoTraffic,
    oldBrandingWithTraffic: oldBrandingPages
      .filter(p => pages.find(pg => pg.path === p.path))
      .map(p => {
        const pg = pages.find(pg => pg.path === p.path);
        return { ...p, views: pg ? pg.views : 0 };
      })
      .sort((a, b) => b.views - a.views),
  },
  issues: {
    fourOhFourPages,
    poorCwv,
    globalMissingResources: Object.entries(globalMissing)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => ({ source, count })),
  },
  titleMap,
};

// Write output
const outDir = resolve(ROOT, 'data/aem-live');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, 'rum-feb-2026.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`\nWritten ${(JSON.stringify(output).length / 1024).toFixed(0)}KB to ${outPath}`);
console.log(`  ${uniqueUrls} URLs, ${totalViews.toLocaleString()} estimated views`);
console.log(`  ${staleWithTraffic.length} stale pages with traffic, ${staleNoTraffic.length} without`);
console.log(`  ${ogWithTraffic.length} OG-missing with traffic, ${ogNoTraffic.length} without`);
console.log(`  ${poorCwv.length} pages with CWV issues`);
console.log(`  ${fourOhFourPages.length} real 404s`);
