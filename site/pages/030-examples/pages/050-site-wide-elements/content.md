---
page:
  description: See how Norna shares a logo, navigation, banners and footer across pages.
---

# Site-wide elements

Some visible elements belong to the complete site rather than one page. Norna
keeps their editorial content, assets, structure and visual treatment in
separate sources so that each concern has one clear owner.

[Open the complete site-wide elements demonstration](https://janga.github.io/norna/examples/feature-demos/sitewide-content/).

## Logo and navigation {#logo-and-navigation}

Norna discovers one conventionally named `logo.*` file in `site/public/`. The
homepage H1 supplies its alternative text, and an optional `logo.height` value
in `sitewide-content.yaml` adjusts its displayed height.

Page links come from the page hierarchy and navigation mode in `config.yaml`.
Their colors, corners and spacing come from the root theme. A page cannot
replace the shared logo or navigation treatment.

[Open the logo and navigation demonstration](https://janga.github.io/norna/examples/feature-demos/sitewide-content/logo-and-navigation/).

## Banners {#banners}

Banners are ordered editorial notices in `sitewide-content.yaml`. They can have
visibility dates and can be dismissed by the reader. They are shared above the
content on every page and are not sections in any page's Markdown.

[Open the banner demonstration](https://janga.github.io/norna/examples/feature-demos/sitewide-content/notices/).

## Footer {#footer}

Footer text and optional generated build information also belong in
`sitewide-content.yaml`. The footer remains consistent as readers move between
pages, while its visual treatment comes from the root theme.

[Open the footer demonstration](https://janga.github.io/norna/examples/feature-demos/sitewide-content/footer/).

## Configuration boundary {#configuration-boundary}

| Concern | Source | Page override |
| --- | --- | --- |
| Logo asset | One `site/public/logo.*` file | No |
| Logo display height, banners and footer | `sitewide-content.yaml` | No |
| Page hierarchy and navigation mode | Page directories and `config.yaml` | No |
| Shared colors, typography, corners and navigation treatment | Root `theme.yaml` | No |
| Page content | The page's `content.md` | Owned by that page |

`sitewide-content.yaml` is shared editorial content and limited display
configuration, not a replacement for `theme.yaml`. See the
[site-wide content reference](https://github.com/janga/norna/blob/main/docs/sitewide-content.md)
and [public files reference](https://github.com/janga/norna/blob/main/docs/public-files.md).
