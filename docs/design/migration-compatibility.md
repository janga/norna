# Migration Compatibility

This report asks a narrower question than a feature comparison: what must
happen to real source content when a documentation site moves to Norna?
Feature parity is not the target. A migration is successful when it preserves
the author's information and produces an understandable Norna site without
bringing the previous generator's template or component system with it.

## Decision

Norna should target **content-preserving migration**, not source-syntax
compatibility.

The minimum compatibility target is:

1. Preserve the page hierarchy, page titles, descriptions, listed state, URLs,
   internal links, and public files.
2. Preserve ordinary Markdown and supported GFM constructs directly.
3. Translate common documentation constructs into a small Norna equivalent or
   a readable Markdown fallback.
4. Report every construct that cannot be translated without loss. Never drop
   hidden tab content, included source, component output, or metadata silently.
5. Leave project-specific templates, arbitrary components, and generated data
   outside the migrated content unless a dedicated Norna model exists.

This target gives a migration tool or human-assisted migration a deterministic
contract. It does not require Norna to execute React, Vue, Liquid, Tera,
Nunjucks, shortcodes, plugins, or competitor configuration.

## Review Baseline

The Norna baseline is version `0.7.23` at commit
`ed01ebe89f68b18671c3c5fdf98b1e564a8f0885`, reviewed on 6 September 2026.
Uncommitted worktree changes were excluded from capability claims.

The primary evidence comes from the current English documentation and source
of systems closest to Norna's documentation use case:

| System | Reviewed source | Official feature reference |
| --- | --- | --- |
| Docusaurus | [`a3e5eba`](https://github.com/facebook/docusaurus/commit/a3e5eba69a405a686385da933bd271678fc44e65) | [Markdown features](https://docusaurus.io/docs/markdown-features) |
| VitePress | [`3e681e2`](https://github.com/vuejs/vitepress/commit/3e681e2ffd89b84d017fe0516d4b3af365950abb) | [Markdown extensions](https://vitepress.dev/guide/markdown) |
| Material for MkDocs | [`9d65447`](https://github.com/squidfunk/mkdocs-material/commit/9d65447eb4039c153edefbc378029257886737ff) | [Reference](https://squidfunk.github.io/mkdocs-material/reference/) |
| Astro Starlight | [`38149a0`](https://github.com/withastro/starlight/commit/38149a0597e99bc250160c7f4d27ccccaec3a18a) | [Authoring content](https://starlight.astro.build/guides/authoring-content/) |

File-level searches are indicators of migration frequency, not usage counts.
In the reviewed source:

- Docusaurus used admonitions in 76 of 94 documentation files, tabs in 16,
  and `details` in 18.
- VitePress used custom containers or details in 15 of 36 files, code groups
  in 3, and imported code snippets in 5.
- Material for MkDocs used admonitions or details in 44 of 96 files, content
  tabs in 38, footnotes in 31, and rich code metadata in 35.
- Starlight's 37 English source files used asides in 10 files, tabs in 8,
  steps in 8, file trees in 7, and cards in 6.

The secondary systems establish architecture boundaries and less
documentation-specific migration cases:

- [Hugo](https://gohugo.io/documentation/) provides page bundles,
  [shortcodes](https://gohugo.io/content-management/shortcodes/), taxonomies,
  data sources, and multilingual content.
- [Eleventy](https://www.11ty.dev/) provides multiple template languages,
  [shortcodes](https://www.11ty.dev/docs/shortcodes/), a data cascade,
  collections, and pagination.
- [Zola](https://www.getzola.org/documentation/content/overview/) now treats
  content as Tera templates and components; current Zola has removed its old
  shortcode model. It also provides taxonomies and multilingual content.
- [Lume](https://lume.land/docs/core/concepts/) composes pages, data, includes,
  components, and plugins.
- [Astro](https://docs.astro.build/en/guides/content/) supports Markdown, MDX,
  components, typed content collections, and generated routes.
- [Jekyll](https://jekyllrb.com/docs/) provides Liquid templates,
  [includes](https://jekyllrb.com/docs/includes/), data files, collections,
  posts, and plugins.

## Norna Today

Norna already provides more migration foundation than a list of Markdown
blocks suggests:

- one shared model for arbitrarily nested pages, navigation-only categories,
  ordered siblings, H1 page identity, H2 sections, and H3 page outlines;
- checked internal page, heading, alias, card, and public-file links;
- old-URL aliases and safe page-tree moves that update affected links;
- GFM tables, task lists, strikethrough, and reference footnotes through the
  Markdown renderer;
- syntax-highlighted code fences with optional client-side copy controls;
- managed image stacks, carousels, cards, raster variants, SVG output,
  captions, alternative text, and image relocation;
- numbered side notes, presets, responsive navigation, static output,
  sitemap, social metadata, and a generated 404 page.

The deliberately closed content extensions are `norna-image-stack`,
`norna-image-carousel`, and `norna-card-list`. Norna does not execute arbitrary
components or templates from content, generate recurring pages from data, or
provide native callouts, tabs, imported code snippets, mathematics, or diagram
source rendering.

Support classifications used below are:

- **Existing:** Norna preserves the behavior directly.
- **Complement:** the underlying model exists, but migration quality needs a
  small parser, presentation, validation, or documentation addition.
- **New feature:** a bounded new author-facing construct or build step.
- **Architectural:** the capability needs a wider content, page-generation,
  localization, versioning, or extension model.

## Priority Table

Migration priority measures expected information loss and prevalence in source
documentation. Product priority measures value to Norna sites after migration.
`M1` and `P1` are highest.

| Priority | Feature and class | User value and typical use | Reference products | Norna fit | Complexity | Main risks and dependencies |
| --- | --- | --- | --- | --- | --- | --- |
| M0 / P0 | Common Markdown and GFM, **existing** | Preserves prose, headings, lists, tables, task lists, links, code, and reference footnotes for every site. | [VitePress](https://vitepress.dev/guide/markdown), [Docusaurus](https://docusaurus.io/docs/markdown-features), [MkDocs](https://www.mkdocs.org/user-guide/writing-your-docs/) | Exact for the common subset; validate and document footnotes explicitly. | Low | Dialect-specific inline footnotes, attributes, emoji shortcodes, and heading metadata need normalization. |
| M0 / P0 | Page hierarchy and links, **existing** | Preserves findability and direct URLs for any multi-page site. | All reviewed systems | Strong fit with page directories, categories, aliases, link checks, and `page:move`. | Medium migration work | Sidebar config may not match source directories; migration must create one explicit ordered tree. |
| M1 / P1 | Semantic callouts, **complement** | Keeps warnings, prerequisites, tips, and hazards visible to readers of procedures and reference material. | [Docusaurus](https://docusaurus.io/docs/markdown-features/admonitions), [VitePress](https://vitepress.dev/guide/markdown#custom-containers), [Material](https://squidfunk.github.io/mkdocs-material/reference/admonitions/), [Starlight](https://starlight.astro.build/components/asides/) | Excellent fit as one engine-owned semantic construct; already scoped by `BL-009`. | Medium | Type mapping, localization, accessibility, nesting, search, and preset contrast. Use meaning, not arbitrary color. |
| M1 / P1 | Code titles and emphasis, **complement** | Preserves filenames, changed lines, and the point of technical examples for developer documentation. | [Docusaurus](https://docusaurus.io/docs/markdown-features/code-blocks), [VitePress](https://vitepress.dev/guide/markdown#syntax-highlighting-in-code-blocks), [Material](https://squidfunk.github.io/mkdocs-material/reference/code-blocks/), [Starlight](https://starlight.astro.build/components/code/) | Strong fit as closed metadata on ordinary code fences. | Medium | Competing metadata dialects, escaping, highlighted-line semantics, copy output, and highlighter integration. |
| M1 / P2 | Content alternatives and code groups, **new feature** | Lets readers choose one operating system, package manager, language, or API variant without reading every equivalent path. | [Docusaurus](https://docusaurus.io/docs/markdown-features/tabs), [VitePress](https://vitepress.dev/guide/markdown#code-groups), [Material](https://squidfunk.github.io/mkdocs-material/reference/content-tabs/), [Starlight](https://starlight.astro.build/components/tabs/) | Plausible only as one constrained, progressively enhanced Norna construct. | High | Authoring syntax, nested Markdown, deep links, print/no-JS output, search, accessibility, persistence, and whether alternatives may contain whole sections. |
| M1 / P2 | Source-backed code excerpts, **new feature** | Keeps documentation examples synchronized with real source files in developer projects. | [VitePress](https://vitepress.dev/guide/markdown#import-code-snippets), [Material](https://squidfunk.github.io/mkdocs-material/reference/code-blocks/), [Starlight](https://starlight.astro.build/components/code/), Jekyll and general SSG includes | Good fit for embedded project documentation if paths remain declarative and build-time only. | Medium-high | Allowed roots, symlinks, package contents, regions, watch invalidation, missing files, and standalone-site usefulness. |
| M1 / P2 | Standard reference footnote contract, **complement** | Preserves citations and supplemental notes where one-note-per-paragraph side notes are unsuitable. | [VitePress](https://vitepress.dev/guide/markdown#footnotes), [Material](https://squidfunk.github.io/mkdocs-material/reference/footnotes/) | Parsing already works through GFM; Norna needs explicit tests, styling, localization, and documentation. | Low | Footnotes can be confused with Norna side notes; labels and backlinks must be localized and accessible. |
| M2 / P1 | Static search, **new standalone feature** | Restores content discovery on larger migrated documentation sites. | [MkDocs](https://www.mkdocs.org/user-guide/configuration/#plugins), [VitePress](https://vitepress.dev/reference/default-theme-search), [Starlight](https://starlight.astro.build/guides/site-search/), [Docusaurus](https://docusaurus.io/docs/search) | Strong fit as a post-build index over final HTML; already scoped by `BL-005`. | Medium-high | Index size, languages, local refresh, base paths, result anchors, and package impact. |
| M2 / P1 | Previous and next links, **new standalone feature** | Supports sequential tutorials without reopening navigation. | [MkDocs](https://www.mkdocs.org/user-guide/), [VitePress](https://vitepress.dev/reference/default-theme-prev-next-links), [Starlight](https://starlight.astro.build/reference/configuration/) | Strong fit derived from Norna's listed page graph; already scoped by `BL-006`. | Low-medium | Sequence boundaries and categories; no new source syntax should be required. |
| M2 / P2 | Explicit generated child-page list, **new standalone feature** | Preserves category landing pages and maintained overview grids without copying child links by hand. | [Docusaurus](https://docusaurus.io/docs/sidebar/autogenerated#category-item-metadata), [Material](https://squidfunk.github.io/mkdocs-material/reference/grids/), [Starlight](https://starlight.astro.build/components/card-grids/) | Strong fit as explicit `norna-page-list`; already scoped by `BL-007`. | Medium | Must reuse the page graph and remain opt-in so navigation is not duplicated automatically. |
| M2 / P2 | Collapsible details, **existing alternative** | Keeps optional troubleshooting and long explanations compact. | [Docusaurus](https://docusaurus.io/docs/markdown-features#details), [VitePress](https://vitepress.dev/guide/markdown#custom-containers), [Material](https://squidfunk.github.io/mkdocs-material/reference/admonitions/#collapsible-blocks) | Native `<details>` and `<summary>` survive Markdown rendering and work without JavaScript. | Low | Styling and Markdown indentation differ among dialects; nested details need migration tests, not a new Norna block. |
| M2 / P3 | Steps and file trees, **existing alternatives** | Presents procedures and directory layouts clearly. | [Starlight steps](https://starlight.astro.build/components/steps/), [Starlight file trees](https://starlight.astro.build/components/file-tree/) | Ordered lists and text code fences preserve the information with less custom syntax. | Low | A less decorative result is acceptable; do not add components unless real readers fail to understand the fallback. |
| M2 / P3 | Edit-source links, **new standalone feature** | Lets contributors jump from published documentation to the current source file. | [VitePress](https://vitepress.dev/reference/default-theme-edit-link), [Starlight](https://starlight.astro.build/reference/configuration/#editlink), [MkDocs](https://www.mkdocs.org/user-guide/configuration/#edit_uri) | Strong fit from source identity already present in the page model; scoped by `BL-011`. | Low-medium | Repository branch, subdirectory, uncommitted local preview, and non-Git hosts. |
| M3 / P3 | Mermaid diagrams, **new feature or static conversion** | Keeps editable architecture and process diagrams near technical prose. | [Docusaurus](https://docusaurus.io/docs/markdown-features/diagrams), [Material](https://squidfunk.github.io/mkdocs-material/reference/diagrams/), VitePress and Starlight plugins | Pre-rendered managed SVG is a good migration fallback. Native source rendering fits only as a build-time, engine-owned transformation. | Medium-high | Dependency weight, security, accessibility text, theming, deterministic output, and SVG lifecycle. |
| M3 / P3 | Mathematics, **new feature or static conversion** | Preserves formulas in scientific and API documentation. | [Docusaurus](https://docusaurus.io/docs/markdown-features/math-equations), [VitePress](https://vitepress.dev/guide/markdown#math-equations), Material extensions | Static HTML or SVG can preserve a bounded migration. Native support would need one accessible build-time renderer. | Medium-high | Syntax variants, accessibility, fonts, CSS, package size, and low relevance to most Norna sites. |
| M3 / P4 | General Markdown includes, **architectural** | Avoids duplicated prose and shared fragments in large manuals. | [VitePress](https://vitepress.dev/guide/markdown#markdown-file-inclusion), [Jekyll](https://jekyllrb.com/docs/includes/), [Lume](https://lume.land/docs/core/concepts/), Eleventy | Expand includes during migration and retain a provenance comment. A permanent include model weakens page ownership and file locality. | High | Cycles, heading ids, link bases, image ownership, watch dependencies, diagnostics, and editor discoverability. |
| M4 / P4 | Arbitrary components, templates, and plugins, **architectural** | Enables bespoke interactive demos and generated layouts. | [Docusaurus MDX](https://docusaurus.io/docs/markdown-features/react), [Astro MDX](https://docs.astro.build/en/guides/integrations-guide/mdx/), [Lume components](https://lume.land/docs/core/components/), Hugo, Eleventy, Zola, Jekyll | Poor fit. Rewrite to supported content, static output, or an external application. `BL-026` deliberately defers a general API. | Very high | Erases Norna's closed presentation contract and transfers architecture, security, and maintenance to every site. |
| M4 / P4 | Collections, taxonomies, pagination, posts, and feeds, **architectural** | Supports blogs, catalogs, changelogs, and recurring records. | [Hugo taxonomies](https://gohugo.io/content-management/taxonomies/), [Eleventy collections](https://www.11ty.dev/docs/collections/), [Zola taxonomies](https://www.getzola.org/documentation/content/taxonomies/), [Jekyll collections](https://jekyllrb.com/docs/collections/) | These form one generated-content model, not a Markdown display feature. They remain deferred together in `BL-024`. | Very high | New content identity, dates, generated routes, pagination, feeds, templates, and navigation rules. |
| M4 / P4 | Multilingual and versioned page trees, **architectural** | Serves translated sites and parallel documentation releases. | [Hugo multilingual](https://gohugo.io/content-management/multilingual/), [Zola multilingual](https://www.getzola.org/documentation/content/multilingual/), [Docusaurus i18n](https://docusaurus.io/docs/i18n/introduction), [Docusaurus versioning](https://docusaurus.io/docs/versioning), [Starlight i18n](https://starlight.astro.build/guides/i18n/) | Requires coordinated tree identities, selectors, URLs, metadata, search, and fallback policy. Deferred in `BL-023` and `BL-025`. | Very high | Permanent multiplication of every page, navigation, link, asset, search, and publishing contract. |

## Translation Rules

These examples separate an immediately usable migration from a possible native
feature. The simple form is intentionally less interactive, but it must retain
the source information.

### Semantic Callouts

Source dialects use different markers:

```md
:::warning[Back up first]
Save the current configuration before replacing it.
:::
```

The loss-minimizing Norna rewrite is an ordinary blockquote:

```md
> **Warning: Back up first.**
>
> Save the current configuration before replacing it.
```

The better native contract should interpret the interoperable GitHub alert
form while retaining its readable blockquote fallback:

```md
> [!WARNING]
> Save the current configuration before replacing it.
```

`BL-009` should decide the closed tone mapping and optional-title rule. The
first release should reject nested callouts and arbitrary colors.

### Code Titles And Emphasis

Rich code dialects commonly attach a filename and emphasized lines to a fence:

````md
```js title="src/config.js" {2}
export default {
  mode: 'safe',
};
```
````

Norna currently keeps the code and language but discards the metadata. A
loss-minimizing rewrite makes the filename and explanation visible:

````md
**`src/config.js`**

```js
export default {
  mode: 'safe', // Keep this value.
};
```
````

A native contract should extend ordinary fences with a small documented
metadata grammar. Start with a title. Add line emphasis, insertions, deletions,
and line numbers only when each has semantic HTML, accessible non-color cues,
stable copy behavior, and deterministic output.

### Tabs And Content Alternatives

Tabs frequently encode equivalent choices:

```mdx
<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm">npm install</TabItem>
  <TabItem value="pnpm" label="pnpm">pnpm install</TabItem>
</Tabs>
```

The safe migration is to show every alternative under a heading at the next
legal depth:

````md
### npm

```sh
npm install
```

### pnpm

```sh
pnpm install
```
````

If a native construct is accepted, all alternatives must remain in document
order and readable without JavaScript. Tab labels must not become page-outline
headings when their panels are enhanced. The contract must separately decide:

- code-only groups versus arbitrary Markdown;
- one group on one page versus a synchronized choice across pages;
- linkable alternatives and back/forward behavior;
- print, search, copy, keyboard, and screen-reader output;
- whether H2 sections may ever be alternatives. The first release should not
  hide whole page sections.

### Imported Code

VitePress and Material can read source directly:

```md
<<< ../src/config.js#defaults
```

A one-time migration expands the selected source and records where it came
from:

````md
<!-- migrated-code-source: ../src/config.js#defaults -->

```js
export const defaults = { mode: 'safe' };
```
````

That is portable but can become stale. A native Norna feature could use a
declarative block that names a project-relative file, language, optional
region, and displayed title. It must not execute the source. The design must
define allowed roots, symlink handling, missing regions, watch dependencies,
package contents, and behavior when a standalone site has no surrounding code
project.

### Footnotes And Side Notes

Reference footnotes already pass through Norna's GFM renderer:

```md
The setting applies to every page.[^scope]

[^scope]: A page-local theme may override presentation values.
```

VitePress's inline extension is not portable:

```md
The setting applies to every page.^[A page-local theme may override it.]
```

Convert that form to a named reference. Keep Norna's `{note-ref}` and
`{note: ...}` for the narrower case where a single explanatory note belongs
beside one paragraph. Reference footnotes and side notes should remain two
different authoring choices; migration must not force every citation into the
margin-note model.

### Details

Keep a standard HTML details element:

```md
<details>
<summary>Show troubleshooting</summary>

Restart the preview after changing external build configuration.

</details>
```

This remains keyboard-operable and readable without JavaScript. Migration only
needs to normalize competitor fence syntax and spacing around Markdown inside
the HTML element. A Norna-specific details block would add syntax without
adding meaning.

### Steps

Replace decorative step components with a normal ordered list:

```md
1. Install Norna.
2. Start local preview.
3. Edit `content.md`.
```

Nested paragraphs and code stay indented under the relevant list item. This
preserves sequence and accessibility. Styling ordered procedures can remain a
preset concern if a later usability test justifies it.

### File Trees

Replace a file-tree component with a text code block:

```text
site/
|-- theme.yaml
`-- pages/
    `-- 000-home/
        `-- content.md
```

The result is less interactive but portable, copyable, and unambiguous.
Collapsible directories and file icons are not migration requirements.

### Generated Child Indexes

Docusaurus can create a category index from sidebar children. The immediate
Norna migration writes an ordinary link list or `norna-card-list` from the
current children. That snapshot preserves the destinations but must be updated
manually after page moves.

The better handling is the explicit `norna-page-list` from `BL-007`. It should
derive only direct children from the same page graph as navigation and
previous/next links. Norna should never inject a duplicate child list merely
because a page has children.

### Diagrams

Convert Mermaid or similar diagram source to a local SVG and place it through
`norna-image-stack`. Preserve the original diagram source beside the migration
work or in a provenance comment so a maintainer can regenerate it.

Native rendering is justified only if several Norna sites need to edit diagram
source regularly. It should then run at build time, generate deterministic SVG,
accept an accessible description, and add no JavaScript to the reading page.

### Mathematics

For a bounded migration, pre-render formulas to accessible static output and
retain their source. Plain Unicode or HTML is preferable for simple formulas;
SVG is a fallback for complex display mathematics.

Native mathematics would need one closed syntax and one build-time renderer.
It should not be bundled merely because documentation frameworks offer a
plugin: scientific sites must first justify the permanent fonts,
accessibility, rendering, and package contracts.

### Includes And Shared Fragments

Expand prose includes at migration time and add a source comment when the
origin matters. For included code, use the imported-code rule above.

Do not add a general include directive as a shortcut. It would create
cross-file ownership for headings, ids, links, notes, images, and diagnostics,
which conflicts with Norna's page-local content model. Reconsider only with a
real repeated-content case that cannot be represented as site-wide content,
page structure, or generated navigation.

### MDX, Templates, And Components

Render the source system first, inspect what the component communicates, then
rewrite it as prose, a link, a managed image, a card list, or one accepted
Norna construct. For an interactive application or playground, link to a
separately built application rather than embedding its implementation model in
Norna content.

This is an explicit boundary, not a missing migration parser. A converter must
stop and report unresolved imports, JSX, template expressions, shortcodes, and
plugin output.

## Site-Level Compatibility

Some differences do not alter page source but still affect whether a migrated
documentation site feels complete:

- `BL-006` previous/next navigation restores deliberate sequential reading.
- `BL-007` child-page lists replace generated category landing pages when an
  author explicitly wants one.
- `BL-005` static search restores discovery for larger sites.
- `BL-008` filtering and expansion controls keep a long page tree usable.
- `BL-011` edit-source links preserve the contribution path used by open-source
  documentation.

These should reuse the existing page and link graphs. They should not be
implemented as migration-only metadata.

## Explicit Deferrals

The review does not justify the following as opportunistic additions:

- multilingual trees (`BL-023`);
- collections, taxonomies, pagination, posts, and feeds (`BL-024`);
- versioned documentation (`BL-025`);
- a general template, component, shortcode, or plugin API (`BL-026`);
- draft and scheduled publication (`BL-039`).

A site that fundamentally depends on one of these models should normally stay
on a generator designed for it. Flattening generated pages to static Norna
pages is possible for archival migration, but it gives up the source system
that generated them.

## Recommended Sequence

This sequence ranks migration coverage. The dependency-ordered implementation
queue in `BACKLOG.md` remains authoritative when one item relies on another
part of the page or search model.

1. **Standard footnote contract.** Lock down and document behavior already
   present in the renderer. This is low-cost migration coverage.
2. **Semantic callouts (`BL-009`).** They are the most prevalent lossy
   construct and fit Norna's closed semantic model.
3. **Code titles and emphasis.** Preserve the explanatory structure of
   technical examples before attempting broader interactive blocks.
4. **Content alternatives.** Decide a readable no-JavaScript contract using a
   representative Docusaurus, Material, VitePress, and Starlight corpus.
5. **Source-backed code excerpts.** Add only after path and package boundaries
   are proven for both standalone and embedded sites.
6. **Existing site-level sequence.** Continue with previous/next links,
   explicit child lists, search, long-tree controls, and edit-source links in
   their dependency order.
7. **Diagrams and mathematics.** Retain static conversion until real Norna
   sites demonstrate repeated source-editing needs.

The first four steps produce the largest gain in documentation migration
without turning Norna into a general-purpose component runtime.
