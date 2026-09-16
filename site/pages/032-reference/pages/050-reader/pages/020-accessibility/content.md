---
page:
  description: Check what remains usable without JavaScript and where engine presentation safeguards end and author responsibility begins.
---

# JavaScript and accessibility

Norna generates static HTML for content, links and responsive images. Browser
scripts add reader controls and interaction. The engine's presentation
safeguards apply to supported components and themes; they do not certify the
accessibility of an authored site.

## Without JavaScript

| Feature | Available without scripts | Added by scripts |
| --- | --- | --- |
| Prose, headings, cards and page lists | Rendered content and links | None required |
| Page links and anchors | Native links and browser history | Sticky-offset coordination and compact-menu closing |
| Categories and aliases | HTML redirects or generated destination lists | Ordinary site enhancements are independent |
| Navigation | Page/heading links and native disclosures | Active-section tracking, automatic outline following and enhanced tree controls |
| Image stacks | Responsive images, alt text, captions and original-image links | Modal inspection and persistent side captions |
| Image carousels | Source images and captions remain in HTML | Slide switching, controls and touch dragging |
| Sidenotes | CSS margin/inline placement and reference/return links | Matching-note highlight |
| Numbered footnotes | References and return links | Focus restoration and revealing a referenced tab |
| Tabs | Every labelled alternative in source order | Selection and keyboard tab switching |
| Details | Native open/close disclosure | None required |
| Tables | Semantic table, authored order and native horizontal scroll | Measured width, custom scrollbars, sorting and synchronized overflow headings |
| Code | Syntax highlighting, titles, line emphasis, horizontal scroll and sticky titles | Copy button and measured width expansion |
| Search | Home link and ordinary navigation | Results, query interface and remembered return destination |
| Banners | Visible notice | Dismissal and its persistence |
| Display | Configured appearance and initial prose width | Reader overrides and Focus reading |

Feature scripts are included when needed. Display is universal; the search
return helper is present when search is enabled, while the search engine and
index load on the search page. Tables, code, tabs, notes and managed-media
enhancements load on pages containing those features. All tab alternatives
also remain visible in print.

## Color, focus and controls

The engine validates used palette/component color pairs in both appearances.
Normal and secondary text target at least `5:1` contrast; meaningful control
boundaries and focus indicators at least `3:1`. Keyboard focus uses a shared
two-color indicator with an inner width of at least `2px`. Current, selected,
warning and focus states use cues in addition to color.

Engine controls use at least a `24 × 24` CSS-pixel target, with a `44px` scale
for primary small-screen controls where layout permits. Reduced-motion
preferences remove decorative transitions, smooth scrolling and carousel
movement. Forced-colors mode uses system colors and visible boundaries.
System Appearance follows `prefers-color-scheme`.

## Reading and reflow

The heading hierarchy remains ordered and prose has an `80ch` ceiling. Ordinary
content is designed to reflow at a `320px` CSS viewport and with text resized
to `200%`, including increased line, paragraph, letter and word spacing.
Two-dimensional content such as code and tables may scroll within its own
frame. Managed images retain their intrinsic proportions.

As available space shrinks, navigation becomes compact, sidenotes return to
the reading flow and side captions move below images. After such an automatic
fallback, further narrowing does not return supporting content to a peripheral
region merely because a rail disappears. Widening or the reader's explicit
Focus reading choice may restore the richer placement.

These constraints do not prevent ordinary fluid image sizing, card reflow or
tables using vacant space. See [tables](/reference/content/tables/) and
[image presentation](/reference/configuration/images/) for their precise
enhancement boundaries.

## Author responsibilities

Authors still need meaningful headings and link labels, suitable alt text for
informative images, useful captions and explanations, and content that does
not depend only on color or shape. Inspect third-party files under `public/`
and embedded HTML separately. Validate source, then review representative
pages with keyboard navigation, zoom and the devices readers need.
