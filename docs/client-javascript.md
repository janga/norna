# Client-Side JavaScript

Norna builds static multi-page websites. A page should not load client-side
JavaScript unless a feature on that page needs it. Ordinary page content,
responsive layout, and responsive image markup are generated ahead of time.

## Feature Contract

| Feature | Adds JavaScript | Without JavaScript |
| --- | --- | --- |
| Markdown prose and headings | No | Fully rendered. |
| Image stacks | Only on pages containing an image stack | Images, responsive sources, alt text, captions, and direct original-image links remain available. Modal inspection and persistent side captions are absent, so captions stay below their images. |
| Card lists | No | Cards and links remain available. |
| Side notes | No | CSS places notes in the margin when space permits and in the reading flow otherwise. |
| Fenced code blocks | Only on pages containing rendered code blocks, for the copy control | Code, syntax highlighting, titles, line emphasis, and sticky title bars remain available. The copy button is absent. |
| Basic page links and anchors | No | Normal links, URLs, and browser history continue to work. |
| Generated page and section navigation | When Norna needs to maintain sticky anchor offsets, close the mobile menu after a choice, or enhance tree interaction | Real page and anchor links remain usable. Native disclosure controls can still reveal their contents. |
| Focus reading | Yes, when the Display panel offers it; always with `tree` navigation | The normal navigation, breadcrumbs, and footer remain visible. |
| Current-section tracking | Yes, when a page has a right contents rail | Page and contents links remain usable, but the contents-rail marker does not follow scrolling. |
| Static search | Only on the generated search page when `search: true` | Page and section navigation remain available. Ordinary content pages load no search JavaScript. |
| Image carousel | Yes, on pages containing a carousel | The image and caption source remains in the HTML, but carousel controls and slide switching require JavaScript. Use an image stack when sequential interaction is not needed. |
| Dismissible banner | Yes, while a banner is present | The notice remains visible, but visitors cannot dismiss it or persist that choice. |
| Configured Appearance | No | CSS applies the configured Light, Dark, or operating-system preference. |
| Reader Display controls | Yes, on every page because reading width is a universal reader choice | The configured appearance and initial reading width still apply. Readers cannot change or persist a choice, and Focus reading remains off. |

The navigation, search, banner, image-stack, carousel, and reader-preference
scripts are independent. The reader-preference script is site-wide because
reading width is always available. Other scripts are included only when their
features are present: adding one code block, image stack, or carousel affects
only pages that contain that feature, while enabling search adds its script
only to `/search/`.
See
[Reader Display Controls](theme.md#reader-display-controls) and
[Focus Reading With Desktop Rails](pages.md#focus-reading-with-desktop-rails)
for their storage, defaults, and interaction contracts. See
[Current Reading Position](pages.md#current-reading-position) for the automatic
contents-rail marker.

## Choosing Static Alternatives

Prefer ordinary Markdown, image stacks, cards, and side notes when they express
the content adequately. Choose a carousel when the ability to move through a
related sequence is worth requiring its small interaction script. Enable
dismissible banners, an Appearance selector, or Focus reading only when visitors
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
