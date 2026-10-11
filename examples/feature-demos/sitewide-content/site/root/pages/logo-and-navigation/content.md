---
page:
  description: See how a convention-based logo and page-title navigation work across a Norna site.
navigation:
  order: 1000
---

# Logo and navigation
The logo is discovered from `public/logo.svg`. The homepage Markdown H1
provides its alt text, and an optional top-level `logo` setting in
`site-config/shared-content.yaml` can adjust its displayed height.

The logo is a separate home link without a section menu. The homepage remains
the first ordinary navigation item and exposes its sections like any page.

## Navigation context {#navigation}

The page links come from the site's page structure. The shared logo returns to
Home, while the active page is indicated in the same navigation row.

## Browser and home-screen icons

The tab uses the overlapping-frame symbol from `public/favicon.svg`.
The supplied `public/apple-touch-icon.png` is a 180 × 180 image for devices
that use a touch icon when adding a site to the home screen. It has its own
background, so its appearance does not depend on the site's Light or Dark mode.

[Open the favicon](/_norna/shared/favicon.svg) or
[open the touch icon](/_norna/shared/apple-touch-icon.png).

## Link previews

Every content page in this demo shares `public/social-image.png`:

![Shared Frame sharing image: Sitewide Content, one identity across every page.](/_norna/shared/social-image.png)

The page's H1 supplies the preview title. Its `page.description` supplies the
description. The service where the link is shared decides the final layout.
Norna supplies this information automatically when the file is present.
