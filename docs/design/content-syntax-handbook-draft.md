# Content Syntax Handbook Draft

**Approved design, not current product documentation.** This guide shows
the authoring model proposed by
[BL-108: Standard And Uniform Content Syntax](backlog/BL-108-standard-uniform-content-syntax.md).
Do not copy the proposed YAML or sidenote examples into a released Norna site
yet. [Content](https://janga.github.io/norna/reference/content/markdown/) remains the reference for implemented behavior.

The user has approved this handbook's authoring model and the parser defaults
listed below. No syntax implementation is implied by approval of this document.
The filename retains `draft` to keep this design separate from the released
reference until implementation and verification are complete.

## Choose The Construct For The Content

| You want to write | Use | Status in this proposal |
| --- | --- | --- |
| Headings, paragraphs, emphasis, links, lists, or tables | Existing Markdown | Retained |
| Managed images or cards | Named fenced block containing YAML | Revised data format |
| An automatic child-page list | Empty `page-list` block | Retained |
| A notice with a semantic meaning | GitHub-style alert | One form everywhere |
| Short alternatives within an instruction | `tabs` and `tab` colon containers | Retained, without sidenotes |
| Optional expandable content | HTML `details` and `summary` | Retained |
| A short explanation beside body text | Named `margin:` note reference | New sidenote form |
| A citation or reusable note at the page end | Named reference footnote | Retained, separate numbering |
| Code with a title or highlighted lines | Existing code-fence metadata | Retained; string rules need review |

There are three syntax families, not one universal wrapper. YAML describes
structured entries. Tabs contain alternative Markdown passages. Inline text
and note references use familiar Markdown forms where available. Tables and
reference footnotes are Markdown extensions, not features of every Markdown
renderer; GitHub alerts and the `margin:` convention are not CommonMark syntax.

## Put Structured Entries Under Items

These examples propose real YAML, not the current line-oriented block format.
Use spaces for YAML indentation. Every image/card block is a mapping whose
`items` field contains its ordered sequence of entries. Supported settings sit
beside `items`; individual fields sit within each entry.

### One Image Or An Image Stack

Use `image-stack` for one image or a vertical sequence:

````markdown
```image-stack
items:
  - image: workshop.jpg
    alt: A workbench with hand tools arranged along the wall.
    caption: The workshop before opening.
```
````

Add more entries under `items` to create a stack. The required `image` value
remains a managed source filename, not a path. Optional `alt` describes the
image for readers who cannot see it; optional `caption` is visible text.
This proposal does not change supported file types or image presentation
defaults. An explicitly empty `alt: ""` remains possible for a decorative image.

### A Carousel

Use the same entry structure with at least two images:

````markdown
```image-carousel
items:
  - image: workshop.jpg
    alt: Workbenches inside the workshop.
    caption: Inside.
  - image: entrance.jpg
    alt: The entrance facing the courtyard.
    caption: Outside.
```
````

Presets and supported theme overrides continue to control image presentation.
The `items` wrapper does not add per-image or per-block layout overrides.

### Cards

Put list settings beside the entries:

````markdown
```card-list
layout: image-top
flow: grid
items:
  - title: Visit the workshop
    text: Meet the makers and see their work.
    image: workshop.jpg
    link: /visit/
    badge-text: Open Saturday
```
````

Existing `layout`, `flow`, `size`, and `width` settings retain their meanings
and defaults. Every card requires `title` and at least one of `text`, `image`,
or `link`. This draft does not rename individual fields or add new card fields.

### Automatic Child-Page Lists

This block has no author-written entries or options, so it remains empty:

````markdown
```page-list
```
````

Norna supplies the entries from listed direct child pages and their metadata.
Uniformity does not require an unused `items` field for generated content.

## Use YAML String Rules

Use `>` to fold a wrapped source paragraph into a string and `|` when the
string must retain line breaks. A trailing `-` removes the final line break:

```yaml
caption: >-
  A longer explanation can wrap in the source
  without creating a forced line break in its value.
```

```yaml
caption: |-
  Workshop entrance
  Courtyard level
```

The approved display rule preserves parsed line breaks visibly in captions and
card text. This requires rendering support as well as YAML parsing. Folded `>`
text wraps normally; any line breaks that YAML retains still remain visible.

Quote strings when YAML would otherwise interpret them as another type or
syntax. For example:

```yaml
title: "2026"
caption: "Opening hours: 10:00 to 16:00"
```

Norna validates the parsed values. A numeric `title: 2026` is not converted to
text automatically. Omit optional fields you do not need; an empty field such
as `caption:` is a YAML null value, not the same as `caption: ""`.

Duplicate keys, unknown fields, wrong types, and missing required fields are
errors. Whether an empty string is useful depends on the field: an empty image
filename is invalid, while an explicitly empty alt attribute can be intentional.
Other provided fields must be nonempty and not whitespace-only; omit unused
optional fields rather than providing null or empty values.

## Use One Callout Form Everywhere

Write a callout as a GitHub-style alert, including inside a tab:

```markdown
> [!WARNING]
> Back up the site before replacing its configuration.
```

Keep the marker on its own line. The supported types remain `NOTE`, `TIP`,
`IMPORTANT`, `WARNING`, `CAUTION`, and `DANGER`. Norna supplies their localized
labels and semantic presentation; arbitrary titles and nested callouts remain
outside the contract.

An unknown uppercase type follows the same marker syntax but produces a
warning and a neutral blockquote, not a guessed semantic color:

```markdown
> [!CUSTOM]
> This information remains readable, but its type is not recognized.
```

The tab-only `::: tip` and similar callout forms are removed by this proposal.
Do not offer them as alternative completions. GitHub alerts are recognizable
blockquotes in other Markdown tools, but enhanced styling is renderer-dependent.

## Keep Alternatives In Tabs

Tabs retain their existing delimiters and quoted labels:

````markdown
:::: tabs

::: tab "macOS"

> [!TIP]
> Use Homebrew if it is already installed on your computer.

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

Provide at least two nonempty alternatives with distinct labels. Keep headings
outside tabs. Nested tabs remain forbidden. This proposal does not introduce
public tab IDs, synchronized choices, or saved selection.

Use plain text for local explanations inside an alternative, or a reference
footnote for supplementary material. Sidenotes are not allowed inside tabs.
Without JavaScript and in print, all alternatives remain readable.

## Use Named Sidenotes In Body Paragraphs

A sidenote is a short explanation attached to a particular point in ordinary
body text. Its name connects the reference and definition in source; Norna
generates the reader-facing letter.

```markdown
The workshop opens on Saturday.[^margin:hours] Visits are free.[^margin:booking]

[^margin:hours]: Opening hours are 10:00 to 16:00.
[^margin:booking]: Please book ahead for groups of more than six.
```

The reader sees markers `a` and `b`. They follow the order of first references
on the page, not the position or alphabetical order of the definitions. After
`z`, the sequence continues `aa`, `ab`, and so on. There is no limit or warning
at 26. Resizing or enabling Focus reading does not change the markers.

The prefix `margin:` is a Norna convention within reference-footnote syntax.
In another renderer that accepts these footnote identifiers, it can fall back
to an ordinary footnote rather than a marginal note. This is not a claim of
support in every Markdown renderer.

Each sidenote is referenced exactly once. Multiple different sidenotes may
occur in one paragraph. Use a normal reference footnote when the same note
needs several references.

### Placement And Content

Sidenote references are limited to ordinary body paragraphs, outside lists,
tables, tabs, callouts, disclosures, other containers, and headings. They are
not available in image captions or structured card fields.

A sidenote body contains one paragraph with optional emphasis, strong emphasis,
links, and inline code. Source text may wrap. It cannot contain headings, lists,
images, tables, fenced code, containers, or another note reference.

The rendered note belongs beside the referenced paragraph when it fits. When
space or a wide block prevents safe marginal placement, it returns to the
normal flow. Multiple notes must not overlap or obscure nearby content. The
precise multi-note flow layout still needs visual review.

Definitions may be on the page's top level anywhere before or after their references, including at
the end of the source. They cannot be defined inside other containers. Their
source position does not determine their rendered position.

## Keep Reference Footnotes For Reusable Material

Footnotes retain ordinary named references and a separate numeric series:

```markdown
See the opening policy.[^policy] The same policy covers group visits.[^policy]

[^policy]: Contact the workshop before arranging a group visit.
```

Both references have the same number and lead to one footnote at the page end.
Sidenote letters do not create gaps in this numeric series. Each occurrence
needs its own return destination, with accessible link names.

Reference footnotes are allowed in tables, tabs, and callouts. Definitions
remain outside these containers under the placement rule above. A return
link into a tab must reveal the corresponding alternative before returning
focus; without JavaScript all alternatives are visible.

## Keep Other Constructs Familiar

- H1 remains the page title, not the page slug. H2/H3 retain automatic anchors
  and optional explicit `{#id}` suffixes.
- Code retains the fence language, optional `title="..."`, and line selector
  such as `{2,4-5}`. Titles and tab labels use the shared JSON double-quoted
  string rules below; this does not imply YAML syntax for code-fence metadata.
- Native `<details>` with `<summary>` remains the expandable-content form.
- Existing standard text, links, lists, tables, and supported Markdown features
  do not need new Norna wrappers.

## Examples That Should Fail

These are deliberately invalid under the proposal, not copyable examples:

| Source or situation | Why it fails |
| --- | --- |
| `image-stack` with a bare root list and no `items` mapping | Previous data shape; use the new mapping. |
| Two `caption` keys in the same image entry | Duplicate field; never silently choose the last value. |
| `title: 2026` in a card | Text field received a number; quote it. |
| A callout marker followed by body text on the same line | Marker must stand alone. |
| `::: tip` inside or outside tabs | Removed callout form; use a GitHub-style alert. |
| `{note-ref}` paired with `{note: ...}` | Removed positional sidenote form. |
| Two references to `[^margin:hours]` | Sidenotes have one reference each; reusable notes are footnotes. |
| `[^margin:hours]` inside a table, tab, or callout | Sidenotes are limited to ordinary body paragraphs. |
| A list, second paragraph, image, or noteref in a sidenote body | Sidenotes contain one paragraph of allowed inline content. |

## Approved Parser Defaults

The user approved the following defaults before implementation:

| Area | Approved contract |
| --- | --- |
| YAML boundary | YAML 1.2 Core schema, one document with a mapping root. No authored anchors, aliases, explicit tags, or merge keys. Use normal YAML parsing, then validate Norna's restricted data shape. |
| Empty values and multiline text | Omit unused optional fields. Reject null and whitespace-only values; permit an explicitly empty `alt: ""`. Allow multiline `caption` and card `text`, preserving parsed newlines visibly; keep titles, filenames, URLs, badges, and enum settings single-line. Folded `>` text wraps normally. |
| Tab labels and code titles | Use the same JSON double-quoted string decoding for both, rejecting decoded control characters such as line breaks and tabs. YAML fields continue to follow YAML's own standard string rules. |
| Definition placement | Definitions belong anywhere on the page's top level, before or after references, never inside another container. Their position does not control visual placement. |
| Note identity and errors | Reuse the existing Markdown parser's identifier matching for both note types rather than invent a second case/Unicode matching algorithm. Reserve lowercase `margin:` for sidenotes with a nonempty suffix. Missing or duplicate definitions are errors; unused definitions produce warnings. |
| Footnotes in tabs | Number by complete source order, including hidden alternatives, and retain the numbers when selection changes. Return links reveal the correct alternative before returning focus. |

For reference identity, document and test the actual parser normalization
before implementation, including differently cased spellings of the reserved
prefix. Equivalent reference/definition identifiers must not become distinct
notes accidentally. Generate collision-safe targets from normalized names,
not visible letters/numbers, with a namespace separate from heading targets.

For multiline text, retain the existing inline-formatting policy; do not
interpret a YAML block scalar as permission to nest Markdown block constructs
inside cards or captions. Verify newline display in both inline and side
captions rather than merely testing the parsed string.

Choose bounded input/depth handling for YAML based on existing engine limits
and representative content. Aliases are not needed for the first model; no
alias expansion mechanism or custom constructor should be exposed to authors.

### Editor Ownership To Verify

The implementation should reuse one block-field contract for schemas, engine
validation, and IntelliSense. This is an approved simplification goal, not an
assumption that Red Hat's YAML extension handles Markdown code fences.

Verify ownership separately for standalone YAML files and embedded Norna
blocks. A small Norna-owned embedded adapter is acceptable when needed; a
second independently maintained field model is not. Formatting must have one
owner in the supported setup, with no competing save-time syntax repair loop.

No backward-compatible parser, aliases for removed forms, or automatic
migration tool is planned. Updating maintained repository content is part of
implementation, not a user-facing migration feature. Public documentation
remains unchanged until its implementation/review gate has been met.

## Sources And Scope

- [YAML specification](https://yaml.org/spec/1.2.2/) supplies the data-format
  rules; Norna's approved schema will constrain the accepted data model.
- [GitHub: Alerts](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts)
  and [GitHub: Footnotes](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#footnotes)
  describe the recognizable source conventions. `DANGER` and `margin:` remain
  Norna extensions rather than GitHub guarantees.
- [Tufte CSS: Sidenotes](https://edwardtufte.github.io/tufte-css/#sidenotes)
  demonstrates numbered sidenotes and unnumbered margin notes. Separate letters
  for Norna sidenotes are our design decision, not a rule attributed to Tufte.
- [Documentation style guide](documentation-style-guide.md) governs the final
  author-facing reference and examples.
