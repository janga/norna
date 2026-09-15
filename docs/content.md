# Content

`site/pages/000-home/content.md` is the homepage file for a Norna site. Its
Markdown H1 is the page title. Optional page metadata can be added in YAML
frontmatter.

Additional and nested pages use the same page model in a page directory under
`site/pages/`. See [Pages and Categories](pages.md) for the directory and
nesting rules.

Site-wide visual defaults belong in [Theme](theme.md). Typography profiles and
overrides are described in [Typography](typography.md). Technical site settings
belong in [Configuration](configuration.md).

## Page Title And Frontmatter

Every page must contain exactly one Markdown H1. It must be the first heading,
must not have a section id, and supplies the visible page title, HTML document
title, and page label in site navigation:

```md
# My Site
```

Content between the H1 and the first H2 is the page introduction. It may
contain prose and Norna blocks.

Frontmatter is optional. When present, the content schema validates these
top-level fields:

- `page`: optional page metadata.
- `navigation`: optional page-listing metadata. See
  [Pages and Categories](pages.md).

`page` contains:

- `description`: optional string. Used as the page's HTML meta description and
  social sharing description for search engines and other metadata consumers.
  It is not rendered as visible page content and is not inferred from prose
  when omitted.
- `aliases`: optional list of previous site-relative URLs that permanently
  identify this page. See
  [Preserve Old Page URLs](pages.md#preserve-old-page-urls).

Minimal homepage without metadata:

```md
# My Site

Introductory text.

## Work {#work}

Text...
```

Homepage with a metadata description:

```md
---
page:
  description: A small Norna site.
---

# My Site

Introductory text.
```

Norna also emits the H1 and canonical page URL as social sharing metadata. A
conventionally named site-wide preview image can be added under `site/public/`.
See [Public Files: Social Sharing Image](public-files.md#social-sharing-image).

## Sections

Markdown level 2 headings define the page sections and their order:

```md
## About {#about}

...

## Work {#work}

...

## Contact {#contact}

...
```

Norna derives a deterministic lowercase ASCII id from the heading text when no
explicit id is present:

```md
## Work
```

Add an explicit id when a public anchor must remain stable even if the heading
text changes:

```md
## Work {#work}
```

Automatic ids are produced by lowercasing the heading, removing accents,
transliterating common letters such as `æ` to `ae`, removing apostrophes, and
replacing other runs of characters with one hyphen. For example:

```text
Crème brûlée & tools  ->  creme-brulee-tools
```

If no ASCII id can be produced, add an explicit id. Explicit ids must contain
lowercase ASCII letters or numbers separated by single hyphens. `page-title` is
reserved by Norna.

Derived and explicit ids are used for anchors and local navigation; the visible
label still comes from the heading text. H3 headings use the same derivation.
All H2 and H3 ids must be unique within their page. If two headings resolve to
the same id, `content:check` reports the page, both headings, and an example fix
instead of guessing.

Markdown section content starts at the level 2 heading and continues until the
next level 2 heading. `###` and `####` headings are body subheadings within the
current section, not new sections.

## Internal Links

Norna checks links between its pages, heading anchors, card destinations, and
files under `site/public/`. Write a link with ordinary Markdown or a card's
`link` field:

```md
[Another page](/guides/installation/)
[A section on this page](#requirements)
[A section on another page](/guides/installation/#requirements)
[Download the guide](/downloads/guide.pdf)
```

The paths in `content.md` describe the Norna site rather than its deployment
location. Start a site-relative path with `/` and omit the configured base
path. For a site published at `https://example.com/project/`, Norna renders
`/guides/installation/` as `/project/guides/installation/`. A relative path
such as `../workflows/` is resolved from the current page. Query strings and
fragments are preserved.

Use the page URL to link to its H1. The explicit anchor `#page-title` also
identifies the H1. H2 and H3 anchors use the derived or explicit ids described
under [Sections](#sections). Prefer the current page URL even though a declared
[page alias](pages.md#preserve-old-page-urls) also resolves to its destination.

A navigation category URL opens its first listed direct page or a generated
list of direct children. See [Opening A Category URL](pages.md#opening-a-category-url).
For a heading link, use the content page URL rather than a category redirect.
A generated category list supports `#page-title`, but no child-heading anchors.
A public-file link must
match the exact relative path of a file under `site/public/`, including its
filename and letter case.

`content:check` validates inline Markdown links, shared Markdown reference
links, and `link` fields in `card-list`. It reports missing pages,
headings, and public files; invalid internal URLs; and links to categories.
External URLs and protocol-relative URLs are left to their remote services and
are not requested during the check.

## Norna Blocks

Managed local images, cards, and generated child-page lists are written in
Markdown fenced blocks at the point where they should appear. Markdown
determines placement: move the fenced block in the page file to move the
rendered block.

`image-stack`, `image-carousel`, and `card-list` contain YAML 1.2 Core data.
Each block is one mapping with an `items` sequence; list settings sit beside
`items`, not within an entry. Image blocks require at least one item, carousels
require at least two, and card lists require at least one card.

Use spaces for indentation and ordinary YAML string rules. Quote text when
YAML would interpret it as another type or syntax, such as `title: "2026"`,
`link: "#contact"`, or `caption: "Opening hours: 10:00 to 16:00"`. Norna does
not convert numbers or booleans to text. Omit unused optional fields: an empty
`caption:` is null, not an empty string. Only `alt: ""` accepts an explicitly
empty string; other supplied values must not be empty or whitespace-only.

Captions and card `text` may use folded (`>-`) or literal (`|-`) YAML scalars.
Folded text wraps as a paragraph; literal text preserves source line breaks.
Parsed line breaks remain visible. Captions and card fields are plain text,
not Markdown. Other fields, including titles, filenames, URLs, badges, and
list settings, must decode to single-line strings.

Duplicate keys, unknown fields, wrong types, missing required fields, extra
YAML documents, anchors, aliases, explicit tags, and merge keys are errors.

Use three or more matching backticks or tildes for fenced blocks. If you need
to document a Norna block inside another Markdown code sample, make the outer
fence longer than the inner fence:

````md
````
```image-stack
items:
  - image: filename.jpg
```
````
````

### Child Page List

Use an empty `page-list` block when an overview page should show its
direct child pages in the normal content flow:

````md
```page-list
```
````

The block takes no options or items. Norna derives its entries from the same
page graph used by site navigation. It includes listed direct child pages in
directory-prefix order and uses each child's H1 as the link title. When a child
defines `page.description`, the description appears below its title; otherwise
the entry remains title-only and `content:check` warns. A missing description
or one containing only whitespace produces a warning without stopping the
build. The warning identifies the list and the child's `content.md`;
descriptions remain optional for pages outside a list. Existing frontmatter
validation still rejects an explicitly empty string (`description: ""`).

Write descriptions that help readers choose, rather than repeat the page
names already available in navigation. For example, a child titled
"Fostering" could use:

```yaml
page:
  description: Offer a temporary home while a dog waits for adoption. Find out what support is provided.
```

The author writes this guidance; Norna only assembles the list. Omit the list
when it would duplicate navigation without helping a choice or a sequence.

The list does not recurse, include unlisted pages, or pass through navigation
categories. This block lists content pages, not category destinations. Unlike
the [automatic category list](pages.md#opening-a-category-url), it omits
category links. Use a page with `content.md` instead of `category.yaml` when
a collection needs introductory content and a generated child-page list. See
[Pages and Categories](pages.md).

Adding, moving, or removing a direct child page updates the rendered list
without repeating page membership in Markdown. `content:check` and the build
stop with a diagnostic if the current page has no listed direct child pages.
The generated list consists of ordinary links and needs no client-side
JavaScript.

Image stacks and carousels use the same image-entry fields:

| Field | Required | Effect |
| --- | --- | --- |
| `image` | Yes | Source filename matching `^[a-z0-9][a-z0-9.-]*\.(jpe?g|png|svg)$`. Use a filename, not a path. |
| `alt` | No | Alternative text. When omitted, Norna renders an empty alt attribute. |
| `caption` | No | Visible text below the image. |

Put each entry under `items` and give it an `image` filename. Fields can appear
in any order. This example indents optional fields with four spaces:

````md
```image-stack
items:
  - image: filename.jpg
    alt: Optional alt text.
    caption: Optional caption.
```
````

Image stacks and carousels use the resolved theme's managed-image presentation.
`prose-aligned` starts media at the body-text edge and sizes it from available
horizontal space. `centered-fit` centers media in a broader area and also
limits image stacks by viewport height. Every carousel is automatically
height-limited so a portrait slide does not dominate the screen. Presets choose
the normal method; an author can override it for a site or page subtree, but
not inside an individual image block. See [Image Sizing](theme.md#image-sizing).

### Image Stack

Use `image-stack` for one or more stacked images:

````md
```image-stack
items:
  - image: work.jpg
    alt: A woven artwork on a white wall.
    caption: Work in progress.
```
````

### Image Carousel

Use `image-carousel` to present two or more images as a carousel:

````md
```image-carousel
items:
  - image: first.jpg
    alt: First image.
    caption: First caption.
  - image: second.jpg
    alt: Second image.
    caption: Second caption.
```
````

The carousel keeps each image's intrinsic proportions and fits its stage within
both available width and a bounded share of the viewport height. In
`prose-aligned`, the stage starts at the body-text edge. In `centered-fit`, it is
centered in the media area. Controls stay next to the rendered stage rather
than moving to the edges of a wider content area.

With two or more images, Norna provides previous and next controls, a numeric
position indicator, arrow-key operation, and touch dragging. The controls
remain visible on the image stage and use colors coordinated with the active
light or dark palette. The active image's caption appears below the stage. Use
descriptive captions when the sequence needs more context than its alt text.

### Card List

Use `card-list` for a list of compact cards. Cards can include text,
managed images, links, and optional badge text:

````md
```card-list
layout: image-top
flow: grid
size: m
items:
  - title: Adopt
    text: Give a dog a new home.
    image: adopt.svg
    link: /adopt/
    badge-text: Recommended
  - title: Foster
    text: Help for a shorter period.
    image: foster.svg
```
````

List-level options sit beside `items`; their order does not matter:

| Option | Accepted values | When omitted |
| --- | --- | --- |
| `layout` | `image-top`, `image-left`, `image-right` | `image-top` |
| `flow` | `grid`, `stack` | `grid` |
| `size` | `s`, `m`, `l`, `xl` | `m` |
| `width` | `text`, `narrow`, `normal`, `wide` | Inherit `blocks.cardList.width` from the root theme; use `normal` if no preset or root default supplies it |

The example omits `width`, so the active theme preset determines how wide the
complete list may become. To make one list an intentional exception, add an
explicit value:

````md
```card-list
width: wide
items:
  - title: Featured project
    text: Let this list use more of the available page width.
```
````

An explicit block `width` takes priority over the theme for that list only.
The root default and preset values are defined under [Content Block
Defaults](theme.md#content-block-defaults).

Each card under `items` requires a `title`. Its fields can appear in any order;
the examples use four spaces before additional fields. Supported optional
fields are `text`, `image`, `link`, and `badge-text`.
Each card must include at least one of `text`, `image`, or `link`.

`link` makes the whole card clickable. Card `text` is plain text, not Markdown;
use the `link` field instead of writing a Markdown link inside `text`.

`content:check` warns when carousel images have different aspect ratios. Exact
matching proportions are recommended because mixed proportions can make the
layout move while the user changes slides.

SVG files are allowed in image stacks and carousels. When an SVG has a
`viewBox` or numeric `width` and `height`, Norna uses that ratio in the same
layout logic as raster images. SVG files without an intrinsic aspect ratio are
rendered directly, but carousel usage produces a warning because stable slide
sizing is less predictable.

## Image Files

Homepage images live under:

```text
site/pages/000-home/images/
```

Images for any page live directly under that page directory. For example:

```text
site/pages/010-guide/pages/020-installation/images/
```

Image references in Norna managed image blocks use only the filename:

````md
```image-stack
items:
  - image: portrait.jpg
```
````

If `portrait.jpg` is referenced anywhere on the homepage, its expected
location is `site/pages/000-home/images/portrait.jpg`. The same file may be referenced from
more than one section on that page.

Filenames must be unique within one page's image directory, but do not have to
be globally unique across the site. Automatic sync only moves files between
page image roots when the filename identifies exactly one source candidate
across the site. If more than one candidate exists, Norna reports the
ambiguity instead of guessing.

## Markdown Images

Markdown image syntax is allowed for external images and public static assets:

```md
![External image](https://example.com/image.jpg)
![Public asset](/favicon.svg)
```

Relative local Markdown images such as `![Portrait](portrait.jpg)` are not
managed by Norna. Use `image-stack`, `image-carousel`, or
`card-list` for local site images that should be validated, processed and
synced.

## Markdown Text

Use ordinary Markdown for emphasis and structure:

```md
This sentence contains **important text** and *emphasised text*.
```

Norna intentionally does not support arbitrary inline color or style classes.
Deprecated syntax such as `[highlighted text]{.yellow}` is rejected by
`content:check`. Keep the page visually coherent through its `theme.yaml`
instead of styling individual phrases.

### Semantic Callouts

Use a semantic callout when a passage needs a defined role beyond ordinary
prose or quotation:

Other documentation tools may call similar blocks *custom containers* or
*admonitions*. Norna calls them semantic callouts because each supported type
has a defined meaning and presentation; authors do not create arbitrary new
types.

```md
> [!WARNING]
> Back up the current site before replacing its configuration.
```

The marker must stand alone on the first line of one blockquote. Accepted
meanings are `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`, and `DANGER`. Norna supplies
a localized visible label and preset-owned presentation for each meaning. The
meaning is not communicated by color alone.

An uppercase type outside this set, such as `INFO`, may use the same syntax:

```md
> [!INFO]
> This remains readable when Norna does not know the meaning.
```

Norna warns about the unknown type and keeps the blockquote neutral. This
fallback preserves content during migration from another tool; it does not
invent a semantic label or color.

The semantic roles are stable across palettes:

| Type | Meaning | Visual family |
| --- | --- | --- |
| `NOTE` | Neutral context | Neutral |
| `TIP` | Positive guidance | Green or green-adjacent |
| `IMPORTANT` | Priority information | Emphasis |
| `WARNING` | Possible harm or loss | Yellow or ochre |
| `CAUTION` | Significant negative consequence | Orange |
| `DANGER` | Severe or irreversible harm | Red |

Custom titles, arbitrary callout colors, and nested callouts are invalid. An
unsupported meaning produces a warning and remains a neutral blockquote; Norna
does not guess whether it means a warning, error, or success. Use an ordinary
blockquote when the text is a quotation rather than a labelled note or warning.
The source remains recognizable as a blockquote in Markdown renderers that do
not enhance the marker.

### Tabs

Use tabs for short alternatives within the same instruction, such as commands
for different operating systems. Put shared step headings outside the group.
Each alternative can contain paragraphs, lists, code, managed images, tables,
semantic callouts, and reference footnotes. Sidenotes are not allowed in tabs.

````markdown
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

Write at least two alternatives. Labels must be nonempty JSON double-quoted
strings and unique within the group. Escape a literal quote as `\"` and a
backslash as `\\`. Decoded control characters, including line breaks and tabs,
are invalid. Every alternative needs content. Close each `::: tab` with `:::`
and the surrounding `:::: tabs`
with `::::`. Code fences do not close these containers.

Tabs belong directly in a page's content, outside lists, blockquotes, callouts,
cards, and notes. They cannot contain headings, nested tab groups, frontmatter,
or navigation definitions. Ordinary links remain allowed. Use separate pages
when alternatives require substantially different heading structures.

Inside a tab, use the same GitHub-style alert syntax as elsewhere. Colon
containers are reserved for tabs; callout container forms such as `::: tip`
and `::: info` are not accepted. Use an inline explanation or a reference
footnote for supplementary material, with the definition outside the tabs.

Norna initially selects the first alternative. Each group works independently;
there is no saved preference, shared group configuration, or public tab ID.
Translated labels are ordinary author-written text. If a step does not apply,
say so in its alternative when omission could be mistaken for missing
instructions. Norna does not require the same alternatives in every group.

With a keyboard, Tab enters the selected tab button. Left and Right Arrow move
focus and select an alternative immediately. Home and End select the first and
last. Tab then continues into the selected panel. Focus and selection have
distinct visible markers.

Without JavaScript, every alternative appears in order with its label, without
adding navigation headings. Printing also displays every alternative. All
content remains in the static HTML for indexing; an ordinary link to the
section lets the reader choose the relevant alternative.

### Details disclosures

Use a native `details` element when optional content should remain available
without taking space in the initial reading flow:

```html
<details>
<summary>Show the extra context</summary>

This content is available when the reader asks for it.

</details>
```

Norna presents the disclosure as a neutral, palette-controlled surface with a
visible summary row. It remains usable without client-side JavaScript. Use a
semantic callout instead when the message is important enough to be visible
immediately.

### Tables

Use ordinary GFM table syntax for compact comparisons and structured data:

```md
| Feature | State | Detail |
| --- | --- | --- |
| Links | Checked | Internal destinations are validated. |
| Images | Managed | Local source images stay with their page. |
```

#### Row Headings

When the first column uniquely names each row, append `{row-header}` to that
column's heading:

```md
| Feature {row-header} | State | Detail |
| --- | --- | --- |
| Links | Checked | Internal destinations are validated. |
| Images | Managed | Local source images stay with their page. |
```

Norna then emits the first cell in every body row as `<th scope="row">`. If
the table must scroll horizontally, that row-heading column remains visible so
the reader can identify the row while inspecting later columns. The top-left
heading stays visible where the sticky row and column headings meet. Tables
that fit retain their natural presentation, and tables without `{row-header}`
retain ordinary GFM table markup.

Row labels wrap at word boundaries. Norna gives the column room for ordinary
words before using horizontal scrolling; unusually long unbroken identifiers
can wrap within the bounded label column so other columns remain reachable.

Use `{row-header}` exactly once, as the final content in the first column
heading. Every body row must have a non-empty, unique first cell. Norna reports
violations through `content:check` and editor diagnostics instead of guessing
which cells are row headings. A table inside a callout retains the row-heading
semantics but does not claim page-level space for a sticky column.

#### Sorting

With JavaScript, a regular Markdown table can be sorted by activating a column
heading. No additional Markdown or configuration is required. Repeated clicks
on the same heading cycle through ascending order, descending order, and the
original Markdown row order. Choosing a different column starts in ascending
order. Empty cells stay last in either direction; equal values retain their
original relative order.

Norna determines the comparison from the non-empty cells in each column:

| Column values | Comparison |
| --- | --- |
| Only numbers such as `10`, `-3`, or `1.5` | Numeric |
| Only ISO dates such as `2026-09-14`, or supported ISO date-times | Chronological |
| Text, mixed types, or ambiguous values | Text comparison using the site's `language` |

Numbers must use digits and an optional decimal point, without units or
grouping separators. Values such as `1,5`, `1,000`, `10 kg`, and `1e3` are text.
ISO date-times use a date followed by `T` and hours and minutes, with optional
seconds, fractional seconds, and a `Z` or numeric time-zone offset. Without an
offset, date-times use the browser's local time zone. Other date formats, such
as `01/02/2026`, are compared as text rather than guessed.

The complete configured language tag supplies the text-comparison locale;
for example, `sv` places Swedish letters after Z. It does not change the number
or date formats accepted for type detection. See
[`language`](configuration.md#language).

The heading indicator describes the current order. Its tooltip describes the
next action: **Sort ascending**, **Sort descending**, or **Restore original
order**. Hover help appears after 500 ms and immediately at keyboard focus;
while visible, it updates after each sort. Escape dismisses it without moving
focus. The button's accessible name includes the column name and next action.
Help text follows the site's language, and the sticky heading offers the same
actions. Enter or Space activates a focused heading.

Sorting requires a single header row, one body section, at least one body row,
and the same number of cells in every row. Tables with spanning cells or
interactive content in their headings retain their original order. Without
JavaScript, all tables remain in their authored order without sorting controls.

#### Width And Scrolling

Norna preserves the native table, column headings, and cell relationships. A
top-level table then uses the smallest layout area in which its browser-rendered
columns fit:

1. the same width as the surrounding prose;
2. the prose width plus vacant space toward the inline end of the page;
3. the complete vacant page canvas; or
4. the complete available canvas with horizontal scrolling inside the table
   frame.

The inline end is the right side for left-to-right text and the left side for
right-to-left text. A visible navigation rail, Page contents, sidenote, or
another wide block owns its space and is never overlapped. Focus reading may
make hidden navigation lanes available to a table without changing the width
or position of the surrounding prose.

Only a table that still overflows receives a keyboard-focusable horizontal
scroll region. JavaScript adds matching horizontal scrollbars above and below
the table body. On top-level tables, the upper control stays directly below
the sticky column headings. Both handles show the visible fraction and
position within the complete table width and stay synchronized. Drag either
handle or click its track to move horizontally. With a scrollbar focused, Left and
Right Arrow move a short distance, Page Up/Down move by most of the visible
width, and Home/End move to the first or last columns. The upper control remains
visible without hovering or reaching the table's bottom. Both controls
disappear when the table fits; if one held keyboard focus, focus moves to the
table's scroll region without moving the page. Touch, trackpad, mouse, and
keyboard scrolling continue to operate on the same native scroll region.
Norna hides the browser's scrollbar only after both custom controls exist;
without JavaScript, the browser supplies the scrollbar and decides when it is
visible.
The document itself does not become horizontally scrollable. A table nested in
a callout or another bounded Markdown container stays within that container
instead of claiming page-level space.

For a long top-level table, column headings stay below the sticky site header
while the reader moves through the rows and release at the table's lower edge.
When the table also scrolls horizontally, JavaScript keeps a visual heading
layer aligned with the visible columns. On sortable tables, its sort buttons
replace the original buttons in the keyboard focus order; otherwise the layer
is hidden from assistive technology. The original `table`, `thead`, headings,
and cells remain the only semantic table. Without JavaScript, the same native
table and horizontal scroller remain usable, but the additional controls and
horizontally synchronized sticky headings are absent.

### Code Blocks

Short code examples follow the text width. With JavaScript available, long
top-level examples can use free space beside the text before scrolling
horizontally. They never cover visible navigation; examples inside callouts
stay inside the callout. Focus reading can make additional width available.
The font size and source indentation remain unchanged. A contrasting end edge
marks remaining overflow, and the code area accepts keyboard scrolling.
Without JavaScript, code remains readable and horizontally scrollable at the
text width.

Use an ordinary fenced Markdown code block for commands, configuration, and
source examples:

````md
```sh
npm run norna:check
```
````

Add a short visible title after the fence language when the reader needs to
know which file or context the example represents. Add a line selector after
the optional title when particular lines need attention:

````md
```js title="src/config.js" {2,4-5}
const siteUrl = 'https://example.com/';
const search = true;
const appearance = 'system';
const build = 'static';
const output = 'dist';
```
````

The selector accepts positive line numbers and inclusive ranges separated by
commas, without spaces. Write metadata in this order: language, optional
`title="..."`, then optional `{...}` selector. A title may be used without a
selector, and a selector may be used without a title. `content:check` rejects
empty or unclosed titles, unknown metadata, reversed or repeated ranges, and
lines outside the code block.

Titles use the same JSON double-quoted string rules as tab labels. Escape a
literal quote as `\"` and a backslash as `\\`; decoded control characters such
as line breaks and tabs are invalid.

The title is part of the figure presented before the code. Selected lines use
both a surface and an edge marker, so color is not their only distinguishing
feature. Line emphasis does not alter the source text or add line numbers.

When JavaScript is available, Norna adds a button labelled **Copy code** to each
rendered fenced code block. Activating it copies only the code text, without the
fence, title, selector, or a displayed language name. The button works with
pointer and keyboard input. After a successful copy, the button briefly changes
to a check icon for one second. Norna does not add a separate visible success
message; the result is announced through a live status message for screen
readers. If copying fails, a short error message is shown beside the button for
two seconds and is announced in the same way.

The code remains ordinary selectable text when JavaScript or clipboard access
is unavailable. The copy control is then absent or reports failure; it is not
required to read or select the example. Inline code does not receive a copy
control.

When a titled code example is taller than the viewport, its title stays below
the sticky site header while the reader moves through the code. The title
releases at the lower edge of its own example. This behavior uses CSS and does
not require JavaScript.
Untitled code blocks do not receive an empty title bar.

### Side Notes

Add a named side note to an ordinary body paragraph with a `[^margin:name]`
reference and a matching top-level definition:

```md
Norna keeps the page source readable.[^margin:source]

[^margin:source]: The note appears in the margin when enough horizontal space is available.
```

The name connects the reference to its definition. Norna generates visible
letters in first-reference order across the page: `a` through `z`, then `aa`,
`ab`, and so on, without a limit at 26. Definition order, viewport size, and
Focus reading do not change these letters. Side notes have a separate series
from numbered reference footnotes.

A note body contains one paragraph with optional emphasis, strong emphasis,
links, and inline code. It may wrap using indented continuation lines:

```md
Norna keeps the page source readable.[^margin:source]

[^margin:source]: The note may contain a longer explanation
    when the extra context is useful.
```

On wide screens Norna places the note in the reading margin when the complete
note fits without colliding with navigation or another wide content block. On
narrower screens it remains in the normal reading flow.

Several notes attached to the same paragraph form a vertical stack in reference
order. The next paragraph begins below both the text and its notes, so long or
numerous notes can increase the space between paragraphs. When margin placement
does not fit, the notes appear after their paragraph in the reading flow. Keep
notes short; use reference footnotes for longer supporting material.

With JavaScript enabled, hovering over a sidenote reference or reaching it with
keyboard focus highlights the matching note without moving the page or changing
its layout. Activating the reference follows a normal link to the note; the
note's letter links back to its reference. These links and the note content
remain available without JavaScript. Printed pages show notes in the reading
flow.

On a page that has separate page and contents rails at wide widths, a note that
has returned to the reading flow stays there when the contents rail is folded
into the page tree. Norna does not move the note out and back again while the
viewport becomes narrower. A shallow page without that contents rail continues
to use its margin when the complete layout leaves enough room. Focus reading
may restore margin placement because the reader explicitly removes the
persistent rails.

Each side note must be referenced exactly once; one paragraph can reference
several different side notes. References are allowed only in ordinary body
paragraphs, not headings, lists, tables, tabs, callouts, disclosures, other
containers, image captions, or card fields. Note bodies cannot contain another
note reference, a second paragraph, headings, lists, images, tables, fenced
code, or containers.

Definitions belong at the page's top level, anywhere before or after their
references, including at the end of the source. Their position does not control
rendered placement. Missing or duplicate definitions and repeated sidenote
references are errors; unused definitions produce warnings. Use the lowercase
`margin:` prefix with a nonempty name for side notes. Reference and definition
names follow the Markdown parser's case folding, including Unicode case
equivalents, but are not Unicode-normalized: composed and decomposed spellings
remain distinct. Names cannot contain whitespace. Use the exact same spelling
in a reference and its definition; the reserved `margin:` prefix itself must
always be lowercase.

The `margin:` prefix is a Norna convention within reference-footnote syntax.
Another renderer that accepts these identifiers can display the note as an
ordinary footnote. The positional brace syntax is not supported.

### Reference Footnotes

Use standard Markdown reference footnotes for citations or supporting material
that belongs at the end of the page rather than beside one paragraph:

```md
The setting applies to every page.[^scope]

[^scope]: A page-local theme may override presentation values.
```

The same definition may be referenced more than once. Definitions may contain
links and continuation lines, and may be declared in a later section of the
same page. Definitions must stay at the page's top level, outside containers:

```md
The source explains the constraint.[^source] The same source also describes
the fallback.[^source]

[^source]: Read the [configuration reference](configuration.md).
    This continuation remains part of the same footnote.
```

Norna renders reference footnotes as a numbered list at the end of the page.
Numbers follow complete source-reference order, including hidden tab
alternatives, without gaps from side notes. References may appear in tables,
tabs, and callouts. Each occurrence has its own return destination. Returning
to a reference in a tab reveals that alternative before focus returns;
without JavaScript, all alternatives are already visible. Missing or duplicate
definitions are errors and unused definitions produce warnings.

Reference and return links remain usable without client-side JavaScript, and
their generated labels follow the site's configured language. Use a
[side note](#side-notes) when a short explanation should stay beside its
paragraph whenever space permits; use a reference footnote when the material
acts as a citation or page-level endnote.

## Validation And Sync

Run:

```sh
npm run norna:content:check
```

This checks section heading ids, internal page, heading, card, and public-file
links, duplicate image names, missing image files, misplaced referenced images,
duplicate image references, invalid Norna blocks, unreferenced images, removed
inline style syntax, Markdown image references to unmanaged local files, and
common frontmatter indentation and structure mistakes.

Frontmatter uses YAML indentation. Use ordinary spaces, not tabs or
non-breaking spaces. `content:check` reports a focused error when indentation is
invalid, when a key is indented under a line that already has a value, or when a
known nested key appears at the top level:

```yaml
navigation:
  listed: false
```

Top-level page frontmatter may contain only `page` and `navigation`. Visual
settings belong in the root or page-local `theme.yaml`.

Run:

```sh
npm run norna:sync
```

This moves referenced image files into the image directory for the page that
references them. Moving a block between sections on the same page does not
move the file because all sections share the page image directory. The command
prompts before writing unless `--yes` is passed.

`content:sync` is intentionally conservative. It only moves a file when the
filename identifies exactly one matching source candidate across all page
image roots, and when the move will not break another reference.
If the intended move is ambiguous, rename or move the file manually and run
`content:check` again.

The same filename may exist in different page image directories. Automatic
relocation only requires site-wide filename uniqueness for the file being
moved.

Before writing, `content:sync` shows every planned source and destination. Each
file is moved atomically when both paths are on the same filesystem. If a move
fails, the command reports completed and remaining moves; fix the filesystem
problem and run it again. A move between different filesystems is not copied
automatically and must be completed manually using the paths in the error.

Git is recommended so an unintended content edit or image move can be restored,
but a clean working tree is not required. `content:check` only reports issues
and never moves files.
