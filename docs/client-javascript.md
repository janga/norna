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
| Generated page and section navigation | When Norna needs to maintain sticky anchor offsets, close the mobile menu after a choice, or enhance tree interaction | Real page and anchor links remain usable. Native disclosure controls can still reveal their contents. |
| Collapsible desktop tree | Yes, with `tree` navigation | The tree remains visible and usable; its inactive hide/show control is omitted. |
| Current-section tracking | Yes, when `navigation.sectionTracking` is enabled and the site uses `tree` navigation | The tree remains usable, but its current-section marker does not follow scrolling. |
| Image carousel | Yes, on pages containing a carousel | The image and caption source remains in the HTML, but carousel controls and slide switching require JavaScript. Use an image stack when sequential interaction is not needed. |
| Dismissible banner | Yes, while a banner is present | The notice remains visible, but visitors cannot dismiss it or persist that choice. |
| Fixed or system color mode | No | CSS applies the configured light, dark, or operating-system preference. |
| Reader Display controls | Yes, on every page because reading width is a universal reader choice | The configured color mode and initial reading width still apply. Readers cannot change or persist a choice, and focus reading remains off. |

The navigation, tree-visibility, banner, carousel, and reader-preference
scripts are independent. The reader-preference script is site-wide because
reading width is always available. Other scripts are included only when their
features are present: adding one carousel affects only pages that contain a
carousel. See
[Reader Display Controls](theme.md#reader-display-controls) and
[Collapsible Desktop Tree](pages.md#collapsible-desktop-tree) for their storage,
defaults, and interaction contracts. See
[`navigation.sectionTracking`](configuration.md#navigationsectiontracking) for
the optional current-section marker.

## Choosing Static Alternatives

Prefer ordinary Markdown, image stacks, cards, and side notes when they express
the content adequately. Choose a carousel when the ability to move through a
related sequence is worth requiring its small interaction script. Enable
dismissible banners, color-mode selection, or focus reading only when visitors
need those controls. Reading width remains part of every site's base reader
contract.

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
