---
page:
  description: Create linked cards with text, optional images and badges, and control list layout and width.
---

# Card lists

A `card-list` presents a short collection of comparable choices, resources or
steps. Each card needs a title and at least one of text, image or link.

````md title="content.md: two linked choices"
```card-list
items:
  - title: Site files
    text: Find the source files to edit and generated files to leave alone.
    link: /reference/site/files/
  - title: Page structure
    text: Choose pages and categories for a hierarchy.
    link: /reference/site/pages/
```
````

```card-list
items:
  - title: Site files
    text: Find the source files to edit and generated files to leave alone.
    link: /reference/site/files/
  - title: Page structure
    text: Choose pages and categories for a hierarchy.
    link: /reference/site/pages/
```

## Card fields

| Field | Meaning |
| --- | --- |
| `title` | Required nonempty single-line title |
| `text` | Plain text, optionally multiline |
| `image` | Managed filename in this page's `images/` folder |
| `link` | Destination making the whole card clickable |
| `badge-text` | Optional short single-line badge |

Use `link`, not a Markdown link inside `text`; card fields are not Markdown.
There is no card `alt` field. See [image blocks](/reference/content/images/)
when an image needs an independent caption and alternative-text description.
Internal card destinations follow [normal link validation](/reference/site/urls/).

## List options

Options sit beside `items`, not inside a card:

| Option | Values | Default |
| --- | --- | --- |
| `layout` | `image-top`, `image-left`, `image-right` | `image-top` |
| `flow` | `grid`, `stack` | `grid` |
| `size` | `s`, `m`, `l`, `xl` | `m` |
| `width` | `text`, `narrow`, `normal`, `wide` | Root theme's card-list default |

Layout places images relative to text. Flow chooses responsive grid or one
stacked sequence. Size coordinates card sizing; it does not set an exact
number of columns. The list adapts to available width.

## Width

`text` follows the reader's current prose width; `narrow` limits the list to
48rem; `normal` limits it to 56rem; `wide` uses available page-layout width.
These limits apply to the **whole list**, not individual cards.

Set the site default in the root theme:

```yaml title="site/theme.yaml"
blocks:
  cardList:
    width: text
```

An explicit `width` inside a card-list overrides this for that list only.
Page themes cannot set `blocks`. Presets default to `text` (documentation),
`normal` (project) or `wide` (portfolio/statement); without a preset the
default is `normal`.

All fields use the [structured YAML rules](/reference/content/structured-blocks/).
Cards are ordinary content and links without JavaScript.
