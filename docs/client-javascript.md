# Client-Side JavaScript

Norna builds static multi-page websites. A page should not load client-side
JavaScript unless a feature on that page needs it. Ordinary page content,
responsive layout, and responsive image markup are generated ahead of time.

## Feature Contract

| Feature | Adds JavaScript | Without JavaScript |
| --- | --- | --- |
| Markdown prose and headings | No | Fully rendered. |
| Image stacks | No | Images, responsive sources, alt text, and captions remain available. |
| Card lists | No | Cards and links remain available. |
| Side notes | No | CSS places notes in the margin when space permits and in the reading flow otherwise. |
| Basic page links and anchors | No | Normal links, URLs, and browser history continue to work. |
| Section and tree navigation enhancement | When the selected navigation needs interactive local menus or active-section behavior | Page and anchor links remain usable. Automatically opened branches, active-section tracking, and enhanced menu interaction are unavailable. |
| Image carousel | Yes, on pages containing a carousel | The image and caption source remains in the HTML, but carousel controls and slide switching require JavaScript. Use an image stack when sequential interaction is not needed. |
| Dismissible banner | Yes, while a banner is present | The notice remains visible, but visitors cannot dismiss it or persist that choice. |
| Fixed or system color mode | No | CSS applies the configured light, dark, or operating-system preference. |
| Visitor-selectable color mode | Yes, throughout a site with `readerControls.colorMode: true` | The configured default still applies, but the selector cannot apply or remember another choice. |

The navigation, banner, carousel, and color-mode scripts are independent.
Norna includes only the scripts required by the features present on the page or
enabled for the site. Enabling a color-mode selector is site-wide; adding one
carousel affects only pages that contain a carousel.

## Choosing Static Alternatives

Prefer ordinary Markdown, image stacks, cards, and side notes when they express
the content adequately. Choose a carousel when the ability to move through a
related sequence is worth requiring its small interaction script. Enable
dismissible banners or visitor-selectable color modes only when visitors need
those controls.

This is a delivery boundary, not a rule against JavaScript. Norna uses
JavaScript where it provides behavior that HTML and CSS alone do not provide
consistently, while preserving real links and readable generated markup.

## Verification

Engine contributors can run:

```sh
npm run test:client-javascript
```

The test builds representative pages and checks which feature scripts are
emitted. Update this reference and that test together when a feature's
client-side boundary changes.
