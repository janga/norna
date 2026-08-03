# Content

`site/content.md` is the editable content file for a `cli-gallery` site. It
contains frontmatter for site-wide content data and section definitions, followed
by Markdown section bodies.

## Frontmatter Schema

The Astro content schema validates these top-level fields:

- `title`: required string. Rendered as the document title.
- `description`: required string. Rendered as the meta description.
- `defaultPresentation`: optional object. Presentation defaults for all
  sections.
- `sections`: required non-empty array. Defines section order, ids,
  presentation overrides, and gallery rows.

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

The current date is evaluated at dev/build time. Set `CLI_GALLERY_TODAY` to
preview or test a specific date:

```sh
CLI_GALLERY_TODAY=2026-08-15 npm run gallery:build
```

## Presentation

Use `defaultPresentation` for site-wide presentation defaults. Section-specific
presentation belongs under `sections[].presentation`.

`defaultPresentation.backgroundColor` and `defaultPresentation.textColor` are
optional quoted hex colors in `#rgb`, `#rrggbb`, or `#rrggbbaa` form. If
`backgroundColor` is omitted, section backgrounds are transparent over the page
background. If `textColor` is omitted, section text uses the global site text
color.

```yaml
defaultPresentation:
  backgroundColor: "#000000"
  textColor: "#f7f4ee"
  inlineStyles:
    highlight:
      color: "#ffd84d"
  typography:
    preset: quiet-gallery
```

### Typography Presets

Typographic presentation is configured through presets with optional overrides:

```yaml
defaultPresentation:
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

If `defaultPresentation.typography` is omitted, `quiet-gallery` is used.

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

Use `defaultPresentation.inlineStyles` for named inline text styles that can be
applied inside Markdown. Inline style names must match `^[a-z][a-z0-9-]*$`.
Each style currently supports a required `color` field, using the same quoted
hex color format as `textColor`:

```yaml
defaultPresentation:
  inlineStyles:
    highlight:
      color: "#ffd84d"
```

Apply an inline style in Markdown with `[text]{.style-name}`:

```md
This sentence contains [highlighted text]{.highlight}.
```

`content:check` fails if Markdown uses an inline style that is not defined in
`defaultPresentation.inlineStyles`.

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
a section only sets `typography.overrides`, it keeps the site default preset and
changes only the specified values.

Centered text uses narrower text widths. Left- or right-aligned heading and body
text use the calculated gallery layout width so text edges line up with gallery
images after layout gutters and gallery limits are applied.
Configured section backgrounds render as full-width horizontal bands while the
section content keeps the normal page and gallery widths. The top spacing
before the first heading, the spacing between sections, and the spacing after
the final section are part of the section background. The sticky section
navigation row uses the default background and text colors, even when the active
section has section-specific overrides. The footer uses the same default
background and text colors.
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
frontmatter indentation mistakes.

Frontmatter uses YAML indentation. Use ordinary spaces, not tabs or
non-breaking spaces. `content:check` reports a focused error when indentation is
invalid or when a key is indented under a line that already has a value:

```yaml
typography:
  preset: quiet-gallery
  overrides:
    body:
      paragraphSpacing: 0.8em
```

Run:

```sh
npm run gallery:sync
```

This rewrites Markdown sections into frontmatter order and moves referenced
image files into the directory matching their section. It prompts before
writing unless `--yes` is passed.
