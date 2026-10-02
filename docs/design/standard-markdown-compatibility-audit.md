# Standard Markdown Compatibility Audit — BL-162

Completed on 2026-10-02. This is a representative end-to-end audit of author
syntax, not a claim that Norna passes every CommonMark or GFM specification
example. The executable fixture is
[`scripts/test-standard-markdown-compatibility.mjs`](../../scripts/test-standard-markdown-compatibility.mjs).

## Pipeline Reviewed

- `satteri` 0.9.5 is installed through `@astrojs/markdown-satteri` 0.3.4.
  `astro.config.mjs` enables GFM with localized footnote labels, then runs
  Norna's notes and Markdown plugins and its table plugin. Other parser
  extensions such as math, directives and wikilinks are not enabled.
- `scripts/lib/page-markdown.mjs` parses the source for the page model and
  diagnostics. `scripts/lib/heading-ids.mjs` reads top-level H1–H3 headings.
  Norna requires one leading H1, turns top-level H2s into sections, and gives
  H2/H3 headings stable IDs. `src/lib/sectionContent.ts` combines the
  rendered regions and applies H3 IDs.
- Before rendering, `scripts/lib/attachment-render.mjs` can rewrite known
  page-owned attachment links. Site-relative links in the rendered page then
  receive the configured base path. Image ownership and local attachment
  details have separate investigations in
  [BL-159 Managed Local Markdown Images](backlog/BL-159-managed-local-markdown-images.md)
  and [BL-160 Standard Markdown For Local Attachments](backlog/BL-160-standard-markdown-local-attachments.md).

## Results From A Built Site

The fixture builds a site at `/docs/` and checks its generated HTML. It also
checks the page model and selected constraints before building.

| Syntax | Observed result |
| --- | --- |
| Paragraphs and breaks | Ordinary source newlines remain one paragraph; a trailing backslash makes a hard break. |
| Headings | ATX headings and underlined H1/H2 headings render. Explicit and derived section IDs work. A top-level H3 enters the page heading model. |
| Dividers and quotations | A thematic break and nested blockquote render. An H3 inside a quotation renders there but does not become a navigation heading. |
| Lists | Nested and loose lists render; an ordered list can start at 3. An H3 inside a list item renders there but does not become a navigation heading. |
| Code | Indented and tilde-fenced blocks render. Inline code can contain literal backticks. |
| Inline text | Strong/emphasis, strikethrough, escaped punctuation and an HTML entity render with their intended meaning. |
| Links | Inline and reference-style links retain optional titles and receive the `/docs/` deployment prefix. Plain web and email addresses become GFM links; angle-bracket autolinks also render. |
| Images | Remote inline and reference-style images retain their alternative text; an inline title is a title attribute, not a caption. |
| GFM tables and tasks | A table retains right-column alignment; task items render as checkboxes. Norna's separate responsive table behavior is covered by existing Examples checks. |
| Footnotes and alerts | A reference footnote and Norna's GitHub-style `NOTE` callout render. These are documented separately from the formal GFM set. |
| HTML | Simple `<kbd>` and `<h3>` elements pass through the current rendering pipeline. The HTML H3 is not a Norna navigation heading. This fixture does not establish a general HTML or security contract. |

The published Standard Markdown and Common Markdown Extensions pages show
representative source/result pairs. The reference now notes the underlined
heading form and distinguishes headings inside list/quotation content from
page navigation. It also names GFM automatic links.

## Bugs Corrected

- Underlined H1/H2 headings were parsed into the page model, but building a
  page containing one failed while rendering its title. `renderHeadingTitleHtml`
  now removes the underline before rendering the inline title.
- A Markdown H3 inside a quotation or list item, or an authored HTML H3, was
  counted by a global HTML match while Norna's heading model included only
  top-level Markdown H3s. Builds failed with a generic mismatch error. The
  Markdown renderer now marks top-level H3s for ID assignment; the marker is
  removed from the final HTML. Already-rendered content in Astro's cache is
  handled through its top-level HTML structure. The fixture includes nested,
  authored HTML and top-level Markdown H3s in the same section; the maintained
  documentation-site build exercises the cached-content path.

## Current Boundaries

- Norna's page structure is narrower than unrestricted Markdown: one leading
  H1, top-level H2 sections and unique H2/H3 IDs. Headings inside `details`
  are rejected with a focused diagnostic.
- Local Markdown images are outside the managed-image pipeline. The inline
  form is detected, while a reference-style local image was not found by the
  current image-reference scan. BL-159 owns that management and diagnostic
  decision. Public documentation no longer implies the warning covers every
  Markdown image form.
- BL-160, Standard Markdown For Local Attachments, separately checks local
  attachment link forms and their file lifecycle; this audit verified only
  ordinary page links and their base path.
- BL-161, Norna-Shaped Alternatives To Common HTML, reviews raw HTML authoring
  and support. The `<kbd>` result above is a narrow observation.

`npm run test:markdown-constructs` includes the new built-site fixture. The
documentation check and documentation-site build cover the public wording.
