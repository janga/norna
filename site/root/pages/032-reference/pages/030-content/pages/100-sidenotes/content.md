---
page:
  description: Add one or more short notes to a paragraph and understand where they appear.
---

# Sidenotes

A sidenote adds supporting text beside a paragraph when there is room, or
after it on a narrower layout. Keep essential instructions in the paragraph
itself so it remains understandable without reading the note.

## Add a sidenote

In `content.md`, place `[^margin:name]` where the reader should find the note's
reference. Write the note on a separate line with the same name and a colon:

```md title="content.md: one sidenote" {1,3}
Keep the site's source files in Git.[^margin:generated]

[^margin:generated]: Generated output can be rebuilt from those source files.
```

Keep the site's source files in Git.[^margin:generated]

[^margin:generated]: Generated output can be rebuilt from those source files.

The name `generated` connects the reference to its note; readers see a letter
instead. Norna assigns letters in reading order: `a` to `z`, then `aa`, `ab`,
and so on.

The `margin:` prefix is a Norna extension to Markdown footnote syntax. Other
renderers that support footnotes may show an ordinary footnote instead.

## Several notes in one paragraph

Give each note its own name:

```md title="content.md: two sidenotes" {1}
Review the text[^margin:wording] and its images[^margin:alt] before publishing.

[^margin:wording]: Check unfamiliar terms where they first appear.
[^margin:alt]: Describe the image's purpose in its alt text, not just its appearance.
```

Review the text[^margin:wording] and its images[^margin:alt] before publishing.

[^margin:wording]: Check unfamiliar terms where they first appear.
[^margin:alt]: Describe the image's purpose in its alt text, not just its appearance.

The notes appear in reference order. The next paragraph starts below both
the paragraph and its notes, so long notes can leave extra space after a
short paragraph.

## Names and note text

Use a nonempty name without spaces, with the same spelling in the reference
and definition. Write `margin:` in lowercase. Each note needs exactly one
definition and can be referenced only once on the page.

Definitions may go anywhere outside other blocks, including at the end of
`content.md`. Their position in the source does not affect where the notes
appear. To continue a note on another source line, indent that line by four
spaces; keep the text in a single paragraph.

Note text may contain emphasis, bold text, links and inline code. It cannot
contain a second paragraph, headings, lists, images, tables, code blocks or
other notes. For longer or repeatedly referenced material, use an ordinary
numbered footnote instead.

Names are matched without regard to letter case, except for the reserved
lowercase prefix. Different Unicode encodings are not treated as equivalent;
copy the same name rather than retyping visually identical variants.

## Where references are allowed

Put sidenote references in ordinary body paragraphs only. They are not
allowed in headings, lists, tables, tabs, callouts, collapsible details blocks,
image captions, alt text or card fields. Definitions must also stay outside
those blocks.

`norna content:check` reports missing definitions, repeated references and
invalid note content as errors. A definition with no reference produces a
warning. These restrictions apply at every screen size.

## Placement and reading

Norna uses the margin when the reading layout has room for the note without
colliding with content or navigation. Otherwise, it places the note after
its paragraph. Printed notes also appear after their paragraphs.

As a window narrows, a note that has moved below its paragraph stays there,
even if navigation then frees some margin space. Selecting **Focus reading**
in Display hides persistent navigation and can make room for margin notes
again. Reading width also affects the available space.

Hover over a reference, or focus it with the keyboard, to highlight its note.
Follow the reference to jump to the note; follow the note's letter to return.
The links and text work without JavaScript; highlighting requires JavaScript.
