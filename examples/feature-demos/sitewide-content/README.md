# Sitewide content

This feature demo shows content and logo display settings shared by every page: a
convention-based logo, browser and touch icons, a sharing image, site navigation,
dismissible banners and a footer with build information. It also includes a
declared demonstration verification file.

[Live demo](https://janga.github.io/norna/examples/feature-demos/sitewide-content/)
|
[View source](https://github.com/janga/norna/tree/main/examples/feature-demos/sitewide-content)

Run it from the repository root with:

```sh
node bin/norna.mjs --site-dir examples/feature-demos/sitewide-content/site dev:local
```

Move between the pages to verify that the same sitewide elements remain in
place. Banner dismissals are stored locally in the browser.

Inspect the tab icon and the files linked from **Logo and navigation**. The
sharing title and description come from each page; `public/social-image.png`
is reused across the site. The verification file contains demonstration text,
not a real service token.

The favicon and social-image master reuse the logo's frame symbol. The wordmark
uses a midtone brown so it remains visible in Light and Dark appearance.
To regenerate the social image and 180px touch icon, and refresh the logo and
social-image copies used in Examples, run:

```sh
node examples/feature-demos/sitewide-content/assets/render-assets.mjs
```

This uses Chromium from the repository's Playwright installation to render
`assets/social-image.svg` and `site/public/favicon.svg`. Norna publishes the
resulting PNGs unchanged; the asset script is an authoring tool for this demo.

<!-- norna-image-provenance:
image: site/public/logo.svg
source: AI-assisted, hand-authored SVG
prompt: Create a compact horizontal logo named Shared Frame. Use a simple
overlapping-frame symbol, midtone brown text, one muted red accent, a transparent
background and no external assets.
-->
