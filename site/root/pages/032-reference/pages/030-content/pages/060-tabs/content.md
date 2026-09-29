---
page:
  description: Present short alternatives without changing the page's heading structure.
---

# Tabs

Tabs present short alternatives to the same instruction, such as installation
commands for different operating systems. Keep shared headings outside the
group so navigation does not depend on the reader's selection.

## Syntax

````md title="content.md: two command alternatives"
:::: tabs

::: tab "macOS"

```sh
brew install imagemagick
```

:::

::: tab "Windows"

```powershell
winget install ImageMagick.ImageMagick
```

:::

::::
````

The group uses four colons; each tab uses three. Close each tab before
starting the next, and close the group after the final tab. Code fences do
not close containers.

There must be at least two nonempty alternatives with unique labels. Labels
are JSON double-quoted strings: escape a quote as `\"` and backslash as `\\`.
Decoded control characters, including tabs and newlines, are invalid.

## Allowed content

Alternatives may contain paragraphs, lists, code, managed images, tables,
semantic callouts and numbered footnote references. Footnote definitions stay
outside the group. Sidenotes, headings, nested tabs, frontmatter and navigation
definitions are forbidden; ordinary links are allowed.

Groups belong directly in page content, not inside lists, blockquotes,
callouts, cards or notes. Use separate pages if alternatives need different
heading structures. When a step is inapplicable, say so in its alternative
rather than making the absence look like missing instructions. Norna does not
require all groups to have the same alternatives.

## Reader behavior

The first alternative starts selected. Groups are independent: no shared
configuration, saved choice, synchronization or public tab ID exists. Labels
are author-written text, including translated labels.

Tab enters the selected button; Left/Right Arrow select adjacent alternatives;
Home/End select the first/last. Tab then continues into the selected panel.
Focus and selection have distinct markers.

Without JavaScript and in print, all alternatives appear in order with labels
that do not create navigation headings. All alternatives are present in static
HTML for indexing. Link to the surrounding section, not to a hidden tab state.
