---
page:
  description: Choose a Norna theme preset and make a small, deliberate override when the site needs one.
---

# Choose A Theme

A theme preset gives the whole site a coordinated visual starting point. It
sets typography, spacing, colors, navigation styling, media sizing, and the
presentation of structured content such as cards. Start by choosing the preset
whose purpose is closest to the site rather than configuring each part
separately.

## Choose by purpose {#choose-by-purpose}

Norna includes four presets:

```norna-card-list
flow: grid
size: m

- title: Portfolio
  text: Choose Portfolio for image-led work, portfolios, and visual collections.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-portfolio/
- title: Documentation
  text: Choose Documentation for guides, reference material, and sustained reading.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-documentation/
- title: Project
  text: Choose Project for project or product sites that combine prose, code, cards, and images.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-project/
- title: Statement
  text: Choose Statement for concise sites that need spacious rhythm and a stronger editorial voice.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-statement/
```

The generated starter uses `project`. Keep it when the site combines several
content types and none of the more specific purposes fits better.

## Set the preset {#set-the-preset}

Open `site/theme.yaml` and set one preset:

```yaml
preset: documentation
```

Save the file while the local preview is running. The complete site updates to
use that preset. Review several real sections, images, and narrow-screen views
before deciding whether anything needs an override.

List the same choices from the Norna version installed in the project:

```sh
# Show the available presets and their intended uses
npm run norna:theme:presets
```

The [Theme explorer](https://janga.github.io/norna/examples/theme-presets/)
keeps representative content unchanged while you compare every preset and
site-wide palette.

## Override one deliberate choice {#override}

A setting beside `preset` replaces that part of the preset. For example, keep
the complete `documentation` theme but begin with the Standard rather than
Narrow reading width:

```yaml
preset: documentation
layout:
  textWidth: normal
```

Unmentioned values still come from `documentation`. Prefer the preset alone
until real content reveals a concrete reason for an override; this preserves a
coordinated result and keeps `theme.yaml` short.

See the [Theme reference](https://github.com/janga/norna/blob/main/docs/theme.md)
for every preset, accepted override, page-theme boundary, palette, and reader
Display control.

## Continue {#continue}

- [Grow your site](/getting-started/grow-your-site/) when the content needs
  more sections, pages, or a navigation category.
- [Build and publish](/getting-started/build-and-publish/) when the site is
  ready for its public URL.
