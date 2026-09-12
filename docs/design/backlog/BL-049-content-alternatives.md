# BL-049: Content Alternatives

## Status

Implemented with shared Markdown validation, progressive enhancement, and
reference documentation. Machine checks cover parsing, production output,
asset and link handling, all-alternative search indexing, keyboard interaction,
independent selection, print, no-JavaScript reading, and narrow-screen layout.
The existing Markdown-construct and content-check suites also pass. Human
review of the visual treatment remains separate from these contract checks.

## Outcome

Norna supports local tabs for equivalent alternatives, such as operating
systems, package managers, programming languages, or API variants. Tabs are a
compact presentation of alternative content within an existing section. They
are not a second page-navigation system.

## Scope

Tab groups sit directly in page sections. Multiple independent groups may
appear in the same section or page; they cannot be nested in other blocks.
Each tab may contain ordinary block Markdown, including:

- paragraphs and lists
- fenced code blocks
- images and image components
- tables
- semantic callouts
- sidenotes

Each tab must not contain:

- headings from H1 through H6
- a new section
- a nested tab group
- frontmatter
- navigation definitions

Ordinary links to other pages remain allowed. If an alternative does not apply,
the author may state `Not applicable` in that tab. Norna does not infer which
alternatives ought to exist and does not warn about omitted alternatives.

## Authoring Syntax

Use explicit, nested fences so tab content can contain fenced code and other
ordinary Norna blocks without indentation-sensitive parsing:

````markdown
## Install ImageMagick

Choose an operating system:

:::: tabs

::: tab "macOS"

::: info
Homebrew is the recommended installation method.
:::

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

Rules:

- The outer block is `:::: tabs`.
- Each alternative is `::: tab "Label"`.
- Labels are required and are visible reader text.
- Labels are unique within their group.
- No public tab IDs are authored.
- The first alternative is selected by default when JavaScript is available.
- The label is not a heading and does not enter page navigation.
- A tab group has no separate title; surrounding prose provides its context.

## Rendering Contract

Without JavaScript, every alternative is rendered in document order with a
clear block label. With JavaScript, the labels become an accessible tablist and
the selected panel is shown. The implementation must provide keyboard
operation, visible focus, and correct tab/panel relationships.

Tab enters the selected button. Left and Right Arrow select automatically;
Home and End select the first and last option. Tab continues into the selected
panel. Norna generates the internal accessibility IDs. These are not an
author-controlled link API.

The choice is local to the current tab group. It is not stored, synchronized
with other groups, or encoded in the URL. Search and print output must retain
all alternatives.

## Migration Rationale

The scope covers the common need for equivalent instructions without copying a
whole document structure into hidden panels. Docusaurus and Starlight use
component-based tabs, while Material for MkDocs supports arbitrary nested tab
content. Norna deliberately keeps a smaller Markdown-native contract so page
navigation, search, print, and no-JavaScript reading remain predictable.

- [Docusaurus tabs](https://docusaurus.io/docs/markdown-features/tabs)
- [Starlight tabs](https://starlight.astro.build/components/tabs/)
- [Material for MkDocs content tabs](https://squidfunk.github.io/mkdocs-material/reference/content-tabs/)
- [VitePress code groups](https://vitepress.dev/guide/markdown#code-groups)
- [BL-098: Representative Documentation Remigration](BL-098-representative-documentation-remigration.md)

## Acceptance Criteria

- The parser accepts the syntax above and supports code fences, callouts,
  lists, images, tables, and sidenotes inside a tab.
- The parser rejects missing labels, duplicate labels, empty tabs, malformed
  closures, nested tab groups, and headings inside tabs with page and section
  context.
- A tab group with fewer than two alternatives is rejected.
- Without JavaScript, all alternatives remain readable in document order.
- With JavaScript, the implementation exposes accessible tab and panel
  semantics and supports pointer and keyboard interaction.
- Tabs do not add headings to page navigation or page contents.
- Search, print, and copied source preserve every alternative.
- Representative examples cover operating-system installation and a
  `Not applicable` alternative.

## Documentation And Review

Describe the syntax and keyboard behavior in `docs/content.md#tabs`, and record
the JavaScript boundary in `docs/client-javascript.md`. Add a live, result-first
example with matching Markdown under the public Examples page as part of
BL-083: Result-First Single-Page Examples. No general reader-navigation manual
or repeated keyboard help in each tab group is needed.
