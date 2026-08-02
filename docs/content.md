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
- `notices`: optional array of temporary or permanent notice banners.
- `sections`: required non-empty array. Defines section order, ids,
  presentation overrides, and gallery rows.

Each `sections[]` item has:

- `id`: required string matching `^[a-z0-9-]+$`. Used for anchors, navigation,
  image directories, and Markdown heading ids.
- `visible`: optional date window that controls whether the section is rendered.
- `presentation`: optional object with `backgroundColor`, `heading`, and/or
  `body` overrides.
- `gallery`: optional array, defaulting to `[]`.

Each gallery row has:

- `image`: required filename matching `^[a-z0-9][a-z0-9.-]*\.(jpe?g|png)$`.
  It must be a filename, not a path.
- `alt`: required string.
- `caption`: optional string.

## Notices

Use `notices` for short, attention-grabbing messages that link to a section or
another page. Notices render below the sticky section navigation. They are
content, so they belong in `content.md`.

```yaml
notices:
  - id: summer-exhibition-2026
    title: "Summer exhibition"
    text: "Open through 15 September."
    href: "#exhibition"
    visible:
      from: "2026-08-01"
      until: "2026-09-16"
```

Each notice has:

- `id`: required string matching `^[a-z0-9-]+$`.
- `title`: required string.
- `text`: optional string.
- `href`: required link target. Use `#section-id` to point to a section.
- `visible`: optional date window.

If a notice links to a section with `href: "#section-id"` and that section is
not currently visible, the notice is not rendered. This prevents temporary
notices from pointing to hidden temporary sections.

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
