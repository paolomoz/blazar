#!/usr/bin/env node
/**
 * Image Quality & AI Improvement Analysis for www.aem.live
 * Inventories all images via HEAD requests, selects 5 diverse candidates,
 * uses Gemini 3 Pro for analysis + improved image generation.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { GoogleGenAI } from '@google/genai';

// ── Load .env manually (no dotenv dependency) ──
const envPath = new URL('../.env', import.meta.url).pathname;
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
}

const SITE = 'https://www.aem.live';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
if (!GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY not set in .env');

const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

// ── Directories ──
mkdirSync('data/aem-live', { recursive: true });
mkdirSync('reports/images', { recursive: true });

// ────────────────────────────────────────────
// Phase A: Load data
// ────────────────────────────────────────────
console.log('Loading query index...');
const queryIndex = JSON.parse(readFileSync('data/aem-live/query-index.json', 'utf8'));
const entries = queryIndex.data;
console.log(`Total entries: ${entries.length}`);

const DEFAULT_IMAGE = '/default-social.png';
const defaultEntries = entries.filter(e => e.image.includes(DEFAULT_IMAGE));
const customEntries = entries.filter(e => !e.image.includes(DEFAULT_IMAGE));
console.log(`Custom images: ${customEntries.length}, Default fallback: ${defaultEntries.length}`);

// ────────────────────────────────────────────
// Phase B: Inventory via HEAD requests
// ────────────────────────────────────────────
console.log('\nInventorying custom image URLs via HEAD requests...');

async function headImage(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return {
      url,
      status: res.status,
      contentType: res.headers.get('content-type') || 'unknown',
      contentLength: parseInt(res.headers.get('content-length') || '0', 10),
      ok: res.ok,
    };
  } catch (err) {
    return { url, status: 0, contentType: 'error', contentLength: 0, ok: false, error: err.message };
  }
}

// Resolve image URL to absolute
function resolveImageUrl(imageField) {
  if (imageField.startsWith('http')) return imageField;
  return `${SITE}${imageField}`;
}

// HEAD all custom images in batches of 20
const imageHeads = [];
const customUrls = customEntries.map(e => resolveImageUrl(e.image));
const BATCH_SIZE = 20;
for (let i = 0; i < customUrls.length; i += BATCH_SIZE) {
  const batch = customUrls.slice(i, i + BATCH_SIZE);
  const results = await Promise.all(batch.map(headImage));
  imageHeads.push(...results);
  process.stdout.write(`  ${Math.min(i + BATCH_SIZE, customUrls.length)}/${customUrls.length}\r`);
}
console.log(`\nHEAD requests complete. ${imageHeads.filter(h => h.ok).length}/${imageHeads.length} OK`);

// Build format/size distribution
const formatDist = {};
const sizeBuckets = { '<50KB': 0, '50-200KB': 0, '200KB-1MB': 0, '>1MB': 0 };
for (const h of imageHeads) {
  if (!h.ok) continue;
  const fmt = h.contentType.split('/')[1] || 'unknown';
  formatDist[fmt] = (formatDist[fmt] || 0) + 1;
  const kb = h.contentLength / 1024;
  if (kb < 50) sizeBuckets['<50KB']++;
  else if (kb < 200) sizeBuckets['50-200KB']++;
  else if (kb < 1024) sizeBuckets['200KB-1MB']++;
  else sizeBuckets['>1MB']++;
}

console.log('Format distribution:', formatDist);
console.log('Size distribution:', sizeBuckets);

// ────────────────────────────────────────────
// Phase C: Select 5 candidates
// ────────────────────────────────────────────
console.log('\nSelecting 5 diverse candidates...');

function findEntry(path) {
  return entries.find(e => e.path === path);
}

// Find a recent blog entry with a custom image
const blogEntries = customEntries
  .filter(e => e.path.startsWith('/blog/') && e.path !== '/blog')
  .sort((a, b) => parseInt(b.lastModified) - parseInt(a.lastModified));

const candidates = [
  {
    slug: 'homepage-hero',
    category: 'Homepage/Hero',
    reason: 'High-traffic landing page using generic fallback — pure generation opportunity',
    entry: findEntry('/'),
    type: 'generation',
  },
  {
    slug: 'docs-authoring',
    category: 'Documentation Screenshot',
    reason: 'Core authoring docs page with screenshot — edit/improve opportunity',
    entry: findEntry('/docs/authoring'),
    type: 'improvement',
  },
  {
    slug: 'docs-architecture',
    category: 'Architecture Diagram',
    reason: 'Architecture overview with technical diagram — edit/improve for clarity and brand',
    entry: findEntry('/docs/architecture'),
    type: 'improvement',
  },
  {
    slug: 'blog-recent',
    category: 'Blog Post Header',
    reason: 'Recent blog post with header image — edit/improve for brand consistency',
    entry: blogEntries[0],
    type: 'improvement',
  },
  {
    slug: 'developer-hub',
    category: 'Developer Hub OG',
    reason: 'Developer landing page using generic fallback — pure generation opportunity',
    entry: findEntry('/developer'),
    type: 'generation',
  },
];

for (const c of candidates) {
  console.log(`  ${c.slug}: ${c.entry.path} (${c.type}) — ${c.entry.title}`);
}

// ────────────────────────────────────────────
// Phase D: Fetch full images for candidates
// ────────────────────────────────────────────
console.log('\nFetching candidate images...');

async function fetchImageBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const ct = res.headers.get('content-type') || 'image/png';
  const buf = Buffer.from(await res.arrayBuffer());
  return { buffer: buf, mimeType: ct, size: buf.length };
}

for (const c of candidates) {
  const imgUrl = resolveImageUrl(c.entry.image);
  try {
    const { buffer, mimeType, size } = await fetchImageBuffer(imgUrl);
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'webp';
    const outPath = `reports/images/original-${c.slug}.${ext}`;
    writeFileSync(outPath, buffer);
    c.originalPath = outPath;
    c.originalMimeType = mimeType;
    c.originalSize = size;
    c.originalBase64 = buffer.toString('base64');
    c.originalExt = ext;
    console.log(`  Saved ${outPath} (${(size / 1024).toFixed(1)} KB, ${mimeType})`);
  } catch (err) {
    console.error(`  ERROR fetching image for ${c.slug}: ${err.message}`);
    c.originalPath = null;
    c.originalBase64 = null;
  }
}

// ────────────────────────────────────────────
// Phase E: Gemini Analysis Pass
// ────────────────────────────────────────────
console.log('\nRunning Gemini analysis pass...');

const BRAND_CONTEXT = `
You are analyzing images for www.aem.live, Adobe's Edge Delivery Services documentation site.

Brand identity:
- Primary color: #3B63FB (Spectrum blue), accent: Adobe red #EB1000 (sparingly)
- Typography: Source Sans Pro / Adobe Clean
- Tone: Technical yet approachable, developer-focused, performance-obsessed
- Key themes: Speed ("blazing fast"), simplicity ("frictionless"), modern web standards
- Visual style: Clean, minimal, technical precision — not flashy marketing

Current state issues:
- ~95% images have empty alt text (accessibility F grade)
- 45% pages use generic /default-social.png fallback for OG image
- Screenshots lack annotations (arrows, highlights, callouts)
- No branded illustrations or diagrams
- Infrastructure is A+ (Media Bus, WebP, responsive) but visual content quality is low
`;

for (const c of candidates) {
  console.log(`  Analyzing: ${c.slug}...`);
  try {
    const contents = [];
    contents.push({
      text: `${BRAND_CONTEXT}

Analyze this image from the page "${c.entry.title}" (${SITE}${c.entry.path}).
Page description: ${c.entry.description || 'No description available'}
Image type: ${c.type === 'generation' ? 'This page uses the generic default-social.png fallback. The image shown IS the fallback.' : 'This is the current custom image for this page.'}

Respond with ONLY valid JSON (no markdown formatting, no code blocks):
{
  "brandAlignmentScore": <1-10>,
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "strengths": ["<strength 1>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "idealDescription": "<what the perfect image for this page would look like>",
  "suggestedAltText": "<proper alt text for the current image>"
}`,
    });

    if (c.originalBase64) {
      contents.push({
        inlineData: {
          mimeType: c.originalMimeType,
          data: c.originalBase64,
        },
      });
    }

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: contents }],
    });

    const text = result.candidates[0].content.parts[0].text;
    // Strip markdown code fences if present
    const cleanJson = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    c.analysis = JSON.parse(cleanJson);
    console.log(`    Score: ${c.analysis.brandAlignmentScore}/10`);
  } catch (err) {
    console.error(`    ERROR: ${err.message}`);
    c.analysis = {
      brandAlignmentScore: 0,
      weaknesses: ['Analysis failed'],
      strengths: [],
      recommendations: ['Retry analysis'],
      idealDescription: 'Could not analyze',
      suggestedAltText: '',
    };
  }
}

// ────────────────────────────────────────────
// Phase F: Gemini Generation Pass
// ────────────────────────────────────────────
console.log('\nRunning Gemini image generation pass...');

for (const c of candidates) {
  console.log(`  Generating improved image for: ${c.slug}...`);
  try {
    const prompt = c.type === 'generation'
      ? `Generate an abstract, conceptual illustration for a page about "${c.entry.title}" on www.aem.live (Adobe's Edge Delivery Services site).

${BRAND_CONTEXT}

Page concept: ${c.entry.description || c.entry.title}

STRICT RULES — you must follow these:
- NEVER include any text, titles, subtitles, labels, or words in the image. Pure visual only.
- Keep it abstract and conceptual — geometric shapes, gradients, subtle patterns.
- Do NOT render any UI elements, browser windows, code editors, or fake interfaces.
- Minimalist: fewer elements is better. Whitespace is your friend.
- Use brand colors: primary blue #3B63FB, dark navy backgrounds, subtle Adobe red accents.
- 16:9 aspect ratio.
- Think: abstract tech art, not illustration. Convey the concept through shape and color, not literal depiction.

Generate this image.`
      : `Improve this image while preserving its level of complexity and minimalism.

${BRAND_CONTEXT}

Page: "${c.entry.title}" on www.aem.live
Current weaknesses: ${c.analysis.weaknesses.join(', ')}

STRICT RULES — you must follow these:
- NEVER add any text, titles, subtitles, labels, or words to the image.
- If the original is minimal/simple, the improved version must stay equally minimal. Do NOT add complexity.
- Do NOT render detailed UI mockups, fake app interfaces, or realistic-looking feature screens — these confuse users into thinking they are real product features.
- Keep it conceptual and abstract where the original is conceptual.
- Improve only: brand color alignment (shift toward #3B63FB Spectrum blue), visual polish, composition.
- If it's a photo, you may enhance color grading and composition but keep the photographic style.
- 16:9 aspect ratio.

Generate the improved image.`;

    const parts = [{ text: prompt }];
    if (c.originalBase64 && c.type === 'improvement') {
      parts.push({
        inlineData: {
          mimeType: c.originalMimeType,
          data: c.originalBase64,
        },
      });
    }

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    // Extract image from response
    let imageFound = false;
    let generationText = '';
    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData) {
        const imgBuf = Buffer.from(part.inlineData.data, 'base64');
        const ext = part.inlineData.mimeType.includes('png') ? 'png' : 'jpg';
        const outPath = `reports/images/improved-${c.slug}.${ext}`;
        writeFileSync(outPath, imgBuf);
        c.improvedPath = outPath;
        c.improvedSize = imgBuf.length;
        c.improvedMimeType = part.inlineData.mimeType;
        imageFound = true;
        console.log(`    Saved ${outPath} (${(imgBuf.length / 1024).toFixed(1)} KB)`);
      } else if (part.text) {
        generationText += part.text;
      }
    }
    c.generationNotes = generationText.substring(0, 500);

    if (!imageFound) {
      console.log(`    No image in response. Text: ${generationText.substring(0, 200)}`);
      c.improvedPath = null;
    }
  } catch (err) {
    console.error(`    ERROR: ${err.message}`);
    c.improvedPath = null;
    c.generationNotes = `Generation failed: ${err.message}`;
  }
}

// ────────────────────────────────────────────
// Phase G: Save analysis JSON
// ────────────────────────────────────────────
console.log('\nSaving analysis JSON...');

const output = {
  generatedAt: new Date().toISOString(),
  site: SITE,
  summary: {
    totalEntries: entries.length,
    customImages: customEntries.length,
    defaultFallback: defaultEntries.length,
    formatDistribution: formatDist,
    sizeDistribution: sizeBuckets,
    headRequestsOk: imageHeads.filter(h => h.ok).length,
    headRequestsFailed: imageHeads.filter(h => !h.ok).length,
  },
  candidates: candidates.map(c => ({
    slug: c.slug,
    category: c.category,
    type: c.type,
    reason: c.reason,
    page: {
      path: c.entry.path,
      title: c.entry.title,
      description: c.entry.description,
      imageUrl: c.entry.image,
    },
    originalImage: c.originalPath ? {
      path: c.originalPath,
      size: c.originalSize,
      mimeType: c.originalMimeType,
    } : null,
    analysis: c.analysis,
    improvedImage: c.improvedPath ? {
      path: c.improvedPath,
      size: c.improvedSize,
      mimeType: c.improvedMimeType,
    } : null,
    generationNotes: c.generationNotes || '',
  })),
};

writeFileSync('data/aem-live/image-quality.json', JSON.stringify(output, null, 2));
console.log('Saved data/aem-live/image-quality.json');

// ── Summary ──
console.log('\n═══ IMAGE QUALITY ANALYSIS COMPLETE ═══\n');
console.log(`Total images: ${entries.length} (${customEntries.length} custom, ${defaultEntries.length} default)`);
console.log(`HEAD checks: ${imageHeads.filter(h => h.ok).length} OK, ${imageHeads.filter(h => !h.ok).length} failed`);
console.log(`\nCandidates analyzed:`);
for (const c of candidates) {
  const score = c.analysis?.brandAlignmentScore || '?';
  const improved = c.improvedPath ? 'generated' : 'FAILED';
  console.log(`  ${c.slug}: score ${score}/10, improved: ${improved}`);
}
console.log('\nDone.');
