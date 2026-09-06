---
page:
  description: See how Markdown hierarchy and linked Norna notes work across wide and narrow screens.
---

# Writing and notes

Markdown remains the main writing format. Norna uses its heading hierarchy to
organise pages and adds a small note syntax for supporting context that should
not interrupt the main argument.

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

Use ordinary fenced Markdown for a command or source example:

```sh
npm run norna:check
```

With JavaScript available, the rendered block receives an accessible copy
button. It copies the code itself and announces success or failure. Without
JavaScript, the same code remains readable and selectable without the button.

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

## Narrow-screen presentation {#narrow-screens}

On a wide screen, the preceding notes use the available margin beside their
paragraphs. On a narrow screen, they return to the ordinary document flow below
the paragraph, so the text remains readable without horizontal scrolling.

The author does not choose left, right or inline placement. Norna and the active
preset provide one responsive treatment for the same semantic content.

## Configuration boundary {#configuration-boundary}

Note text and placement references belong to `content.md`. There is no
note-specific page option or per-note visual override. The preset coordinates
the note width, spacing, color and narrow-screen fallback with the rest of the
site.

Read the complete [note syntax reference](https://github.com/janga/norna/blob/main/docs/content.md#side-notes).
The [source for this page](https://github.com/janga/norna/blob/main/site/pages/030-examples/pages/040-writing-and-notes/content.md)
shows the same note next to its surrounding Markdown.
