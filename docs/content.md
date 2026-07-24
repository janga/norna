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
- `presentation`: optional object with `backgroundColor`, `heading`, and/or
  `body` overrides.
- `gallery`: optional array, defaulting to `[]`.

Each gallery row has:

- `image`: required filename matching `^[a-z0-9][a-z0-9.-]*\.(jpe?g|png)$`.
  It must be a filename, not a path.
- `alt`: required string.
- `caption`: optional string.

## Presentation

`defaultPresentation` must provide complete heading and body defaults when it is
present. `defaultPresentation.backgroundColor` and
`defaultPresentation.textColor` are optional:

```yaml
defaultPresentation:
  backgroundColor: "#000000"
  textColor: "#f7f4ee"
  heading:
    align:
      desktop: center
      mobile: center
    size: medium
  body:
    align:
      desktop: center
      mobile: left
    size: medium
```

Allowed alignment values are `left`, `center`, and `right`. Allowed size values
are `small`, `medium`, `large`, and `xlarge`.
`defaultPresentation.backgroundColor` and `defaultPresentation.textColor` must
be quoted hex colors in `#rgb`, `#rrggbb`, or `#rrggbbaa` form.
If `backgroundColor` is omitted, section backgrounds are transparent over the
page background. If `textColor` is omitted, section text uses the global site
text color.

`sections[].presentation` contains only section-specific differences:

```yaml
sections:
  - id: intro
    presentation:
      backgroundColor: "#161616"
      textColor: "#ffffff"
      heading:
        size: large
      body:
        align:
          desktop: left
          mobile: left
```

Section override alignment may specify `desktop`, `mobile`, or both. If
`defaultPresentation` is omitted, the renderer uses built-in fallbacks: the first
section heading uses `large`, later section headings use `medium`, heading text
is centered, body text is centered on desktop and left-aligned on mobile, and
body size is `medium`.

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
references, and unreferenced images.

Run:

```sh
npm run gallery:sync
```

This rewrites Markdown sections into frontmatter order and moves referenced
image files into the directory matching their section. It prompts before
writing unless `--yes` is passed.
