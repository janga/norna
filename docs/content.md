# Content

`site/content.md` is the homepage page file for a Norna site. It contains page
metadata in frontmatter and the homepage content in Markdown.

Route pages use the same page model in
`site/routes/<NNN-route-id>/content.md`. See [Routes](routes.md) for the
route-specific rules.

Site-wide visual defaults belong in [Theme](theme.md). Typography profiles and
overrides are described in [Typography](typography.md). Technical site settings
belong in [Configuration](configuration.md).

## Page Frontmatter

The Astro content schema validates these top-level fields in page files:

- `title`: required string. Rendered as the document title.
- `description`: required string. Rendered as the meta description.
- `navigation`: optional page navigation metadata. See [Routes](routes.md).
- `sections`: optional section metadata keyed by section id.

Minimal homepage:

```md
---
title: My Site
description: A small Norna site.
---

## Intro {#intro}

Text...
```

## Sections

Markdown level 2 headings define the page sections and their order:

```md
## About {#about}

...

## Work {#work}

...

## Contact {#contact}

...
```

Every section heading must have an explicit id:

```md
## Work {#work}
```

The id must match `^[a-z0-9-]+$`. It is used for anchors, navigation, image
directories, and optional section metadata. The visible section navigation
label comes from the Markdown heading text.

Markdown section content starts at the level 2 heading and continues until the
next level 2 heading. `###` and `####` headings are body subheadings within the
current section, not new sections.

## Section Metadata

Use `sections` only when a section needs structured metadata that is not
naturally expressed by Markdown. Currently this is date-based visibility.

```yaml
sections:
  work:
    visible:
      from: "2026-08-01"
      until: "2026-09-16"
```

See [Temporary Sections](#temporary-sections) for visibility semantics.

Each `sections.<section-id>` key must match a Markdown heading id in the same
page file:

```md
## Work {#work}
```

Do not list sections in frontmatter just to define order. Section order comes
from the Markdown heading order.

## Norna Blocks

Norna-managed local images and cards are written in Markdown fenced blocks at
the point where they should appear in the section. Markdown determines
placement: move the fenced block in the page file to move the rendered image,
carousel, or card list.

Use `norna-image-stack` for one or more stacked images:

````md
```norna-image-stack
- image: work.jpg
  alt: A woven artwork on a white wall.
  caption: Work in progress.
```
````

Use `norna-image-carousel` for a carousel:

````md
```norna-image-carousel
- image: first.jpg
  alt: First image.
  caption: First caption.
- image: second.jpg
  alt: Second image.
  caption: Second caption.
```
````

Use `norna-card-list` for a list of compact cards. Cards can include text,
managed images, links, and optional badge text:

````md
```norna-card-list
layout: image-top
flow: grid
size: m
width: normal

- title: Adopt
  text: Give a dog a new home.
  image: adopt.svg
  link: /adopt/
  badge-text: Recommended
- title: Foster
  text: Help for a shorter period.
  image: foster.svg
```
````

Card-list options:

- `layout`: `image-top`, `image-left`, or `image-right`.
- `flow`: `grid` or `stack`.
- `size`: `s`, `m`, `l`, or `xl`.
- `width`: `text`, `narrow`, `normal`, or `wide`.

Each card starts with `- title: Card title`. Card fields use two spaces of
indentation. Supported fields are `text`, `image`, `link`, and `badge-text`.
Each card must include at least one of `text`, `image`, or `link`.

Each image entry supports:

- `image`: required filename matching
  `^[a-z0-9][a-z0-9.-]*\.(jpe?g|png|svg)$`.
  It must be a filename, not a path.
- `alt`: optional alt text. If omitted, Norna renders an empty alt attribute.
- `caption`: optional caption.

Start every image entry in image stacks and carousels with
`- image: filename.jpg`. Optional fields use two spaces of indentation:

````md
```norna-image-stack
- image: filename.jpg
  alt: Optional alt text.
  caption: Optional caption.
```
````

Use three or more matching backticks or tildes for fenced blocks. If you need
to document a Norna image block inside another Markdown code sample, make the
outer fence longer than the inner fence:

````md
````
```norna-image-stack
- image: filename.jpg
```
````
````

`content:check` warns when carousel images have different aspect ratios. Exact
matching proportions are recommended because mixed proportions can make the
layout move while the user changes slides.

SVG files are allowed in image stacks and carousels. When an SVG has a
`viewBox` or numeric `width` and `height`, Norna uses that ratio in the same
layout logic as raster images. SVG files without an intrinsic aspect ratio are
rendered directly, but carousel usage produces a warning because stable slide
sizing is less predictable.

## Image Files

Homepage images live under:

```text
site/images/<section-id>/
```

Route images live under:

```text
site/routes/<NNN-route-id>/images/<section-id>/
```

Image references in Norna managed image blocks use only the filename:

````md
```norna-image-stack
- image: portrait.jpg
```
````

If `portrait.jpg` is referenced from `## Team {#team}`, the expected homepage
location is `site/images/team/portrait.jpg`.

Filenames do not have to be globally unique for the site to be valid. Automatic
sync only moves files when the filename identifies exactly one source candidate
across the site's page and route image roots. If more than one candidate
exists, Norna reports the ambiguity instead of guessing.

## Markdown Images

Markdown image syntax is allowed for external images and public static assets:

```md
![External image](https://example.com/image.jpg)
![Public asset](/favicon.svg)
```

Relative local Markdown images such as `![Portrait](portrait.jpg)` are not
managed by Norna. Use `norna-image-stack`, `norna-image-carousel`, or
`norna-card-list` for local site images that should be validated, processed and
synced.

## Temporary Sections

Use `sections.<section-id>.visible` for sections that should be rendered only
during a date window:

```yaml
sections:
  exhibition:
    visible:
      from: "2026-08-01"
      until: "2026-09-16"
```

`from` is inclusive. `until` is exclusive. With the example above, the section
is visible from 2026-08-01 through 2026-09-15 and hidden again on 2026-09-16.

Both `from` and `until` use `YYYY-MM-DD`. Either value may be omitted, but a
`visible` object must contain at least one of them.

Hidden sections are omitted from the rendered HTML and sticky navigation. They
remain in the page file, and `content:check` still validates their matching
Markdown headings and image references.

The current date is evaluated at dev/build time. Set `NORNA_TODAY` to preview
or test a specific date:

```sh
NORNA_TODAY=2026-08-15 npm run norna:build
```

## Markdown Text

Use ordinary Markdown for emphasis and structure:

```md
This sentence contains **important text** and *emphasised text*.
```

Norna intentionally does not support arbitrary inline color or style classes.
Deprecated syntax such as `[highlighted text]{.yellow}` is rejected by
`content:check`. Keep the route visually coherent through its `theme.yaml`
instead of styling individual phrases.

### Side Notes

Add one numbered side note to a paragraph by placing `{note-ref}` where its
reference number should appear, then write the matching note on its own line
immediately after the paragraph:

```md
Norna keeps the page source readable.{note-ref}

{note: The note appears in the margin when enough horizontal space is available.}
```

Longer notes may wrap across lines and end with `}` on its own line:

```md
Norna keeps the page source readable.{note-ref}

{note:
The note may contain a longer explanation when the extra context is useful.
}
```

On wide screens Norna places the note in the reading margin. On narrower
screens it remains in the normal reading flow. A paragraph may contain one
note pair; both `{note-ref}` and `{note: ...}` are required. `content:check`
reports missing, repeated, nested, or unpaired note syntax.

## Validation And Sync

Run:

```sh
npm run norna:content:check
```

This checks section heading ids, section metadata, duplicate image names,
missing image files, misplaced referenced images, duplicate image references,
invalid Norna blocks, unreferenced images, removed inline style syntax,
Markdown image references to unmanaged local files, and common frontmatter
indentation and structure mistakes.

Frontmatter uses YAML indentation. Use ordinary spaces, not tabs or
non-breaking spaces. `content:check` reports a focused error when indentation is
invalid, when a key is indented under a line that already has a value, or when a
known nested key appears at the top level:

```yaml
sections:
  intro:
    visible:
      from: "2026-08-01"
```

Top-level page frontmatter may contain only `title`, `description`,
`navigation`, and `sections`. Visual settings belong in the root or route-local
`theme.yaml`.

Run:

```sh
npm run norna:sync
```

This moves referenced image files into the section directory shown by the
Markdown placement. It prompts before writing unless `--yes` is passed.

`content:sync` is intentionally conservative. It only moves a file when the
filename identifies exactly one matching source candidate across the site's
page and route image roots, and when the move will not break another reference.
If the intended move is ambiguous, rename or move the file manually and run
`content:check` again.

Duplicate filenames are allowed when files already live where their Markdown
references expect them. Automatic relocation only requires site-wide filename
uniqueness for the file being moved.

When `content:sync` needs to move an image between the homepage and a route, or
between two routes, the Git working tree must be clean before the write. This
keeps cross-route sync easy to roll back. `content:check` only reports issues
and does not require a clean working tree.
