---
page:
  description: Add code languages, titles and line emphasis, and understand copying and long-example behavior.
---

# Code blocks

A fenced Markdown code block displays literal source. Name its language after
the opening fence. A title can identify the file or task; a line selector can
draw attention to the relevant change.

## Titles and line emphasis

````md title="Source for the example below"
```yaml title="site/config.yaml" {2}
url: https://example.com/
search: true
```
````

```yaml title="site/config.yaml" {2}
url: https://example.com/
search: true
```

Write metadata in this order: language, optional `title="..."`, optional
`{...}` line selector. Titles and selectors are Norna extensions to a normal
fence. A selector accepts positive numbers and inclusive ranges separated by
commas, without spaces, such as `{2,4-5}`.

Titles are JSON double-quoted strings: escape a quote as `\"` and backslash
as `\\`. Empty/unclosed titles, decoded control characters, unknown metadata,
reversed/repeated ranges and out-of-range lines fail content validation.

A title labels the code figure; it is not alt text hiding the code from
assistive technology. Emphasis adds surface and edge cues but does not alter
the code or insert line numbers.

## Copying

With JavaScript, **Copy code** copies only source text, not fences, title,
selectors or a language label. Success changes the icon to a check for one
second, without a separate visible success notice. A live status message
announces the result to screen readers. Failure shows a short error for two
seconds and announces it.

Code remains selectable when JavaScript or clipboard access is unavailable;
the button is not required to read or copy manually. Inline code has no button.

## Long examples

Short examples follow prose width. With JavaScript, long top-level examples
can use vacant space before scrolling horizontally, without covering visible
navigation or changing font size and indentation. Examples in callouts remain
inside them. Focus reading can free more width.

A contrasting end edge indicates remaining overflow and the region supports
keyboard scrolling. Without JavaScript, code scrolls at prose width. A title
on an example taller than the viewport stays below the site header until that
example ends; this uses CSS. Untitled blocks get no empty title bar.
