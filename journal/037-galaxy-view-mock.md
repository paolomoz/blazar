# 037 — Galaxy View Static Mock

**Date:** 2026-02-25
**Prompt:** "generate a static mock preview of how option D would look like"

## What Happened

Following the design consultation in entry 033 where four mind map scalability options were proposed, the user asked to see Option D — the Galaxy View (constellation metaphor) — rendered as a static interactive mock.

Claude explored the full hub.html implementation (~1060 lines: manifest, radial layout algorithm, pan/zoom, SVG edges, timeline) and the shared CSS tokens, then built `reports/galaxy-preview.html` — a self-contained interactive mock showing 52 reports across 3 experiences.

### What Was Built

**`reports/galaxy-preview.html`** — standalone dark-theme galaxy visualization:

- **Dark space canvas** — `#080B16` background, 200 procedurally-placed ambient stars (seeded PRNG for deterministic layout), twinkling CSS animations
- **3 nebulae** — soft radial-gradient ellipses for experience regions (aem.live in blue, acme-store.com in green, docs.example.dev in purple), with faint uppercase labels
- **52 report stars** — 14 real aem.live reports + 38 realistic fake reports for two hypothetical experiences. Sized 8–16px by importance, colored by category, glowing box-shadows. Major stars (size 3) show labels always; smaller ones on hover only
- **Constellation lines** — SVG lines connecting related reports. Solid within experience, dashed across experiences. 30 relationship pairs defined
- **Blazar core** — pulsing white/blue dot at center with "BLAZAR" label
- **Hover cards** — each star reveals a detail card (title, summary, category badge, experience, author, date) with backdrop-blur glass effect
- **Search spotlight** — typing in search box dims non-matching stars to 8% opacity, highlights matches with animated ring
- **Category filter pills** — toggle categories on/off in header, with count badges and colored dots
- **Info panel** — top-right stats panel (52 reports, 3 experiences, 4 contributors)
- **Pan & zoom** — full drag + scroll + button controls, same pattern as existing hub
- **"DESIGN CONCEPT" badge** — floating label making it clear this is a preview

### Technical Details

- Seeded PRNG (`mulberry32`) for deterministic star and background placement — same positions on every load
- Stars placed within experience ellipses using polar coordinates with randomized angle and distance
- Each report has: id, title, category, experience, size (1–3), summary, date, user (4 different users simulated)
- No external dependencies beyond Google Fonts
- Reuses design tokens from the existing system (colors, fonts)

## No Reports Changed

This is a standalone preview file, not integrated into the hub. The existing mind map is untouched.

## Reflection

The mock makes a compelling case for Option D at scale. 52 reports fit comfortably — the nebula regions create natural visual boundaries between experiences without any explicit UI chrome. The size/brightness encoding makes high-importance reports scannable at a glance, while the hover-reveal pattern keeps the rest accessible without clutter.

The dark theme is a significant departure from the light report design system. It works for the galaxy metaphor but raises a question: does the hub become a separate visual world from the reports it links to? The transition from dark galaxy to bright report could be jarring or it could feel like "entering" a document from a command center. Worth testing with real users.

The search spotlight interaction — dimming non-matches instead of hiding them — preserves spatial context while focusing attention. This is the key insight: at scale, *filtering should reduce noise, not remove context*. You still see the shape of the galaxy; you just see which stars match your query.

The multi-user dimension (4 simulated contributors) surfaces naturally in the hover cards. No special UI was needed — the author is just another metadata field on each star. But at hundreds of users, this would need its own filter mechanism.

**Thesis check:** The galaxy view is the most "product-like" artifact so far. It's not just a report or a tool — it's a navigation surface designed for a multi-user, multi-experience system. Traditional CMS platforms solve this with folder trees and search pages. The galaxy solves it with spatial memory and progressive disclosure. Whether it's better depends on whether users develop spatial intuition for their report universe — something only real usage can answer.
