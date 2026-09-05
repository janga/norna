# Python Markdown

Material for MkDocs supports a large number of [Python Markdown] extensions,
which is part of what makes it so attractive for technical writing. Following
is a list of all supported extensions, linking to the relevant sections of the
reference for which features they need to be enabled.

## Supported extensions {#supported-extensions}

### Abbreviations {#abbreviations}

The [Abbreviations] extension adds the ability to add a small tooltip to an
element, by wrapping it with an `abbr` tag. Only plain text (no markup) is
supported. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - abbr
```

No configuration options are available. See reference for usage:

- [Adding abbreviations]
- [Adding a glossary]

### Admonition {#admonition}

The [Admonition] extension adds support for admonitions, more commonly known as
_call-outs_, which can be defined in Markdown by using a simple syntax. Enable
it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - admonition
```

No configuration options are available. See reference for usage:

- [Adding admonitions]
- [Changing the title]
- [Removing the title]
- [Supported types]

### Attribute Lists {#attribute-lists}

The [Attribute Lists] extension allows to add HTML attributes and CSS classes
to almost every Markdown inline- and block-level
element with a special syntax. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - attr_list
```

No configuration options are available. See reference for usage:

- [Using annotations]
- [Using grids]
- [Adding buttons]
- [Adding tooltips]
- [Using icons with colors]
- [Using icons with animations]
- [Image alignment]
- [Image lazy-loading]

### Definition Lists {#definition-lists}

The [Definition Lists] extension adds the ability to add definition lists (more
commonly known as [description lists] – `dl` in HTML) via Markdown to a
document. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - def_list
```

No configuration options are available. See reference for usage:

- [Using definition lists]

### Footnotes {#footnotes}

The [Footnotes] extension allows to define inline footnotes, which are then
rendered below all Markdown content of a document. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - footnotes
```

No configuration options are supported. See reference for usage:

- [Adding footnote references]
- [Adding footnote content]

### Markdown in HTML {#markdown-in-html}

The [Markdown in HTML] extension allows for writing Markdown inside of HTML,
which is useful for wrapping Markdown content with custom elements. Enable it
via `mkdocs.yml`:

```yaml
markdown_extensions:
  - md_in_html
```

> By default, Markdown ignores any content within a raw HTML block-level
> element. With the `md_in_html` extension enabled, the content of a raw HTML
> block-level element can be parsed as Markdown by including a `markdown`
> attribute on the opening tag. The `markdown` attribute will be stripped from
> the output, while all other attributes will be preserved.

No configuration options are available. See reference for usage:

- [Using annotations]
- [Using grids]
- [Image captions]

### Table of Contents {#table-of-contents}

The [Table of Contents] extension automatically generates a table of contents
from a document, which Material for MkDocs will render as part of the resulting
page. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - toc:
      permalink: true
```

The following configuration options are supported:

:     –
    This option sets the title of the table of contents in the right navigation
    sidebar, which is normally automatically sourced from the translations for
    the [site language] as set in `mkdocs.yml`:

```yaml
    markdown_extensions:
      - toc:
          title: On this page
```

:    This option adds an anchor link
    containing the paragraph symbol `¶` or another custom symbol at the end of
    each headline, exactly like on the page you're currently viewing, which
    Material for MkDocs will make appear on hover:

    === "¶"

```yaml
        markdown_extensions:
          - toc:
              permalink: true
```

    === "⚓︎"

```yaml
        markdown_extensions:
          - toc:
              permalink: ⚓︎
```

:    This option sets the
    title of the anchor link which is shown on hover and read by screen readers.
    For accessibility reasons, it might be beneficial to change it to a more
    discernable name, stating that the anchor links to the section itself:

```yaml
    markdown_extensions:
      - toc:
          permalink_title: Anchor link to this section for reference
```

:    This option allows for
    customization of the slug function. For some languages, the default may not
    produce good and readable identifiers – consider using another slug function
    like for example those from Python Markdown Extensions:

    === "Unicode"

```yaml
        markdown_extensions:
          - toc:
              slugify: !!python/object/apply:pymdownx.slugs.slugify
                kwds:
                  case: lower
```

    === "Unicode, case-sensitive"

```yaml
        markdown_extensions:
          - toc:
              slugify: !!python/object/apply:pymdownx.slugs.slugify {}
```

:    Define the range of levels to be
    included in the table of contents. This may be useful for project
    documentation with deeply structured headings to decrease the length of the
    table of contents, or to remove the table of contents altogether:

    === "Hide levels 4-6"

```yaml
        markdown_extensions:
          - toc:
              toc_depth: 3
```

    === "Hide table of contents"

```yaml
        markdown_extensions:
          - toc:
              toc_depth: 0
```

The other configuration options of this extension are not officially supported
by Material for MkDocs, which is why they may yield unexpected results. Use
them at your own risk.

### Tables {#tables}

The [Tables] extension adds the ability to create tables in Markdown by using a
simple syntax. Enable it via `mkdocs.yml` (albeit it should be enabled by
default):

```yaml
markdown_extensions:
  - tables
```

No configuration options are available. See reference for usage:

- [Using data tables]
- [Column alignment]

## Superseded extensions {#superseded-extensions}

The following [Python Markdown] extensions are not (or might not be) supported
anymore, and are therefore not recommended for use. Instead, the alternatives
should be considered.

### Fenced Code Blocks {#fenced-code-blocks}

Superseded by [SuperFences]. This extension might still work, but the
[SuperFences] extension is superior in many ways, as it allows for arbitrary
nesting, and is therefore recommended.

### CodeHilite {#codehilite}

Superseded by [Highlight]. Support for CodeHilite was dropped in
, as [Highlight] has a better integration with other
essential extensions like [SuperFences] and [InlineHilite].
