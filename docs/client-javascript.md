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
| Expandable page navigation | When the selected navigation needs interactive local menus | Page and anchor links remain usable, but branches do not receive enhanced open and close behavior. |
| Collapsible desktop tree | Yes, with `tree` navigation | The tree remains visible and usable; its inactive hide/show control is omitted. |
| Image carousel | Yes, on pages containing a carousel | The image and caption source remains in the HTML, but carousel controls and slide switching require JavaScript. Use an image stack when sequential interaction is not needed. |
| Dismissible banner | Yes, while a banner is present | The notice remains visible, but visitors cannot dismiss it or persist that choice. |
| Fixed or system color mode | No | CSS applies the configured light, dark, or operating-system preference. |
| Reader Display controls | Yes, throughout a site with any `readerControls` field enabled | Configured color mode and reading width still apply. Readers cannot change or persist a choice, and focus reading remains off. |

The navigation, banner, carousel, and Display-preference scripts are independent.
Norna includes only the scripts required by the features present on the page or
enabled for the site. Enabling any Display control is site-wide; adding one
carousel affects only pages that contain a carousel. See
[Reader Display Controls](theme.md#reader-display-controls) and
[Collapsible Desktop Tree](pages.md#collapsible-desktop-tree) for their storage,
defaults, and interaction contracts.

## Choosing Static Alternatives

Prefer ordinary Markdown, image stacks, cards, and side notes when they express
the content adequately. Choose a carousel when the ability to move through a
related sequence is worth requiring its small interaction script. Enable
dismissible banners or reader Display choices only when visitors need those
controls.

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
