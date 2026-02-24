# 031 — Mind Map Website Thumbnail

**Date:** 2026-02-24

## What Happened

Replaced the blue gradient circle at the center of the hub mind map with a miniature browser-window screenshot of the aem.live website. Pure CSS — no external image needed.

## The Prompt

> at the center of the mind map put a simplified screenshot of the website instead of a blue circle

## What Was Built

The hub node in `reports/hub.html` went from a 120x120px blue-to-purple gradient circle (with a lightning bolt emoji and "aem.live" label) to a 150x120px rounded rectangle styled as a tiny browser window:

- **Browser chrome** — dark toolbar with red/yellow/green traffic-light dots and a translucent URL bar showing "aem.live"
- **Navigation bar** — dark strip with small placeholder link bars (first one brighter, mimicking a logo)
- **Hero section** — dark gradient background with "Build. Author. Publish." in 8px bold white, subtitle, and a blue CTA button
- **Content blocks** — light gray strip at the bottom with three placeholder rectangles

All implemented as nested divs + CSS within the existing `.node-hub` class. ~50 lines of new CSS replacing 13 lines. The JavaScript `innerHTML` went from one line (emoji + label) to a template literal building the browser mockup structure.

The existing `transform: translate(-50%, -50%)` on `.node` keeps the slightly wider rectangle centered at the same coordinate, so edges still connect correctly.

## Process

1. Explored the hub code (CSS + JS rendering + node base class)
2. Checked existing screenshots in `reports/images/` — they're promotional illustrations (Adobe icon, conference photo), not actual website screenshots, so a CSS mockup was the right call
3. Edited the CSS in place (replaced `.node-hub` and its children)
4. Edited the JS innerHTML for the hub node
5. Verified the `.node` base class centering transform handles the size change

No iteration needed — single pass, clean edit.

## Files Changed

| File | Change |
|------|--------|
| `reports/hub.html` | Hub node CSS rewritten (circle → mini browser), JS innerHTML updated with browser mockup structure |

## Reflection

Small change, big visual impact. The blue circle was abstract — it could be anything. The browser thumbnail immediately communicates "this mind map is about a website." Every report node radiating outward now visually connects to the thing they're analyzing.

The CSS-only approach is the right one. An actual screenshot would be a fixed-size raster that gets blurry when the mind map zooms, needs to be updated if the site redesigns, and adds a network dependency. The CSS mockup scales perfectly, matches the dark aesthetic of the real aem.live site, and is self-documenting — you can read the hero text and know exactly what site this is about.

This is also a pattern that scales to Phase 2. When Blazar manages multiple experiences, each gets its own mini-thumbnail at the center of its mind map. A CSS mockup per site is trivial to generate — an LLM can produce one from a single page visit.

From the thesis perspective: even the navigation layer benefits from being LLM-driven. A traditional CMS would show a generic icon or require someone to manually upload a screenshot. Here the system knows what the managed website looks like and can represent it visually, automatically.
