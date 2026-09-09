---
page:
  description: See how Markdown hierarchy and linked Norna notes work across wide and narrow screens.
---

# Writing and notes

Markdown remains the main writing format. Norna uses its heading hierarchy to
organise pages and supports both nearby explanations and page-level reference
notes without replacing ordinary Markdown.

## Markdown hierarchy {#markdown-hierarchy}

Every page has one H1. H2 headings begin navigable sections, while H3 headings
structure the text inside the current section:

```md
# Page title

## A section

### A subsection
```

The same headings provide document semantics and navigation. Authors do not
maintain a separate section list.

## Internal links {#internal-links}

Use ordinary Markdown links for another page, a heading on this page, or a
static file in `site/public/`:

```md
[Theme examples](/examples/themes-and-overrides/)
[Root overrides](/examples/themes-and-overrides/#root-overrides)
[Sidenotes on this page](#sidenotes)
[Crawler rules](/robots.txt)
```

Write site-relative paths without the deployment base path. Norna adds that
path when it renders the site. `content:check` reports a missing page, heading,
or public file before the site is built. It checks the same destinations in
card links.

The complete [internal-link reference](https://github.com/janga/norna/blob/main/docs/content.md#internal-links)
also covers relative paths, navigation categories, aliases, and external URLs.

## Code examples {#code-examples}

Use an ordinary fenced Markdown block. A quoted title identifies its context,
and a line selector after the title emphasizes the lines that need attention:

```sh title="Terminal" {2}
npm run norna:check
npm run norna:build
```

The opening fence places `title="Terminal"` after the language and `{2}` after
the title. A selector can contain individual lines and inclusive ranges, such
as `{2,4-6}`. The title and line emphasis are rendered without JavaScript.

With JavaScript available, the block also receives an accessible copy button.
It copies only the code, not the title or line selector, and announces success
or failure. Without JavaScript, the same code remains readable and selectable
without the button. See the complete [code-block reference](https://github.com/janga/norna/blob/main/docs/content.md#code-blocks)
for metadata order, accepted selectors, and validation errors.

On an example longer than the viewport, the title remains below the sticky
site header until the reader reaches the end of that code block. This preserves
the filename and copy control without adding a toolbar to untitled examples.

## Tables {#tables}

Use an ordinary Markdown table for structured comparisons:

| Content | Source | Norna behavior |
| --- | --- | --- |
| Prose | Markdown | Reflows within the selected reading width. |
| Detailed image | `image-stack` | Links to the original and may open in an inspector. |
| Wide data | Markdown table | Uses vacant page space before adding internal scrolling. |

A small table stays with the prose. A wider top-level table first uses vacant
space beside the text, then the complete available page canvas. Only a table
that still does not fit scrolls inside its own keyboard-reachable frame. It
never widens the complete document or overlaps visible navigation and notes.
Long tables keep their column headings below the sticky site header. When a
table also scrolls horizontally, an enhanced page synchronizes a visual copy
of those headings while preserving the original table as the only semantic
representation.
See the [Markdown-table reference](https://github.com/janga/norna/blob/main/docs/content.md#tables)
for the layout order, bounded-container rule, and no-JavaScript fallback.

## Sidenotes {#sidenotes}

A note reference stays with the sentence it qualifies, while the explanation
moves into the margin when enough horizontal space is available.{note-ref}

{note: This note is linked to its numbered reference. It remains part of the document immediately after the paragraph for reading-order and accessibility purposes.}

Several paragraphs may each have their own note, and the notes retain the same
order as their references.{note-ref}

{note: This second note makes the spacing and sequence between neighboring notes visible.}

Changing the reading width may leave too little room for the complete note
lane.{note-ref}

{note: When the margin is too narrow, this note returns to the ordinary reading flow instead of overlapping other content.}

Write the reference and note in the same paragraph context:

```md
Supporting context can stay outside the main sentence.{note-ref}

{note: The supporting explanation belongs here.}
```

Each paragraph supports one paired reference and note. `content:check` reports
missing, repeated or unclosed note syntax instead of guessing which text belongs
to which reference.

## Reference footnotes {#reference-footnotes}

Use a standard Markdown footnote when supporting material belongs at the end of
the page rather than beside one paragraph.[^standard]

```md
The source supports this claim.[^source]

[^source]: The full citation or explanation belongs here.
```

Footnotes may be referenced repeatedly and may contain links.[^standard] Norna
numbers them, links each reference to its definition, and provides return links
without requiring JavaScript.

[^standard]: This endnote uses interoperable GFM syntax. Read the complete
    [reference-footnote documentation](https://github.com/janga/norna/blob/main/docs/content.md#reference-footnotes).

## Narrow-screen presentation {#narrow-screens}

On a wide screen, the preceding notes use the available margin beside their
paragraphs. On a narrow screen, they return to the ordinary document flow below
the paragraph, so the text remains readable without horizontal scrolling.

The automatic fallback moves in one direction as the viewport narrows. A note
that has returned to the text does not jump back into the margin when Page
contents moves into the page tree. Focus reading may restore the margin because
the reader has explicitly removed the persistent navigation rails.

The author does not choose left, right or inline placement. Norna and the active
preset provide one responsive treatment for the same semantic content.

## Configuration boundary {#configuration-boundary}

Note text and references belong to `content.md`. There is no note-specific page
option or per-note visual override. The preset coordinates side-note width,
spacing, color and narrow-screen fallback with the rest of the site; reference
footnotes use the page's ordinary endnote treatment.

Read the complete [note syntax reference](https://github.com/janga/norna/blob/main/docs/content.md#side-notes).
The [source for this page](https://github.com/janga/norna/blob/main/site/pages/030-examples/pages/040-writing-and-notes/content.md)
shows the same note next to its surrounding Markdown.
