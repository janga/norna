# Content

`site/content.md` is the editable page file for the homepage of a
`cli-gallery` site. Optional route pages use
`site/routes/<route-folder>/route-content.md` with the same page frontmatter and
Markdown section model.

Site-wide visual defaults may live in `site/theme.md`. Technical site
configuration lives in `site/config.mjs`.

## Frontmatter Schema

The Astro content schema validates these top-level fields in page files:

- `title`: required string. Rendered as the document title.
- `description`: required string. Rendered as the meta description.
- `slug`: optional route URL slug. It is ignored on the homepage. If omitted on
  a route page, the route folder name is used.
- `navigation`: optional page navigation metadata.
- `presentation`: optional page-level presentation overrides.
- `frame`: optional page-level frame color source.
- `sections`: required non-empty array. Defines section order, ids,
  presentation overrides, and gallery rows.

`navigation` may contain:

- `include`: optional boolean. Defaults to `true`.
- `label`: optional string. Defaults to `title`.
- `order`: optional integer. Defaults to `0` for the homepage and `100` for
  route pages.

Each `sections[]` item has:

- `id`: required string matching `^[a-z0-9-]+$`. Used for anchors, navigation,
  image directories, and Markdown heading ids.
- `visible`: optional date window that controls whether the section is rendered.
- `presentation`: optional object with `backgroundColor`, `textColor`, and/or
  `typography` overrides.
- `gallery`: optional array, defaulting to `[]`.

Each gallery row has:

- `image`: required filename matching `^[a-z0-9][a-z0-9.-]*\.(jpe?g|png)$`.
  It must be a filename, not a path.
- `alt`: required string.
- `caption`: optional string.

## Routes

The homepage is always `site/content.md` and builds to `/`.

Add a first-level route by creating:

```text
site/routes/about/route-content.md
```

Minimal route page:

```md
---
title: About
description: About this gallery.
navigation:
  label: About
  order: 20
sections:
  - id: intro
---

## Intro {#intro}

Text...
```

The example above builds to `/about/`. If `slug` is omitted, the route folder
name is used. If `slug` is set, it must use lowercase letters, numbers, and
hyphens. Keep the route folder and `slug` aligned unless you intentionally need
a different URL.

Route images live under the route:

```text
site/routes/about/images/intro/image.jpg
```

Image references in route frontmatter still use only the filename.

### Navigation Scope

Current route navigation is intended for small sites. This guidance may change
as route support matures, but the present model is:

- A single-page site should normally use only page navigation between sections.
- A small multi-page site may use site navigation between routes plus page
  navigation between sections on the current page.
- If a site needs many routes, deeply nested routes, or several navigation
  levels, it has probably outgrown the current sticky-navigation model and may
  need a different site structure or navigation system.

## Site Theme

`site/theme.md` optionally defines site-wide visual defaults. It uses
frontmatter and does not need a Markdown body. If the file is missing, built-in
engine defaults are used.

Starter sites include a marked comment block such as
`norna:start theme-help` / `norna:end theme-help`. The block is
only explorable help text; YAML comments do not affect rendering. The active
configuration is the uncommented YAML below it.

```yaml
---
# norna:start theme-help
# Site-wide visual defaults. Remove a value to use the engine default.
# norna:end theme-help

presentation:
  backgroundColor: "#000000"
  textColor: "#f7f4ee"
  inlineStyles:
    highlight:
      color: "#ffd84d"
  typography:
    preset: quiet-gallery
frame:
  colors: presentation
---
```

`presentation.backgroundColor` and `presentation.textColor` are optional quoted
hex colors in `#rgb`, `#rrggbb`, or `#rrggbbaa` form.

`presentation.inlineStyles` defines named inline text styles that can be used
from Markdown. Inline style names must match `^[a-z][a-z0-9-]*$`. Each style
currently supports a required `color` field using the same quoted hex color
format as `textColor`.

`frame.colors` controls the sticky navigation and footer colors:

- `presentation`: use the resolved presentation colors for this level.
- `theme`: use the site theme frame colors. This is useful in page-level
  frontmatter.
- explicit colors:

```yaml
frame:
  colors:
    backgroundColor: "#111111"
    textColor: "#eeeeee"
```

## Temporary Sections

Use `sections[].visible` for sections that should be rendered only during a
date window:

```yaml
sections:
  - id: exhibition
    visible:
      from: "2026-08-01"
      until: "2026-09-16"
    gallery: []
```

`from` is inclusive. `until` is exclusive. With the example above, the section
is visible from 2026-08-01 through 2026-09-15 and hidden again on 2026-09-16.

Both `from` and `until` use `YYYY-MM-DD`. Either value may be omitted, but a
`visible` object must contain at least one of them.

Hidden sections are omitted from the rendered HTML and sticky navigation. They
remain in `content.md`, and `content:check` still validates their matching
Markdown headings and gallery image references.

The current date is evaluated at dev/build time. Set `NORNA_TODAY` to
preview or test a specific date:

```sh
NORNA_TODAY=2026-08-15 npm run gallery:build
```

## Presentation

Site-wide presentation belongs in `site/theme.md`. Page-level presentation in
`site/content.md` is always an override on top of the theme. Section-specific
presentation belongs under `sections[].presentation`.

If a page omits `presentation`, it uses the theme presentation unchanged. If a
section omits `presentation`, it uses the resolved page presentation.

```yaml
presentation:
  typography:
    overrides:
      body:
        paragraphSpacing: 1em
```

### Typography Presets

Typographic presentation is configured through presets with optional overrides:

```yaml
presentation:
  typography:
    preset: quiet-gallery
    overrides:
      body:
        paragraphSpacing: 0.8em
```

Available presets:

- `quiet-gallery`: the default for image-led art and portfolio sites. Text is
  restrained and supports the images without dominating the page.
- `compact-gallery`: tighter typography for many sections, many images, or
  short information blocks.
- `text-forward`: more generous body text for pages where longer text carries
  more of the experience.
- `statement`: stronger type for introductions, first sections, and short
  programmatic statements. Use it sparingly, usually as a section override.

The normal place to choose a site-wide preset is `site/theme.md`. If theme
typography is omitted, `quiet-gallery` is used. A page-level
`presentation.typography.preset` changes the typographic base for the page. A
section-level `sections[].presentation.typography.preset` changes the
typographic base for that section.

Use this command to inspect the exact preset values shipped with the installed
engine:

```sh
cli-gallery typography:presets
```

Use this command to inspect the effective values for the selected site after
presets and overrides have been applied:

```sh
cli-gallery typography:show
```

The typographic roles are:

- `heading`: section headings.
- `body`: Markdown body text inside sections.
- `caption`: gallery captions.

Allowed alignment values are `left`, `center`, and `right`. Alignment can be
responsive:

```yaml
align:
  desktop: left
  mobile: center
```

Allowed size values are `small`, `medium`, `large`, and `xlarge`.
`lineHeight` is a unitless number from `1` through `3`. `spacing` and
`paragraphSpacing` are CSS lengths such as `0`, `0.8em`, `1rem`, or `12px`.

Supported override fields:

- `heading.align`, `heading.size`, `heading.lineHeight`, `heading.spacing`
- `body.align`, `body.size`, `body.lineHeight`, `body.paragraphSpacing`
- `caption.align`, `caption.size`, `caption.lineHeight`, `caption.spacing`

Use `site/theme.md` `presentation.inlineStyles` for named inline text styles
that can be applied inside Markdown:

```yaml
presentation:
  inlineStyles:
    highlight:
      color: "#ffd84d"
```

Apply an inline style in Markdown with `[text]{.style-name}`:

```md
This sentence contains [highlighted text]{.highlight}.
```

`content:check` fails if Markdown uses an inline style that is not defined in
`site/theme.md` `presentation.inlineStyles`.

`sections[].presentation` contains only section-specific differences:

```yaml
sections:
  - id: intro
    presentation:
      backgroundColor: "#161616"
      textColor: "#ffffff"
      typography:
        preset: statement
        overrides:
          body:
            paragraphSpacing: 0.7em
```

If a section sets `typography.preset`, that section starts from that preset. If
a section only sets `typography.overrides`, it keeps the resolved page preset
and changes only the specified values.

Centered text uses narrower text widths. Left- or right-aligned heading and body
text use the calculated gallery layout width so text edges line up with gallery
images after layout gutters and gallery limits are applied.
Configured section backgrounds render as full-width horizontal bands while the
section content keeps the normal page and gallery widths. The top spacing
before the first heading, the spacing between sections, and the spacing after
the final section are part of the section background. The sticky section
navigation row and footer use the resolved frame colors, not section-specific
presentation.
Configured section text colors apply to section headings, Markdown text,
Markdown subheadings, and gallery captions. Links keep the global accent color.

## Markdown Sections

Every frontmatter section must have a matching level 2 Markdown heading with an
explicit id:

```md
## Work {#work}

Introductory text.
```

Keep these values aligned:

- the frontmatter `sections[].id`
- the Markdown heading id
- the source image directory `site/images/<section-id>/`

The visible navigation label comes from the Markdown heading text, not from the
frontmatter id.

## Validation And Sync

Run:

```sh
npm run gallery:content:check
```

This checks section order and heading ids, duplicate image names, missing image
files, misplaced referenced images, duplicate gallery references, invalid image
references, unreferenced images, undefined inline styles, and common
frontmatter indentation and structure mistakes.

Frontmatter uses YAML indentation. Use ordinary spaces, not tabs or
non-breaking spaces. `content:check` reports a focused error when indentation is
invalid, when a key is indented under a line that already has a value, or when
a known nested key such as `gallery` appears at the top level:

```yaml
typography:
  preset: quiet-gallery
  overrides:
    body:
      paragraphSpacing: 0.8em
```

Top-level page frontmatter may contain only `title`, `description`,
`presentation`, `frame`, and `sections`. A `gallery` key belongs under one
`sections[]` item:

```yaml
sections:
  - id: work
    gallery: []
```

Run:

```sh
npm run gallery:sync
```

This rewrites Markdown sections into frontmatter order and moves referenced
image files into the directory matching their section. It prompts before
writing unless `--yes` is passed.
