# 010 — RUM Bundler API Research

**Date:** 2026-02-24
**Prompt:** "I need to understand how to fetch RUM (Real User Monitoring) bundle data from AEM Edge Delivery Services. The domain key is available."

## What Happened

User needed the exact API contract for fetching RUM bundle data — URL patterns, authentication, response format. This is the prerequisite for moving from static content analysis to traffic-weighted, data-driven insights (as envisioned in journal 005).

### Research Process

1. **Documentation pages returned 404s** — `/docs/rum-bundler` doesn't exist. `/developer/rum` exists but only covers client-side telemetry instrumentation, not the bundler read API.

2. **GitHub source was the real documentation.** Fetched README, source code, type definitions, test utilities, and deployment config from `adobe/helix-rum-bundler`. Key files:
   - `src/api/bundles.js` — request handler, auth, downsampling logic
   - `src/support/PathInfo.js` — URL path parsing
   - `src/types.d.ts` — TypeScript interfaces for RUMBundle, RUMEvent
   - `params.json` — revealed the CDN endpoint: `https://bundles.aem.page`

3. **Endpoint discovery was a hunt.** Tried `rum.hlx.page` (that's the collector, not bundler), `helix-pages.anywhere.run/helix-services/` (404, wrong package), `helix-pages.anywhere.run/helix3/` (401 — function exists but AWS authorizer blocks direct access). Finally found `CDN_ENDPOINT` in `params.json`: **`https://bundles.aem.page`**.

4. **Verified all URL patterns** with curl — all returned 403 "invalid domainkey param" (correct behavior with a fake key), confirming the endpoint and paths are valid.

## Findings

### Base URL
```
https://bundles.aem.page
```

### Bundle Endpoints (GET, requires domainkey)

| Granularity | URL Pattern | Notes |
|------------|-------------|-------|
| Hourly | `/bundles/{domain}/{year}/{month}/{day}/{hour}?domainkey={key}` | Hour is 0-23 UTC |
| Daily | `/bundles/{domain}/{year}/{month}/{day}?domainkey={key}` | Fans out to 24 hourly files |
| Monthly | `/bundles/{domain}/{year}/{month}?domainkey={key}` | Fans out to daily via CDN |

### Authentication
- **Bundles endpoint:** `domainkey` passed as query parameter
- **Domainkey/Orgs endpoints:** Bearer token in `Authorization` header (admin/org-level auth)
- Domainkey can have an admin identifier suffix (6-segment format: `key-HASH`)
- Value `revoked` means key was explicitly revoked

### Query Parameters
- `domainkey` (required) — domain-specific access key
- `forceAll=true` (optional) — skip downsampling, return all bundles

### Response Format
```json
{
  "rumBundles": [
    {
      "id": "foo",
      "time": "2024-01-01T01:02:03+00:00",
      "timeSlot": "2024-01-01T01:00:00+00:00",
      "url": "https://www.example.com/my/path",
      "userAgent": "desktop",
      "weight": 10,
      "events": [
        {
          "checkpoint": "viewmedia",
          "timeDelta": 123,
          "target": "https://www.example.com/my/image.png",
          "source": ".my-block"
        },
        {
          "checkpoint": "cwv-lcp",
          "value": 1.1
        }
      ]
    }
  ]
}
```

### RUMBundle TypeScript Interface
```typescript
interface RUMBundle {
  id: string;
  time: string;        // ISO 8601
  timeSlot: string;    // ISO 8601, rounded to hour
  url: string;
  userAgent: string;   // "desktop", "mobile", etc.
  weight: number;      // sampling weight (typically 100)
  events: RUMEvent[];
}

interface RUMEvent {
  checkpoint: string;  // "cwv", "cwv-lcp", "cwv-cls", "cwv-inp", "viewmedia", "click", "loadresource", etc.
  timeDelta?: number;  // ms since timeSlot
  value?: number;      // metric value (e.g., LCP in seconds)
  source?: string;     // DOM selector or URL
  target?: string;     // URL or count
}
```

### Downsampling
The API applies automatic downsampling for large datasets:
- Hourly: max ~300K events (~4MB compressed)
- Daily: max ~7.5K events (~50KB compressed)
- Monthly: max ~100K events (~700KB compressed)
- Use `forceAll=true` to bypass (returns full data)

### Caching (response Cache-Control)
- Hourly: 10min while current, forever after 3h
- Daily: 1h while current, forever after 30h
- Monthly: 6h while current, forever after end-of-month + 12h

### Other Endpoints
- `GET /domainkey/{domain}` — retrieve domainkey (requires admin auth)
- `POST /domainkey/{domain}` — rotate domainkey
- `DELETE /domainkey/{domain}` — remove domainkey (makes domain public)
- `GET/POST/DELETE /orgs/{id}` — org management (superuser)

## Reflections

The fact that the official documentation page 404s while the source code is completely self-documenting is very on-brand for developer-first infrastructure. The real API spec lived in `params.json` (one line: the CDN endpoint), `PathInfo.js` (URL parsing), `bundles.js` (handler logic), and `types.d.ts` (response schema). An LLM can reconstruct the full API contract from source code faster than most developers can navigate docs — this is a genuine strength of the approach.

This unlocks the traffic-weighted analysis layer described in journal 005. Next step: fetch actual bundle data for www.aem.live and correlate with the content gap analysis.
