#!/usr/bin/env node
/**
 * Content Gaps Analysis for www.aem.live
 * Fetches the query index and sitemap, cross-references with navigation links,
 * and identifies content gaps, metadata issues, and structural problems.
 */

const SITE = 'https://www.aem.live';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function fetchAllLinks(url) {
  const html = await fetchText(url);
  const links = new Set();
  const regex = /href="(\/[^"]*?)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    // Normalize: remove trailing slash, remove hash fragments for path comparison
    let path = match[1].replace(/\/$/, '') || '/';
    links.add(path);
  }
  return links;
}

function parseSitemap(xml) {
  const urls = new Set();
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const url = match[1];
    const path = url.replace(SITE, '').replace(/\/$/, '') || '/';
    urls.add(path);
  }
  return urls;
}

function categorize(path) {
  if (path.startsWith('/developer/block-collection/')) return 'block-collection';
  if (path.startsWith('/developer/')) return 'developer';
  if (path.startsWith('/docs/')) return 'docs';
  if (path.startsWith('/blog/')) return 'blog';
  if (path.startsWith('/blog')) return 'blog';
  if (path.startsWith('/business/')) return 'business';
  if (path.startsWith('/tools/')) return 'tools';
  if (path.startsWith('/previous/')) return 'previous';
  if (path.startsWith('/experiments/')) return 'experiments';
  return 'other';
}

async function main() {
  console.log('Fetching query index...');
  const queryIndex = await fetchJSON(`${SITE}/query-index.json`);
  const indexEntries = queryIndex.data;
  const indexPaths = new Set(indexEntries.map(e => e.path.replace(/\/$/, '') || '/'));

  console.log(`Query index: ${indexEntries.length} entries`);

  console.log('Fetching sitemap...');
  const sitemapXml = await fetchText(`${SITE}/sitemap.xml`);
  const sitemapPaths = parseSitemap(sitemapXml);
  console.log(`Sitemap: ${sitemapPaths.size} URLs`);

  console.log('Fetching navigation links...');
  const [homeLinks, docsLinks, devLinks, gnavLinks, footerLinks] = await Promise.all([
    fetchAllLinks(`${SITE}/`),
    fetchAllLinks(`${SITE}/docs/`),
    fetchAllLinks(`${SITE}/developer`),
    fetchAllLinks(`${SITE}/gnav`),
    fetchAllLinks(`${SITE}/footer`),
  ]);

  // Combine all nav links
  const allNavLinks = new Set([...homeLinks, ...docsLinks, ...devLinks, ...gnavLinks, ...footerLinks]);

  // ── Analysis ──

  // 1. Pages in query index but NOT in sitemap
  const inIndexNotSitemap = [...indexPaths].filter(p => !sitemapPaths.has(p));

  // 2. Pages in sitemap but NOT in query index
  const inSitemapNotIndex = [...sitemapPaths].filter(p => !indexPaths.has(p));

  // 3. Navigation links that don't resolve to query index entries
  const navPathsOnly = [...allNavLinks].filter(l => !l.includes('#') && !l.includes('?'));
  const brokenNavLinks = navPathsOnly.filter(p => !indexPaths.has(p) && !indexPaths.has(p + '/'));

  // 4. Metadata quality analysis
  const defaultImage = '/default-social.png';
  const missingCustomImage = indexEntries.filter(e =>
    e.image.includes(defaultImage)
  );
  const emptyDescription = indexEntries.filter(e => !e.description || e.description.trim() === '');
  const deprecatedContent = indexEntries.filter(e => e.deprecation && e.deprecation.trim() !== '');
  const labsContent = indexEntries.filter(e => e.labs && e.labs.trim() !== '');

  // 5. Old branding references
  const oldBranding = indexEntries.filter(e =>
    (e.title + ' ' + e.description).match(/\b(Franklin|Helix|hlx\.live|hlx\.page)\b/i)
  );

  // 6. Content by category
  const categories = {};
  for (const entry of indexEntries) {
    const cat = categorize(entry.path);
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(entry);
  }

  // 7. Stale content (not modified in 12+ months)
  const now = Date.now() / 1000;
  const twelveMonthsAgo = now - (365 * 24 * 60 * 60);
  const staleContent = indexEntries
    .filter(e => parseInt(e.lastModified) < twelveMonthsAgo && parseInt(e.lastModified) > 0)
    .sort((a, b) => parseInt(a.lastModified) - parseInt(b.lastModified));

  // 8. Recently updated content (last 30 days)
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
  const recentContent = indexEntries
    .filter(e => parseInt(e.lastModified) > thirtyDaysAgo)
    .sort((a, b) => parseInt(b.lastModified) - parseInt(a.lastModified));

  // 9. Duplicate/overlapping content
  const titleMap = {};
  for (const entry of indexEntries) {
    const normalTitle = entry.title.toLowerCase().trim();
    if (!titleMap[normalTitle]) titleMap[normalTitle] = [];
    titleMap[normalTitle].push(entry.path);
  }
  const duplicateTitles = Object.entries(titleMap).filter(([, paths]) => paths.length > 1);

  // 10. Content that's in /previous/ (legacy)
  const legacyContent = indexEntries.filter(e => e.path.startsWith('/previous/'));

  // 11. Utility/fragment pages in the index (not real content)
  const fragmentPaths = indexEntries.filter(e =>
    e.path.includes('thank-you') ||
    e.path === '/gnav' ||
    e.path === '/footer' ||
    e.path === '/new-footer' ||
    e.path === '/mwp-demo' ||
    e.path.startsWith('/experiments/')
  );

  const analysis = {
    summary: {
      totalIndexEntries: indexEntries.length,
      totalSitemapUrls: sitemapPaths.size,
      totalNavLinks: allNavLinks.size,
      categoryCounts: Object.fromEntries(
        Object.entries(categories).map(([k, v]) => [k, v.length])
      ),
    },
    gaps: {
      inIndexNotSitemap,
      inSitemapNotIndex,
      brokenNavLinks,
    },
    metadata: {
      missingCustomImage: missingCustomImage.map(e => ({ path: e.path, title: e.title })),
      emptyDescription: emptyDescription.map(e => ({ path: e.path, title: e.title })),
      deprecatedContent: deprecatedContent.map(e => ({ path: e.path, title: e.title, deprecation: e.deprecation })),
      labsContent: labsContent.map(e => ({ path: e.path, title: e.title, labs: e.labs })),
    },
    quality: {
      oldBranding: oldBranding.map(e => ({ path: e.path, title: e.title, description: e.description })),
      staleContent: staleContent.map(e => ({
        path: e.path,
        title: e.title,
        lastModified: new Date(parseInt(e.lastModified) * 1000).toISOString().split('T')[0],
      })),
      recentContent: recentContent.slice(0, 20).map(e => ({
        path: e.path,
        title: e.title,
        lastModified: new Date(parseInt(e.lastModified) * 1000).toISOString().split('T')[0],
      })),
      duplicateTitles,
      legacyContent: legacyContent.map(e => ({ path: e.path, title: e.title })),
      fragmentPages: fragmentPaths.map(e => ({ path: e.path, title: e.title })),
    },
    allEntries: indexEntries.map(e => ({
      path: e.path,
      title: e.title,
      category: categorize(e.path),
      description: e.description ? e.description.substring(0, 100) : '',
      lastModified: new Date(parseInt(e.lastModified) * 1000).toISOString().split('T')[0],
      hasCustomImage: !e.image.includes(defaultImage),
      deprecated: !!(e.deprecation && e.deprecation.trim()),
      labs: e.labs || '',
    })),
  };

  // Save raw data and analysis
  const fs = await import('fs');
  fs.writeFileSync('data/aem-live/query-index.json', JSON.stringify(queryIndex, null, 2));
  fs.writeFileSync('data/aem-live/analysis.json', JSON.stringify(analysis, null, 2));

  // Print summary
  console.log('\n═══ CONTENT GAPS ANALYSIS: www.aem.live ═══\n');
  console.log(`Total pages in query index: ${analysis.summary.totalIndexEntries}`);
  console.log(`Total URLs in sitemap: ${analysis.summary.totalSitemapUrls}`);
  console.log(`Total navigation links: ${analysis.summary.totalNavLinks}`);
  console.log('\nContent by category:');
  for (const [cat, count] of Object.entries(analysis.summary.categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log(`\n⚠ Pages in index but NOT in sitemap: ${inIndexNotSitemap.length}`);
  for (const p of inIndexNotSitemap) console.log(`  ${p}`);
  console.log(`\n⚠ Pages in sitemap but NOT in index: ${inSitemapNotIndex.length}`);
  for (const p of inSitemapNotIndex) console.log(`  ${p}`);
  console.log(`\n⚠ Navigation links to non-indexed pages: ${brokenNavLinks.length}`);
  for (const p of brokenNavLinks) console.log(`  ${p}`);
  console.log(`\n📊 Metadata gaps:`);
  console.log(`  Missing custom image (using default): ${missingCustomImage.length}/${indexEntries.length}`);
  console.log(`  Empty description: ${emptyDescription.length}`);
  console.log(`  Deprecated content: ${deprecatedContent.length}`);
  console.log(`  Labs/experimental content: ${labsContent.length}`);
  console.log(`\n🔄 Content freshness:`);
  console.log(`  Stale (>12 months since update): ${staleContent.length}`);
  console.log(`  Recently updated (last 30 days): ${recentContent.length}`);
  console.log(`\n🏷️ Old branding references (Franklin/Helix/hlx): ${oldBranding.length}`);
  console.log(`📋 Duplicate titles: ${duplicateTitles.length}`);
  console.log(`🗃️ Legacy (/previous/) pages: ${legacyContent.length}`);
  console.log(`🔧 Utility/fragment pages in index: ${fragmentPaths.length}`);

  console.log('\nAnalysis saved to data/aem-live/analysis.json');
}

main().catch(console.error);
