---
page:
  description: Add numbered citations and endnotes, reuse a definition and return to references in tabs.
---

# Footnotes

A numbered footnote puts supporting material at the end of the page. Use it
for citations or longer context. Use a [sidenote](/reference/content/sidenotes/)
for one short explanation that should accompany a paragraph.

## Syntax and result

```md title="content.md: a numbered footnote"
The same source files produce the published site.[^build]

[^build]: Keep source files in Git so the site can be rebuilt.
```

The same source files produce the published site.[^build]

[^build]: Keep source files in Git so the site can be rebuilt.

The name connects reference and definition; readers see a generated number.
The same definition may be referenced more than once. Definitions can contain
links and indented continuation lines and may appear later in the source.
They must stay at page top level, outside containers.

## Numbering and return links

Numbers follow source-reference order across the whole page, including hidden
tab alternatives, without gaps caused by sidenotes. References may occur in
tables, tabs and callouts. Each occurrence has its own return destination.

Returning to a reference in a tab reveals that alternative before restoring
focus. Without JavaScript every tab alternative is already visible. Reference
and return links work without JavaScript and use localized generated labels.

Missing or duplicate definitions are errors; unused definitions warn. The
lowercase `margin:` name prefix is reserved for Norna's sidenotes; use other
names for numbered footnotes.
