# Content

`site/pages/000-home/content.md` is the homepage file for a Norna site. Its Markdown H1 is
the page title. Optional page metadata can be added in YAML frontmatter.

Additional and nested pages use the same page model in a page directory under
`site/pages/`. See [Pages and Categories](pages.md) for the directory and
nesting rules.

Site-wide visual defaults belong in [Theme](theme.md). Typography profiles and
overrides are described in [Typography](typography.md). Technical site settings
belong in [Configuration](configuration.md).

## Page Title And Frontmatter

Every page must contain exactly one Markdown H1. It must be the first heading,
must not have a section id, and supplies the visible page title, HTML document
title, and page label in site navigation:

```md
# My Site
```

Content between the H1 and the first H2 is the page introduction. It may
contain prose and Norna blocks.

Frontmatter is optional. When present, the content schema validates these
top-level fields:

- `page`: optional page metadata.
- `navigation`: optional page-listing metadata. See
  [Pages and Categories](pages.md).

`page` contains:

- `description`: optional string. Used only as the page's HTML meta description
  for search engines, link previews, and other metadata consumers. It is not
  rendered as visible page content.

Minimal homepage without metadata:

```md
# My Site

Introductory text.

## Work {#work}

Text...
```

Homepage with a meta description:

```md
---
page:
  description: A small Norna site.
---

# My Site

Introductory text.
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

Norna derives a deterministic lowercase ASCII id from the heading text when no
explicit id is present:

```md
## Work
```

Add an explicit id when a public anchor must remain stable even if the heading
text changes:

```md
## Work {#work}
```

Automatic ids are produced by lowercasing the heading, removing accents,
transliterating common letters such as `æ` to `ae`, removing apostrophes, and
replacing other runs of characters with one hyphen. For example:

```text
Crème brûlée & tools  ->  creme-brulee-tools
```

If no ASCII id can be produced, add an explicit id. Explicit ids must contain
lowercase ASCII letters or numbers separated by single hyphens. `page-title` is
reserved by Norna.

Derived and explicit ids are used for anchors and local navigation; the visible
label still comes from the heading text. H3 headings use the same derivation.
All H2 and H3 ids must be unique within their page. If two headings resolve to
the same id, `content:check` reports the page, both headings, and an example fix
instead of guessing.

Markdown section content starts at the level 2 heading and continues until the
next level 2 heading. `###` and `####` headings are body subheadings within the
current section, not new sections.

## Norna Blocks

Norna-managed local images and cards are written in Markdown fenced blocks at
the point where they should appear in the section. Markdown determines
placement: move the fenced block in the page file to move the rendered image,
carousel, or card list.

### Image Stack

Use `norna-image-stack` for one or more stacked images:

````md
```norna-image-stack
- image: work.jpg
  alt: A woven artwork on a white wall.
  caption: Work in progress.
```
````

### Image Carousel

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

The carousel keeps each image's intrinsic proportions. Its stage is limited by
the theme's managed-image width, the available page width, and
`images.maxAvailableHeightPercent`. A portrait carousel therefore stays close
to the image instead of stretching its controls across the complete content
area; a landscape carousel may use more horizontal space. The same limits are
resolved separately for desktop and mobile.

With two or more images, Norna provides previous and next controls, a numeric
position indicator, arrow-key operation, and touch dragging. The controls
remain visible on the image stage and use colors coordinated with the active
light or dark palette. The active image's caption appears below the stage. Use
descriptive captions when the sequence needs more context than its alt text.

### Card List

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
site/pages/000-home/images/
```

Images for any page live directly under that page directory. For example:

```text
site/pages/010-guide/pages/020-installation/images/
```

Image references in Norna managed image blocks use only the filename:

````md
```norna-image-stack
- image: portrait.jpg
```
````

If `portrait.jpg` is referenced anywhere on the homepage, its expected
location is `site/pages/000-home/images/portrait.jpg`. The same file may be referenced from
more than one section on that page.

Filenames must be unique within one page's image directory, but do not have to
be globally unique across the site. Automatic sync only moves files between
page image roots when the filename identifies exactly one source candidate
across the site. If more than one candidate exists, Norna reports the
ambiguity instead of guessing.

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

## Markdown Text

Use ordinary Markdown for emphasis and structure:

```md
This sentence contains **important text** and *emphasised text*.
```

Norna intentionally does not support arbitrary inline color or style classes.
Deprecated syntax such as `[highlighted text]{.yellow}` is rejected by
`content:check`. Keep the page visually coherent through its `theme.yaml`
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

This checks section heading ids, duplicate image names,
missing image files, misplaced referenced images, duplicate image references,
invalid Norna blocks, unreferenced images, removed inline style syntax,
Markdown image references to unmanaged local files, and common frontmatter
indentation and structure mistakes.

Frontmatter uses YAML indentation. Use ordinary spaces, not tabs or
non-breaking spaces. `content:check` reports a focused error when indentation is
invalid, when a key is indented under a line that already has a value, or when a
known nested key appears at the top level:

```yaml
navigation:
  listed: false
```

Top-level page frontmatter may contain only `page` and `navigation`. Visual
settings belong in the root or page-local `theme.yaml`.

Run:

```sh
npm run norna:sync
```

This moves referenced image files into the image directory for the page that
references them. Moving a block between sections on the same page does not
move the file because all sections share the page image directory. The command
prompts before writing unless `--yes` is passed.

`content:sync` is intentionally conservative. It only moves a file when the
filename identifies exactly one matching source candidate across all page
image roots, and when the move will not break another reference.
If the intended move is ambiguous, rename or move the file manually and run
`content:check` again.

The same filename may exist in different page image directories. Automatic
relocation only requires site-wide filename uniqueness for the file being
moved.

Before writing, `content:sync` shows every planned source and destination. Each
file is moved atomically when both paths are on the same filesystem. If a move
fails, the command reports completed and remaining moves; fix the filesystem
problem and run it again. A move between different filesystems is not copied
automatically and must be completed manually using the paths in the error.

Git is recommended so an unintended content edit or image move can be restored,
but a clean working tree is not required. `content:check` only reports issues
and never moves files.
