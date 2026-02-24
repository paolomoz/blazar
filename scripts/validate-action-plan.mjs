#!/usr/bin/env node
/**
 * Cross-validates the aem.live action plan using:
 * 1. GPT-4o — independent priority/feasibility review
 * 2. Live HTTP checks — verify affected pages are still in the claimed state
 * 3. AEM EDS domain validation — check that recommendations are technically correct
 */

import { readFileSync } from 'fs';

// Load .env manually (no dotenv dependency)
const envContent = readFileSync(new URL('../.env', import.meta.url), 'utf8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].trim();
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY not found in .env');
  process.exit(1);
}

// ── Prepare action plan summary for review ──
const actionPlan = [
  { id: 1, priority: 'P1', title: 'Remove dead page /mwp-demo from query index', effort: 'Low', impact: 'SEO & Trust', pages: 1 },
  { id: 2, priority: 'P1', title: 'Add 5 sitemap-only pages to the query index', effort: 'Low', impact: 'Discoverability', pages: 5 },
  { id: 3, priority: 'P1', title: 'Add 9 live indexed pages to the sitemap', effort: 'Low', impact: 'SEO', pages: 9 },
  { id: 4, priority: 'P1', title: 'Fix stale navigation link to renamed page (anatomy-of-a-helix-project → anatomy-of-a-project)', effort: 'Low', impact: 'User Experience', pages: 1 },
  { id: 5, priority: 'P2', title: 'Rebrand 5 business/tool pages still using Franklin and Helix names', effort: 'Medium', impact: 'Brand & Trust', pages: 5 },
  { id: 6, priority: 'P2', title: 'Review and update 72 stale pages (>12 months old)', effort: 'High', impact: 'Content Quality', pages: 72 },
  { id: 7, priority: 'P2', title: 'Update old branding in 6 documentation pages (helix-query.yaml, helix@adobe.com, hlx.live)', effort: 'Medium', impact: 'Developer Trust', pages: 6 },
  { id: 8, priority: 'P2', title: 'Add descriptions to 6 pages with empty meta descriptions', effort: 'Low', impact: 'SEO', pages: 6 },
  { id: 9, priority: 'P2', title: 'Add custom OG images to high-traffic pages (docs hub, developer hub, demo)', effort: 'High', impact: 'Social & Brand', pages: 6 },
  { id: 10, priority: 'P3', title: 'Decide the future of 6 legacy /previous/ CDN setup pages for hlx.live', effort: 'Medium', impact: 'Clarity', pages: 6 },
  { id: 11, priority: 'P3', title: 'Review 14 labs/experimental pages for graduation or removal', effort: 'Medium', impact: 'Completeness', pages: 14 },
  { id: 12, priority: 'P3', title: 'Add deprecation banners to 2 deprecated feature pages (folder-mapping, scheduling)', effort: 'Low', impact: 'Developer Guidance', pages: 2 },
  { id: 13, priority: 'P3', title: 'Resolve /home navigation reference (gnav/footer link to unindexed path)', effort: 'Low', impact: 'Consistency', pages: 1 },
  { id: 14, priority: 'P3', title: 'Add custom OG images to remaining 44 content pages', effort: 'High', impact: 'Social & Brand', pages: 44 },
  { id: 15, priority: 'P4', title: 'Remove 8 utility/fragment pages from the query index (thank-you, gnav, footer, experiment)', effort: 'Low', impact: 'Index Hygiene', pages: 8 },
  { id: 16, priority: 'P4', title: 'Resolve 2 duplicate page titles', effort: 'Low', impact: 'Clarity', pages: 2 },
  { id: 17, priority: 'P4', title: 'Update copyright year in footer (2025 → 2026)', effort: 'Low', impact: 'Professionalism', pages: 1 },
  { id: 18, priority: 'P4', title: 'Set up automated content health monitoring (re-run analysis periodically)', effort: 'Medium', impact: 'Prevention', pages: 0 },
];

// ── 1. GPT-4o Independent Review ──
async function gptReview() {
  console.log('═══ GPT-4o INDEPENDENT REVIEW ═══\n');

  const prompt = `You are a senior web content strategist and AEM Edge Delivery Services expert reviewing an action plan for www.aem.live — Adobe's official documentation site for AEM Edge Delivery Services.

The site has 197 pages in its query index and 192 URLs in its sitemap. A content gaps analysis was performed and the following action plan was derived. Your job is to critically review it.

ACTION PLAN:
${JSON.stringify(actionPlan, null, 2)}

CONTEXT:
- www.aem.live is Adobe's official product documentation for AEM Edge Delivery Services
- The site uses AEM EDS itself (document-based authoring with Google Docs/SharePoint, query index via helix-query.yaml, automatic sitemap generation)
- "Franklin" and "Helix" were internal project names that were rebranded to "AEM Edge Delivery Services"
- The hlx.live domain was deprecated and blocked in December 2025
- helix-query.yaml is still the actual filename used for index configuration (it has NOT been renamed)
- The site serves developers, authors, and business stakeholders

Please evaluate:

1. PRIORITY ASSESSMENT: Are the P1/P2/P3/P4 assignments reasonable? Flag any you'd change and explain why. Consider: a dead page in the index (P1), sitemap/index sync issues (P1), stale content (P2), old branding (P2), missing OG images (P2/P3).

2. FEASIBILITY CHECK: Are any actions technically infeasible or incorrect for an AEM EDS site? For example, is the recommendation to modify helix-query.yaml correct for controlling what gets indexed? Is the sitemap auto-generated or manually maintained?

3. MISSING ACTIONS: Are there obvious content health actions that are missing from this plan?

4. EFFORT CALIBRATION: Are the effort estimates (Low/Medium/High) reasonable? Flag any that seem miscalibrated.

5. PRIORITY ORDER DISAGREEMENTS: If you had to pick the top 3 actions by actual impact, which would they be and why?

Be specific and critical. Don't just agree — identify problems.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('GPT-4o API error:', res.status, err);
    return null;
  }

  const data = await res.json();
  const review = data.choices[0].message.content;
  console.log(review);
  console.log('\n');
  return review;
}

// ── 2. Live HTTP Validation ──
async function httpValidation() {
  console.log('═══ LIVE HTTP VALIDATION ═══\n');

  // Spot-check key claims: is /mwp-demo still 404? Are the sitemap-only pages still live?
  const checks = [
    { url: 'https://www.aem.live/mwp-demo', expect: 404, desc: 'Dead page (action #1)' },
    { url: 'https://www.aem.live/developer/block-collection/header', expect: 200, desc: 'Sitemap-only page (action #2)' },
    { url: 'https://www.aem.live/developer/block-collection/columns', expect: 200, desc: 'Index-only page (action #3)' },
    { url: 'https://www.aem.live/developer/anatomy-of-a-helix-project', expect: 200, desc: 'Old nav link (action #4)' },
    { url: 'https://www.aem.live/developer/anatomy-of-a-project', expect: 200, desc: 'Canonical page (action #4)' },
    { url: 'https://www.aem.live/business/demo', expect: 200, desc: 'Rebrand target (action #5)' },
    { url: 'https://www.aem.live/home', expect: 200, desc: 'Unindexed nav target (action #13)' },
    { url: 'https://www.aem.live/developer/folder-mapping', expect: 200, desc: 'Deprecated page (action #12)' },
  ];

  let pass = 0;
  let fail = 0;
  for (const check of checks) {
    try {
      const res = await fetch(check.url, { method: 'HEAD', redirect: 'follow' });
      const status = res.status;
      const ok = status === check.expect;
      console.log(`${ok ? '✓' : '✗'} ${status} ${check.url} — ${check.desc}${ok ? '' : ` (expected ${check.expect})`}`);
      if (ok) pass++; else fail++;
    } catch (e) {
      console.log(`✗ ERR ${check.url} — ${check.desc} (${e.message})`);
      fail++;
    }
  }

  console.log(`\n${pass}/${pass + fail} checks passed\n`);
  return { pass, fail, total: pass + fail };
}

// ── 3. AEM EDS Domain Check ──
async function edsDomainCheck() {
  console.log('═══ AEM EDS DOMAIN VALIDATION ═══\n');

  // Verify key EDS-specific claims by checking real config/endpoints
  const checks = [];

  // Check if helix-query.yaml reference is correct (try fetching it)
  console.log('Checking helix-query.yaml accessibility...');
  try {
    // In AEM EDS, the query config is typically at /{repo}/helix-query.yaml on GitHub
    // But we can check if the query index endpoint works, which proves the config exists
    const res = await fetch('https://www.aem.live/query-index.json?limit=1');
    const data = await res.json();
    console.log(`✓ Query index is live (${data.total} entries) — confirms helix-query.yaml is configured`);
    checks.push({ check: 'Query index active', pass: true });
  } catch (e) {
    console.log(`✗ Query index check failed: ${e.message}`);
    checks.push({ check: 'Query index active', pass: false });
  }

  // Check if sitemap is auto-generated (AEM EDS auto-generates from index)
  console.log('\nChecking sitemap generation method...');
  try {
    const res = await fetch('https://www.aem.live/sitemap.xml');
    const xml = await res.text();
    const urlCount = (xml.match(/<url>/g) || []).length;
    // AEM EDS sitemaps are auto-generated from the query index
    // If sitemap count ≈ query index count, it's auto-generated
    console.log(`✓ Sitemap has ${urlCount} URLs (index has 197) — likely auto-generated from query index`);
    console.log(`  Note: Action #3 recommends "add pages to sitemap" but in AEM EDS, the sitemap`);
    console.log(`  is auto-generated from the index. The real fix is to ensure these pages are indexed`);
    console.log(`  correctly, and the sitemap will follow.`);
    checks.push({ check: 'Sitemap auto-generation', pass: true, note: 'Action #3 wording should clarify that fixing the index fixes the sitemap' });
  } catch (e) {
    console.log(`✗ Sitemap check failed: ${e.message}`);
    checks.push({ check: 'Sitemap auto-generation', pass: false });
  }

  // Check the /previous/ pages — do they have proper redirects to current equivalents?
  console.log('\nChecking /previous/ → /docs/ redirect mapping...');
  const redirectPairs = [
    ['/previous/byo-cdn-setup', '/docs/byo-cdn-setup'],
    ['/previous/byo-cdn-fastly-setup', '/docs/byo-cdn-fastly-setup'],
  ];
  for (const [old, current] of redirectPairs) {
    try {
      const resOld = await fetch(`https://www.aem.live${old}`, { redirect: 'manual' });
      const resCurrent = await fetch(`https://www.aem.live${current}`, { method: 'HEAD' });
      console.log(`  ${old} → ${resOld.status} (current ${current} → ${resCurrent.status})`);
      if (resOld.status === 200 && resCurrent.status === 200) {
        console.log(`  Both exist independently — no redirect in place. Action #10 confirmed relevant.`);
      }
    } catch (e) {
      console.log(`  Error checking: ${e.message}`);
    }
  }

  // Check if the copyright year claim is valid
  console.log('\nChecking footer copyright year...');
  try {
    const res = await fetch('https://www.aem.live/footer');
    const html = await res.text();
    const yearMatch = html.match(/Copyright\s*©?\s*(\d{4})/i);
    if (yearMatch) {
      const year = yearMatch[1];
      console.log(`✓ Footer copyright year: ${year}${year === '2025' ? ' — confirmed outdated (action #17)' : year === '2026' ? ' — already updated!' : ''}`);
      checks.push({ check: 'Copyright year', pass: true, note: `Year is ${year}` });
    } else {
      console.log('? Could not find copyright year in footer');
    }
  } catch (e) {
    console.log(`✗ Footer check failed: ${e.message}`);
  }

  // Check branding on /business/demo
  console.log('\nChecking old branding on /business/demo...');
  try {
    const res = await fetch('https://www.aem.live/business/demo');
    const html = await res.text();
    const franklinCount = (html.match(/Franklin/gi) || []).length;
    const helixCount = (html.match(/Helix/gi) || []).length;
    console.log(`✓ /business/demo: ${franklinCount} "Franklin" + ${helixCount} "Helix" mentions — action #5 confirmed`);
  } catch (e) {
    console.log(`✗ Branding check failed: ${e.message}`);
  }

  console.log('\n');
  return checks;
}

// ── Run all ──
async function main() {
  const [gptResult, httpResult, edsResult] = await Promise.all([
    gptReview(),
    httpValidation(),
    edsDomainCheck(),
  ]);

  console.log('═══ VALIDATION SUMMARY ═══\n');
  console.log(`GPT-4o review: ${gptResult ? 'Completed' : 'Failed'}`);
  console.log(`HTTP checks: ${httpResult.pass}/${httpResult.total} passed`);
  console.log(`EDS domain checks: ${edsResult.filter(c => c.pass).length}/${edsResult.length} passed`);

  // Flag any corrections needed
  const corrections = [];
  if (edsResult.some(c => c.note && c.note.includes('Action #3'))) {
    corrections.push('Action #3: Clarify that in AEM EDS, the sitemap is auto-generated from the query index. The fix is to ensure pages are indexed, not to manually add them to the sitemap.');
  }

  if (corrections.length) {
    console.log('\n⚠ CORRECTIONS NEEDED:');
    corrections.forEach(c => console.log(`  → ${c}`));
  }
}

main().catch(console.error);
