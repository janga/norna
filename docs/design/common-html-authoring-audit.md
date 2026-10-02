# Common HTML Authoring Audit — BL-161

Completed on 2026-10-02. This audit recommends how to teach existing Norna
features alongside author-written HTML. It does not establish a general HTML
compatibility or security contract, and it proposes no new Norna syntax.

## Evidence

- A source search across maintained `site/root/`, `examples/`, `starters/` and
  `fixtures/` `content.md` files found authored `<details>` and `<summary>` in
  the public [details reference](../../site/root/pages/032-reference/pages/030-content/pages/070-details/content.md),
  but no live authored image figures, layout wrappers, media embeds or inline
  semantic HTML examples. The references to `<details>` in the newly updated
  Markdown pages are prose, not rendered HTML examples.
- A disposable site built through `createTempSite({ underRepoCache: true })`
  and `runNorna(['--site-dir', siteDir, 'build'])` emitted authored `<figure>`,
  `<img>`, `<figcaption>`, `<div>`, `<details>`, `<table>`, `<video>`, `<audio>`,
  `<iframe>`, `<sub>`, `<sup>`, `<kbd>`, `<mark>` and `<span>` markup. Markdown
  between blank lines inside a `<div>` rendered as a paragraph with bold text.
  The build is a static-output probe, not a browser, accessibility or security
  certification.
- In the same build, a GFM table received `.norna-table-frame` and scroll
  markup. A handwritten HTML `<table>` remained a plain table. A GitHub-style
  alert received a semantic callout label and styling; a handwritten `<div>`
  kept only the author's class. Authored `<img>` remained a plain image, while
  managed image blocks use Norna's image-processing path and figure markup.
- A second static-output probe retained authored `<script>`, `<form>`, a
  custom element and arbitrary `data-*` and `style` attributes. This only
  establishes what the current build emits. It makes no claim that such
  content is safe or supported as a product feature. The trust boundary is
  tracked separately in [BL-163](backlog/BL-163-author-html-publication-boundary.md).
- [BL-162's built-site audit](standard-markdown-compatibility-audit.md)
  also confirmed that `<kbd>` and an HTML H3 pass through, while the HTML H3
  does not become a Norna navigation heading. The current details reference
  documents the separate heading restriction inside `<details>`.

## Authoring Guidance By Pattern

| Pattern | Current option and recommendation | Classification |
| --- | --- | --- |
| Images and captions | `image-stack` supplies page-owned image validation, responsive variants, inspection and a visible caption. Ordinary Markdown images remain useful for external/public assets. A handwritten `<figure>` passes through but does not make its image managed. [BL-159](backlog/BL-159-managed-local-markdown-images.md) owns the open design for local Markdown images. | Use an existing Norna construct; coordinate with BL-159. |
| Tips, warnings and notices | Use GitHub-style alerts when one of Norna's documented semantic labels fits. A quotation remains a quotation. A custom `<div>` has no automatic callout meaning or styling. | Use an existing construct. |
| Expandable context | Native `<details>/<summary>` already works without JavaScript and has Norna styling and documented restrictions. | Keep HTML as the appropriate option. |
| Data tables | GFM tables receive Norna's responsive scrolling, sticky headings and sorting. Handwritten HTML tables survive, but the probe did not show the same wrapper. Advanced HTML table structures can remain author-owned. | Use GFM for ordinary data; leave advanced HTML as an option. |
| Cards, tabs and columns | `card-list` and tabs cover specific reading tasks, not arbitrary page layout. No maintained content demonstrates a need for a general column or layout `<div>` construct. | Use existing constructs for their stated purpose; do not add generic layout syntax now. |
| Video, audio and embeds | Native `<video>`, `<audio>` and `<iframe>` survive the build. Norna has no corresponding managed-media or embed contract. Authors must supply meaningful controls, fallback or titles as appropriate and check narrow layouts. | Leave HTML as the option until a concrete reader need supports a scoped feature. |
| Inline semantics | `<sub>`, `<sup>`, `<kbd>` and `<mark>` survive the probe. Ordinary Markdown covers emphasis and code; semantic HTML remains reasonable when those meanings are needed. Arbitrary `<span>` classes have no Norna styling contract. | Leave semantic HTML available; add no wrapper. |

## Documentation And Follow-up

The [Standard Markdown example](../../site/root/pages/030-examples/pages/010-standard-markdown/content.md)
now introduces HTML as part of CommonMark, recommends documented Norna
constructs where their behavior matters, and links to the native details
example. The Common Markdown Extensions page points back to that section;
HTML is not presented as a GFM-specific extension. The
[Markdown reference](../../site/root/pages/032-reference/pages/030-content/pages/010-markdown/content.md)
states the support boundary. A general catalog of every HTML element would
overpromise based on this narrow probe.

No new syntax follows from BL-161. A future request for managed media, embeds
or columns should identify an author task and reader benefit, then specify
fallback behavior, responsive layout, accessibility and localization before
implementation. Local Markdown images remain in BL-159. HTML sanitization and
trusted-versus-untrusted input remain in BL-163; this investigation does not
approve, prohibit or alter script execution.
