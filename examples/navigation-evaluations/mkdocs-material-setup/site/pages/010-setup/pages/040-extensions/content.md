# Extensions

Markdown is a very small language with a kind-of reference implementation called
[John Gruber's Markdown]. [Python Markdown] and [Python Markdown Extensions]
are two packages that enhance the Markdown writing experience, adding useful
syntax extensions for technical writing.

## Supported extensions {#supported-extensions}

The following extensions are all supported by Material for MkDocs and therefore
strongly recommended. Click on each extension to learn about its purpose and
configuration:

- [Abbreviations]
- [Admonition]
- [Arithmatex]
- [Attribute Lists]
- [BetterEm]
- [Caret, Mark & Tilde]
- [Critic]
- [Definition Lists]
- [Details]
- [Emoji]
- [Footnotes]
- [Highlight]
- [Keys]
- [Markdown in HTML]
- [SmartSymbols]
- [Snippets]
- [SuperFences]
- [Tabbed]
- [Table of Contents]
- [Tables]
- [Tasklist]

## Configuration {#configuration}

Extensions are configured as part of `mkdocs.yml` – the MkDocs configuration
file. The following sections contain two example configurations to bootstrap
your documentation project.

### Minimal configuration {#minimal-configuration}

This configuration is a good starting point for when you're using Material for
MkDocs for the first time. The best idea is to explore the [reference], and
gradually add what you want to use:

```yaml
markdown_extensions:

  # Python Markdown
  - toc:
      permalink: true

  # Python Markdown Extensions
  - pymdownx.highlight
  - pymdownx.superfences
```

### Recommended configuration {#recommended-configuration}

This configuration enables all Markdown-related features of Material for MkDocs
and is great for experienced users bootstrapping a new documentation project:

```yaml
markdown_extensions:

  # Python Markdown
  - abbr
  - admonition
  - attr_list
  - def_list
  - footnotes
  - md_in_html
  - toc:
      permalink: true

  # Python Markdown Extensions
  - pymdownx.arithmatex:
      generic: true
  - pymdownx.betterem:
      smart_enable: all
  - pymdownx.caret
  - pymdownx.details
  - pymdownx.emoji:
      emoji_index: !!python/name:material.extensions.emoji.twemoji
      emoji_generator: !!python/name:material.extensions.emoji.to_svg
  - pymdownx.highlight
  - pymdownx.inlinehilite
  - pymdownx.keys
  - pymdownx.mark
  - pymdownx.smartsymbols
  - pymdownx.superfences
  - pymdownx.tabbed:
      alternate_style: true
  - pymdownx.tasklist:
      custom_checkbox: true
  - pymdownx.tilde
```
