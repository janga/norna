---
page:
  description: Try tables, checklists, footnotes and GitHub-style alerts alongside their source.
navigation:
  order: 3000
---

# Common Markdown extensions

These conventions are supported by other Markdown tools as well as Norna.
Tables, task lists, strikethrough and automatic links for plain addresses belong
to GitHub Flavored Markdown (GFM).
Footnotes and GitHub-style alerts are additional conventions, so support can
vary between tools.
HTML written in Markdown belongs to the [standard Markdown
tour](/examples/standard-markdown/#html-in-markdown), not to these GFM
extensions.

## Tables {#tables}

| Capability | Source | Wide screen | Small screen | With JS | Without JS |
| --- | --- | --- | --- | --- | --- |
| Links | Markdown | Inline | Wrap | No change | Links |
| Images | `image-stack` | Preset width | Fit | Inspector | Image link |
| Carousels | `image-carousel` | Fit | Swipe | Slides | Static images |
| Cards | `card-list` | Grid | Reflow | No change | Full list |
| Callouts | Alert quote | In prose | Reflow | No change | Labels |
| Tabs | Tab fences | Alternatives | Wrap labels | Select | All options |
| Sidenotes | Named note | Free margin | Inline | No change | Linked notes |
| Code | Code fence | Expand | Scroll | Copy | Select text |
| Tables | Markdown | Expand | Scroll | Column controls | Scroll |
| Search | `site-config/settings.yaml` | Search page | Same page | Pagefind | Navigation |
| Appearance | `root/tree-theme.yaml` | Light or Dark | Same choice | Reader choice | Default |

```md title="Table source (Markdown)"
| Capability | Source | Wide screen | Small screen | With JS | Without JS |
| --- | --- | --- | --- | --- | --- |
| Links | Markdown | Inline | Wrap | No change | Links |
| Images | `image-stack` | Preset width | Fit | Inspector | Image link |
| Carousels | `image-carousel` | Fit | Swipe | Slides | Static images |
| Cards | `card-list` | Grid | Reflow | No change | Full list |
| Callouts | Alert quote | In prose | Reflow | No change | Labels |
| Tabs | Tab fences | Alternatives | Wrap labels | Select | All options |
| Sidenotes | Named note | Free margin | Inline | No change | Linked notes |
| Code | Code fence | Expand | Scroll | Copy | Select text |
| Tables | Markdown | Expand | Scroll | Column controls | Scroll |
| Search | `site-config/settings.yaml` | Search page | Same page | Pagefind | Navigation |
| Appearance | `root/tree-theme.yaml` | Light or Dark | Same choice | Reader choice | Default |
```

**Source:** [GitHub Flavored Markdown table syntax](https://github.github.com/gfm/#tables-extension-).
Tables are a GFM extension to core Markdown. Norna keeps column headings
visible (sticky) while you scroll through the rows, and adds the width,
scrolling and sorting behavior described below. [Table row headings](/examples/norna-extensions/#table-row-headings)
use an additional Norna marker.

Click a column heading to sort ascending, click again for descending, and a
third time to restore the order above. Hover over a heading, or focus it with
the keyboard, to see what the next activation does. Text comparison follows
the site's language; numeric and ISO-date columns sort by value.

The table uses available space before scrolling horizontally. Its column
headings stay visible while you scroll its rows. When columns extend beyond
the visible area, matching scrollbars below the headings and at the table's
bottom show the same horizontal position. Drag either handle or click its
track to reach more columns. Without JavaScript, the rows keep their original
order and the browser provides horizontal scrolling.

The code block above contains every cell of this table, unchanged. Read the
[table reference](/reference/content/tables/).

GFM tables also support column alignment. Add a colon to the separator row
for left, centered or right alignment:

| Left | Center | Right |
| :--- | :---: | ---: |
| Start | Middle | End |

```md
| Left | Center | Right |
| :--- | :---: | ---: |
| Start | Middle | End |
```

The alignment markers affect the column's text; Norna still applies its
responsive table layout.

## Task lists and strikethrough {#task-lists-and-strikethrough}

- [x] Read about the dogs.
- [ ] Arrange a visit.

~~Drop in at any time.~~ Book a visit first.

````md
- [x] Read about the dogs.
- [ ] Arrange a visit.

~~Drop in at any time.~~ Book a visit first.
````

**Source:** GFM task lists and strikethrough. Checkmarks are published content;
they do not store readers' progress. Edit the Markdown to change them.

GFM also turns plain web addresses and email addresses into links:

Visit https://example.com/ or write to hello@example.com.

```md
Visit https://example.com/ or write to hello@example.com.
```

Use named links when the address itself is not useful to the reader, as shown
in [Standard Markdown links](/examples/standard-markdown/#links).

## Footnotes {#footnotes}

Keep supporting details in a numbered note.[^visit]

[^visit]: Tell us about accessibility needs when booking your visit.

````md
Keep supporting details in a numbered note.[^visit]

[^visit]: Tell us about accessibility needs when booking your visit.
````

**Source:** Reference-footnote syntax. The note appears at the end of the page,
with a link back to its reference. A definition can be reused. See
[footnotes](/reference/content/footnotes/).

## GitHub-style alerts {#semantic-callouts}

> [!NOTE]
>
> Norna builds a static site from your source files.

> [!TIP]
>
> Preview the site before publishing it.

> [!IMPORTANT]
>
> Keep a copy of the source files so you can rebuild the site.

> [!WARNING]
>
> Commit source files before a structural change that you may want to undo.

> [!CAUTION]
>
> Check the destination before replacing an existing file.

> [!DANGER]
>
> Never publish passwords or private API keys. Visitors can read published files.

```md
> [!NOTE]
>
> Norna builds a static site from your source files.

> [!TIP]
>
> Preview the site before publishing it.

> [!IMPORTANT]
>
> Keep a copy of the source files so you can rebuild the site.

> [!WARNING]
>
> Commit source files before a structural change that you may want to undo.

> [!CAUTION]
>
> Check the destination before replacing an existing file.

> [!DANGER]
>
> Never publish passwords or private API keys. Visitors can read published files.
```

**Source:** GitHub-style alerts, supported by Norna as semantic callouts. Alerts
are not part of the formal GFM specification. Norna supports `NOTE`, `TIP`,
`IMPORTANT`, `WARNING`, `CAUTION`, and `DANGER`; the meaning is expressed by
structure and a localized label rather than color alone. Other tools may call
similar blocks custom containers or admonitions. Norna's set of styled semantic
meanings is closed: an unknown uppercase type remains readable as a neutral
blockquote and produces a warning. `DANGER` is an additional Norna type. Read
the
[semantic-callout reference](/reference/content/callouts/).
