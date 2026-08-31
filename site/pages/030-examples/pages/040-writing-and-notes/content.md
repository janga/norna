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

## Sidenotes {#sidenotes}

A note reference stays with the sentence it qualifies, while the explanation
moves into the margin when enough horizontal space is available.{note-ref}

{note: This note is linked to its numbered reference. It remains part of the document immediately after the paragraph for reading-order and accessibility purposes.}

Write the reference and note in the same paragraph context:

```md
Supporting context can stay outside the main sentence.{note-ref}

{note: The supporting explanation belongs here.}
```

Each paragraph supports one paired reference and note. `content:check` reports
missing, repeated or unclosed note syntax instead of guessing which text belongs
to which reference.

## Narrow-screen presentation {#narrow-screens}

On a wide screen, the previous note uses the available margin beside its
paragraph. On a narrow screen, it returns to the ordinary document flow below
the paragraph, so the text remains readable without horizontal scrolling.

The author does not choose left, right or inline placement. Norna and the active
preset provide one responsive treatment for the same semantic content.

## Configuration boundary {#configuration-boundary}

Note text and placement references belong to `content.md`. There is no
note-specific page option or per-note visual override. The preset coordinates
the note width, spacing, color and narrow-screen fallback with the rest of the
site.

Read the complete [note syntax reference](https://github.com/janga/norna/blob/main/docs/content.md#side-notes).
