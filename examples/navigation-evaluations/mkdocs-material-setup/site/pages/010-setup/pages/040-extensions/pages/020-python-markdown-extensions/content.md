# Python Markdown Extensions

<p data-source-comparison><a href="https://squidfunk.github.io/mkdocs-material/setup/extensions/python-markdown-extensions/" target="_blank" rel="noopener noreferrer">Compare with the original Material for MkDocs page (opens in a new tab)</a>.</p>

The [Python Markdown Extensions] package is an excellent collection of
additional extensions perfectly suited for advanced technical writing. Material
for MkDocs lists this package as an explicit dependency, so it's automatically
installed with a supported version.

## Supported extensions {#supported-extensions}

In general, all extensions that are part of [Python Markdown Extensions] should
work with Material for MkDocs. The following list includes all extensions that
are natively supported, meaning they work without any further adjustments.

### Arithmatex {#arithmatex}

The [Arithmatex] extension allows for rendering of block and inline block
equations and integrates seamlessly with MathJax – a library for
mathematical typesetting. Enable it via `mkdocs.yml`:

    Other libraries like [KaTeX] are also supported and can be integrated with
    some additional effort. See the [Arithmatex documentation on KaTeX] for
    further guidance, as this is beyond the scope of Material for MkDocs.

```yaml
markdown_extensions:
  - pymdownx.arithmatex:
      generic: true
```

Besides enabling the extension in `mkdocs.yml`, a MathJax configuration and
the JavaScript runtime need to be included, which can be done with a few lines
of [additional JavaScript]:

=== " `docs/javascripts/mathjax.js`"

```js
    window.MathJax = {
      tex: {
        inlineMath: [["\\(", "\\)"]],
        displayMath: [["\\[", "\\]"]],
        processEscapes: true,
        processEnvironments: true
      },
      options: {
        ignoreHtmlClass: ".*|",
        processHtmlClass: "arithmatex"
      }
    };

    document$.subscribe(() => { // (1)!
      MathJax.startup.output.clearCache()
      MathJax.typesetClear()
      MathJax.texReset()
      MathJax.typesetPromise()
    })
```

    1. This integrates MathJax with [instant loading]

=== " `mkdocs.yml`"

```yaml
    extra_javascript:
      - javascripts/mathjax.js
      - https://unpkg.com/mathjax@3/es5/tex-mml-chtml.js
```

The other configuration options of this extension are not officially supported
by Material for MkDocs, which is why they may yield unexpected results. Use
them at your own risk.

See reference for usage:

- [Using block syntax]
- [Using inline block syntax]

### BetterEm {#betterem}

The [BetterEm] extension improves the detection of Markup to emphasize text
in Markdown using special characters, i.e. for `**bold**` and `_italic_`
formatting. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.betterem
```

The configuration options of this extension are not specific to Material for
MkDocs, as they only impact the Markdown parsing stage. See the [BetterEm
documentation][BetterEm] for more information.

### Caption {#caption}

The [Caption] extension adds the ability to add captions to any Markdown block,
including images, tables, and code blocks. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.blocks.caption
```

The configuration options of this extension are not specific to Material for
MkDocs, as they only impact the Markdown parsing stage. See the [Caption
documentation][Caption] for more information.

### Caret, Mark & Tilde {#caret-mark-tilde}

The [Caret], [Mark] and [Tilde] extensions add the ability to highlight text
and define sub- and superscript using a simple syntax. Enable them together
via `mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.caret
  - pymdownx.mark
  - pymdownx.tilde
```

The configuration options of this extension are not specific to Material for
MkDocs, as they only impact the Markdown parsing stage. See the [Caret], [Mark]
and Tilde documentation for guidance.

See reference for usage:

- [Highlighting text]
- [Sub- and superscripts]

### Critic {#critic}

The [Critic] extension allows for the usage of [Critic Markup] to highlight
added, deleted or updated sections in a document, i.e. for tracking changes in
Markdown syntax. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.critic
```

The following configuration options are supported:

:    This option defines how the markup
    should be parsed, i.e. whether to just `view` all suggested changes, or
    alternatively `accept` or `reject` them:

    === "View changes"

```yaml
        markdown_extensions:
          - pymdownx.critic:
              mode: view
```

    === "Accept changes"

```yaml
        markdown_extensions:
          - pymdownx.critic:
              mode: accept
```

    === "Reject changes"

```yaml
        markdown_extensions:
          - pymdownx.critic:
              mode: reject
```

See reference for usage:

- [Highlighting changes]

### Details {#details}

The [Details] extension supercharges the [Admonition] extension, making the
resulting _call-outs_ collapsible, allowing them to be opened and closed by the
user. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.details
```

No configuration options are available. See reference for usage:

- [Collapsible blocks]

### Emoji {#emoji}

The [Emoji] extension automatically inlines bundled and custom icons and emojis
in `*.svg` file format into the resulting HTML page. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.emoji:
      emoji_index: !!python/name:material.extensions.emoji.twemoji # (1)!
      emoji_generator: !!python/name:material.extensions.emoji.to_svg
```

1.  [Python Markdown Extensions] uses the `pymdownx` namespace, but in order to
    support the inlining of icons, the `materialx` namespace must be used, as it
    extends the functionality of `pymdownx`.

The following configuration options are supported:

:    This option defines which set
    of emojis is used for rendering. Note that the use of `emojione` is not
    recommended due to restrictions in licensing:

```yaml
    markdown_extensions:
      - pymdownx.emoji:
          emoji_index: !!python/name:material.extensions.emoji.twemoji
```

:    This option defines how the
    resolved emoji or icon shortcode is render. Note that icons can only be
    used together with the `to_svg` configuration:

```yaml
    markdown_extensions:
      - pymdownx.emoji:
          emoji_generator: !!python/name:material.extensions.emoji.to_svg
```

:    This option allows to list folders
    with additional icon sets to be used in Markdown or `mkdocs.yml`, which is
    explained in more detail in the [icon customization guide]:

```yaml
    markdown_extensions:
      - pymdownx.emoji:
          emoji_index: !!python/name:material.extensions.emoji.twemoji
          emoji_generator: !!python/name:material.extensions.emoji.to_svg
          options:
            custom_icons:
              - overrides/.icons
```

The other configuration options of this extension are not officially supported
by Material for MkDocs, which is why they may yield unexpected results. Use
them at your own risk.

See reference for usage:

- [Using emojis]
- [Using icons]
- [Using icons in templates]

### Highlight {#highlight}

The [Highlight] extension adds support for syntax highlighting of code blocks
(with the help of SuperFences) and inline code blocks
(with the help of InlineHilite). Enable it via
`mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.superfences # (1)!
```

1.  [Highlight] is used by the SuperFences extension to
    perform syntax highlighting on code blocks, not the other way round, which
    is why this extension also needs to be enabled.

The following configuration options are supported:

:    This option allows to control
    whether highlighting should be carried out during build time using
    [Pygments] or in the browser with a JavaScript syntax highlighter:

    === "Pygments"

```yaml
        markdown_extensions:
          - pymdownx.highlight:
              use_pygments: true
          - pymdownx.superfences
```

    === "JavaScript"

```yaml
        markdown_extensions:
          - pymdownx.highlight:
              use_pygments: false
```

        As an example, [Highlight.js], a JavaScript syntax highlighter, can be
        integrated with some [additional JavaScript] and an [additional style
        sheet] in `mkdocs.yml`:

        === " `docs/javascripts/highlight.js`"

```js
            document$.subscribe(() => {
              hljs.highlightAll()
            })
```

        === " `mkdocs.yml`"

```yaml
            extra_javascript:
              - https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/highlight.min.js
              - javascripts/highlight.js
            extra_css:
              - https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/default.min.css
```

        Note that [Highlight.js] has no affiliation with the
        Highlight extension.

    All following configuration options are only compatible with build-time
    syntax highlighting using [Pygments], so they don't apply if `use_pygments`
    is set to `false`.

:    This option instructs [Pygments]
    to add a CSS class to identify the language of the code block, which is
    essential for custom annotation markers to function:

```yaml
markdown_extensions:
  - pymdownx.highlight:
      pygments_lang_class: true
```

:    This option will automatically
    add a [title] to all code blocks that shows the name of the language being
    used, e.g. `Python` is printed for a `py` block:

```yaml
    markdown_extensions:
      - pymdownx.highlight:
          auto_title: true
```

:    This option will add line numbers
    to _all_ code blocks. If you wish to add line numbers to _some_, but not all
    code blocks, consult the section on [adding line numbers][Adding line
    numbers] in the code block reference, which also contains some tips on
    working with line numbers:

```yaml
    markdown_extensions:
      - pymdownx.highlight:
          linenums: true
```

:    The [Highlight] extension
    provides three ways to add line numbers, two of which are supported by
    Material for MkDocs. While `table` wraps a code block in a `<table>`
    element, `pymdownx-inline` renders line numbers as part of the line itself:

```yaml
    markdown_extensions:
      - pymdownx.highlight:
          linenums_style: pymdownx-inline
```

    Note that `inline` will put line numbers next to the actual code, which
    means that they will be included when selecting text with the cursor or
    copying a code block to the clipboard. Thus, the usage of either `table`
    or `pymdownx-inline` is recommended.

:
    Default: `false` – If a code blocks contains line numbers, enabling this
    setting will wrap them with anchor links, so they can be hyperlinked and
    shared more easily:

```yaml
    markdown_extensions:
      - pymdownx.highlight:
          anchor_linenums: true
```

:    When this option is set, each
    line of a code block is wrapped in a `span`, which is essential for features
    like line highlighting to work correctly:

```yaml
    markdown_extensions:
      - pymdownx.highlight:
          line_spans: __span
```

The other configuration options of this extension are not officially supported
by Material for MkDocs, which is why they may yield unexpected results. Use
them at your own risk.

See reference for usage:

- [Using code blocks]
- [Adding a title]
- [Adding line numbers]
- [Highlighting specific lines]
- [Custom syntax theme]

### InlineHilite {#inlinehilite}

The [InlineHilite] extension add support for syntax highlighting of inline code
blocks. It's built on top of the Highlight extension, from
which it sources its configuration. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.highlight
  - pymdownx.inlinehilite
```

The configuration options of this extension are not specific to Material for
MkDocs, as they only impact the Markdown parsing stage. The only exception is
the `css_class` option, which must not be changed. See the
InlineHilite documentation for guidance.

See reference for usage:

- [Highlighting inline code blocks]

### Keys {#keys}

The [Keys] extension adds a simple syntax to allow for the rendering of keyboard
keys and combinations, e.g. ++ctrl+alt+del++. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.keys
```

The configuration options of this extension are not specific to Material for
MkDocs, as they only impact the Markdown parsing stage. The only exception is
the `class` option, which must not be changed. See the
Keys documentation for more information.

See reference for usage:

- [Adding keyboard keys]

### SmartSymbols {#smartsymbols}

The [SmartSymbols] extension converts some sequences of characters into their
corresponding symbols, e.g. copyright symbols or fractions. Enable it via
`mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.smartsymbols
```

The configuration options of this extension are not specific to Material for
MkDocs, as they only impact the Markdown parsing stage. See the [SmartSymbols
documentation][SmartSymbols] for guidance.

### Snippets {#snippets}

The [Snippets] extension adds the ability to embed content from arbitrary files
into a document, including other documents or source files, by using a simple
syntax. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.snippets
```

The configuration options of this extension are not specific to Material for
MkDocs, as they only impact the Markdown parsing stage. See the [Snippets
documentation][Snippets] for more information.

See reference for usage:

- [Adding a glossary]
- [Embedding external files]

### SuperFences {#superfences}

The [SuperFences] extension allows for arbitrary nesting of code and content
blocks inside each other, including admonitions, tabs, lists and all other
elements. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.superfences
```

The following configuration options are supported:

:    This option allows to define a
    handler for custom fences, e.g. to preserve the definitions of [Mermaid.js]
    diagrams to be interpreted in the browser:

```yaml
    markdown_extensions:
      - pymdownx.superfences:
          custom_fences:
            - name: mermaid
              class: mermaid
              format: !!python/name:pymdownx.superfences.fence_code_format
```

    Note that this will primarily prevent syntax highlighting from being
    applied. See the reference on [diagrams] to learn how Mermaid.js is
    integrated with Material for MkDocs.

The other configuration options of this extension are not officially supported
by Material for MkDocs, which is why they may yield unexpected results. Use
them at your own risk.

See reference for usage:

- [Using annotations]
- [Using code blocks]
- [Using content tabs]
- [Using flowcharts]
- [Using sequence diagrams]
- [Using state diagrams]
- [Using class diagrams]
- [Using entity-relationship diagrams]

### Tabbed {#tabbed}

The [Tabbed] extension allows the usage of content tabs, a simple way to group
related content and code blocks under accessible tabs. Enable it via
`mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.tabbed:
      alternate_style: true
```

The following configuration options are supported:

:
      This option enables the content tabs
    [alternate style], which has [better behavior on mobile viewports], and is
    the only supported style:

```yaml
    markdown_extensions:
      - pymdownx.tabbed:
          alternate_style: true
```

:    This option enables the content tabs'
    [`combine_header_slug` style] flag, which prepends the id of the header to
    the id of the tab:

```yaml
    markdown_extensions:
      - pymdownx.tabbed:
          combine_header_slug: true
```

:    This option allows for
    customization of the slug function. For some languages, the default may not
    produce good and readable identifiers – consider using another slug function
    like for example those from Python Markdown Extensions:

    === "Unicode"

```yaml
        markdown_extensions:
          - pymdownx.tabbed:
              slugify: !!python/object/apply:pymdownx.slugs.slugify
                kwds:
                  case: lower
```

    === "Unicode, case-sensitive"

```yaml
        markdown_extensions:
          - pymdownx.tabbed:
              slugify: !!python/object/apply:pymdownx.slugs.slugify {}
```

The other configuration options of this extension are not officially supported
by Material for MkDocs, which is why they may yield unexpected results. Use
them at your own risk.

See reference for usage:

- [Grouping code blocks]
- [Grouping other content]
- [Embedded content]

### Tasklist {#tasklist}

The [Tasklist] extension allows for the usage of [GitHub Flavored Markdown]
inspired task lists, following the same syntactical
conventions. Enable it via `mkdocs.yml`:

```yaml
markdown_extensions:
  - pymdownx.tasklist:
      custom_checkbox: true
```

The following configuration options are supported:

:    This option toggles the rendering
    style of checkboxes, replacing native checkbox styles with beautiful icons,
    and is therefore recommended:

```yaml
    markdown_extensions:
      - pymdownx.tasklist:
          custom_checkbox: true
```

:    This option toggles whether
    checkboxes are clickable. As the state is not persisted, the use of this
    option is _rather discouraged_ from a user experience perspective:

```yaml
    markdown_extensions:
      - pymdownx.tasklist:
          clickable_checkbox: true
```

The other configuration options of this extension are not officially supported
by Material for MkDocs, which is why they may yield unexpected results. Use
them at your own risk.

See reference for usage:

- [Using task lists]
