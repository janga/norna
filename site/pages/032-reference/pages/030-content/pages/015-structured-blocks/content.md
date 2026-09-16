---
page:
  description: Use the shared YAML rules for image stacks, carousels and card lists.
---

# Structured block syntax

Image stacks, image carousels and card lists are fenced Markdown blocks
containing YAML. The fence name chooses the block; the `items` list supplies
its entries. Moving the whole fence moves the rendered block.

````md title="content.md: settings beside items, fields inside each item"
```card-list
flow: stack
items:
  - title: Preview
    text: Review the page before publishing it.
  - title: Publish
    text: Build and upload the checked site.
```
````

## YAML rules

Use spaces for indentation and YAML 1.2 Core values. Text fields require
strings: quote values such as `title: "2026"`, `link: "#contact"` or
`caption: "Opening hours: 10:00 to 16:00"` when YAML would interpret them
differently. Norna does not turn numbers or booleans into text.

Omit unused fields. `caption:` is null, not an empty string, and is invalid.
Only image `alt: ""` explicitly accepts an empty string; other supplied text
must not be empty or whitespace-only.

Captions and card `text` may use folded (`>-`) or literal (`|-`) scalars:

```yaml title="An image entry excerpt with a folded caption"
items:
  - image: workspace.jpg
    caption: >-
      The writing workspace,
      ready for the next edit.
```

Folded lines form a paragraph; literal scalars preserve line breaks, which
remain visible. These fields are plain text, not Markdown. Titles, filenames,
URLs, badges and settings must decode to single-line strings.

## Validation boundaries

Each block is one mapping. Duplicate keys, unknown fields, incorrect types,
extra YAML documents, anchors, aliases, explicit tags and merge keys are errors.
Stack/card lists need at least one item; carousels need at least two.

Use matching fences of three or more backticks or tildes. An outer fence for
a literal example must be longer than the inner one. The empty `page-list`
block is different: it accepts no YAML settings or items.

See [image fields](/reference/content/images/), [card fields](/reference/content/cards/)
and [child-page lists](/reference/content/child-lists/) for their contracts.
These are Norna extensions, not instructions to a general Markdown renderer.
