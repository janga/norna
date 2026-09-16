---
page:
  description: Give notes, tips and warnings a defined meaning using GitHub-style blockquote markers.
---

# Semantic callouts

A semantic callout distinguishes supporting guidance or a warning from ordinary
prose. Norna supplies its label and appearance from a closed set of meanings.
Other tools may call similar blocks admonitions or custom containers.

## Syntax

```md title="content.md: a warning"
> [!WARNING]
> Back up the source before a structural change you may need to undo.
```

> [!WARNING]
> Back up the source before a structural change you may need to undo.

The marker stands alone on the first line of a blockquote; the next quoted
line begins the content. Custom text on the marker line is not a title.
Use ordinary blockquotes for quotations rather than labelled guidance.

## Types

| Type | Meaning | Visual family |
| --- | --- | --- |
| `NOTE` | Neutral context | Neutral |
| `TIP` | Helpful positive guidance | Green |
| `IMPORTANT` | Information needing attention | Emphasis |
| `WARNING` | Possible harm or loss | Yellow/ochre |
| `CAUTION` | Significant negative consequence | Orange |
| `DANGER` | Severe or irreversible harm | Red |

Visible labels follow the site's language. Colors are engine-owned and stable
across palettes, with light/dark variants; meaning is also communicated by the
label, not just color. Authors cannot add custom colors or arbitrary new types.

## Content and fallback

Callouts can contain Markdown prose, lists, code and tables. Tables and other
wide blocks remain inside the callout rather than claiming page-level margins.
Nested callouts, custom titles and sidenotes are forbidden. Ordinary numbered
footnotes are available, with definitions outside the callout.

An unknown uppercase marker such as `[!INFO]` warns and remains a neutral
blockquote. It preserves content without guessing its meaning or inventing
a semantic label. Correct it to a supported type when a warning or tip was
intended. In a Markdown renderer without alert support, the source remains a
recognizable blockquote.

Colon callout containers such as `::: tip` are not current Norna syntax;
colons are reserved for [tabs](/reference/content/tabs/). For optional hidden
context, use [details](/reference/content/details/) instead of hiding an
important warning.

If an editor changes marker line breaks on save, see
[VS Code formatting](/reference/workflows/editor/#formatting).
