# BL-161: Norna-Shaped Alternatives To Common HTML

## Purpose

Help authors get a coherent, accessible and responsive result by showing when
to use a Norna construct instead of author-written HTML, while keeping HTML
available where it is useful and supported.

**Status: Needs evidence and decision; prioritized design discussion.** The
owner asked for an investigation of commonly used HTML patterns and how they
might have Norna-shaped equivalents. This is a design brief, not approval to
add syntax or prohibit HTML.

## Scope And Boundaries

Inventory common HTML patterns in Markdown content, establish what Norna and
the Markdown renderer already support, then decide which patterns merit a
Norna-native authoring path, better documentation, or no special treatment.
Consider authoring clarity, accessibility, responsive behavior, visual
consistency, browser behavior and maintenance cost.

Do not ban HTML, promise that all HTML is supported, or assume every element
needs a Norna wrapper. Do not conflate this investigation with HTML
sanitization/security review, image-management implementation, or a general
Markdown compatibility audit. Record safety or parser questions and route
them to the appropriate focused work.

## Decisions Made

- Authors should be encouraged to use Norna constructs when those constructs
  give readers a more coherent experience.
- HTML is not prohibited by this request.
- Existing useful HTML behavior must not be described as a gap without
  evidence.
- No particular HTML pattern or replacement has been approved.

## Preliminary Inventory And Priority

Use this as an evidence-gathering order, not a commitment to implement every
row:

1. **Images and captions:** `<img>`, `<figure>`, `<figcaption>`. Compare
   ordinary Markdown image syntax, managed image blocks, captions and title
   attributes. Coordinate with [BL-159 Managed Local Markdown Images](BL-159-managed-local-markdown-images.md).
2. **Callouts and notices:** custom `<div>` wrappers, classes and nested
   blockquotes used for tips, warnings or notes. Compare ordinary blockquotes
   and the existing GitHub-style alert syntax.
3. **Disclosure and expandable content:** `<details>` and `<summary>`. Record
   current rendering and constraints before considering a named Norna
   alternative; headings inside details already have a separate restriction.
4. **Tables and layout:** HTML tables, layout `<div>` elements, and
   side-by-side columns. Compare GFM tables and existing Norna constructs
   such as cards and tabs, without assuming they are interchangeable.
5. **Media and embeds:** `<video>`, `<audio>` and `<iframe>`. Establish real
   author needs and accessibility/fallback behavior before proposing a
   Norna equivalent.
6. **Inline semantics:** `<sub>`, `<sup>`, `<kbd>`, `<mark>` and span-based
   styling. Determine which simple semantic elements should remain ordinary
   HTML and whether any have a useful documented Norna form.

Also inventory scripts, forms, custom elements and arbitrary attributes only
to establish the current authoring and publication boundary; do not elevate
them to feature candidates without concrete user evidence.

## Open Questions

1. Which patterns appear in maintained content, incoming examples, support
   requests or common author workflows? Which are merely familiar from HTML?
2. What HTML survives Markdown parsing, what does Norna style or transform,
   and what works after a production build? Are there meaningful differences
   between inline and block HTML?
3. For each high-use case, does a current Norna construct already solve the
   reader need? If not, is a semantic authoring construct clearer than HTML,
   or is HTML the simplest appropriate tool?
4. Which alternatives should be taught under Examples, and what exact
   examples distinguish standard Markdown, GFM, Norna extensions and HTML?
5. What constraints matter for accessibility, narrow screens, no JavaScript,
   print, themes and localization?
6. What documentation should say about the boundary of HTML support without
   implying either a blanket guarantee or a ban?

## Ready For Implementation When

- The inventory is backed by source searches and representative rendered
  examples, with current behavior separated from proposals.
- Each high-priority pattern is classified as: use an existing Norna
  construct; improve documentation only; consider a new construct with a
  scoped proposal; or leave HTML as the appropriate option.
- Any new constructs have a named reader benefit, syntax proposal, fallback
  behavior and accessibility/responsive requirements.
- The Examples placement and language about HTML's continued availability
  are settled.
- Security or raw-HTML processing concerns are referred to a separate review
  rather than being silently resolved here.
