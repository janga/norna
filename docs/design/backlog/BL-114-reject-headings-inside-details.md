# BL-114: Reject Headings Inside Details

## Status

Implemented on 2026-09-15. Behavior approved on 2026-09-15.

## Problem And Evidence

Details disclosures hide optional content, but page headings should remain
outside them so section boundaries and navigation do not point into hidden
content. The summary is a disclosure label, not a page heading.

A focused check of `parsePageMarkdownSource` on 2026-09-15 found that a
Markdown H2, a Setext H2, and an HTML H2 inside `details` all produce no
diagnostics. Both Markdown forms also enter `navigationHeadings`; the HTML
form does not. Existing disclosure tests cover appearance, not this boundary.

## Required Outcome

- Reject H1-H6 inside authored `details`, including headings nested through
  other containers or inside `summary`. Cover Markdown ATX and Setext syntax
  and actual HTML heading elements, including case variants.
- Keep ordinary summary text, paragraphs, lists, and code examples valid.
  Literal heading examples in code, escaped text, and HTML comments must not
  trigger false positives. Generated navigation disclosures are unaffected.
- Use the shared content model and established parsing rules, not a new
  renderer-only or editor-only check. `content:check`, builds, and preview
  should report the source file and line with guidance to move the heading
  outside `details` or use ordinary emphasized text inside it. Avoid a later
  generic rendering failure or silently dropping headings.
- Add focused regressions for forbidden headings, valid disclosures, and
  headings outside disclosures. Reuse shared diagnostics in editor support
  where available; do not create a separate validation rule there.
- Document the restriction under Details Disclosures in `docs/content.md` and
  correct affected maintained examples. No new syntax or setting is needed.

This item does not change tabs or introduce collapsible semantic callouts.

## Implementation And Verification

The shared page model combines Markdown heading nodes with HTML scopes parsed
by `parse5`. Source positions are retained while literal Markdown examples are
excluded from HTML parsing. `parse5` was already a transitive dependency and
is now declared directly; no separate editor parser or configuration was added.

Content checks and the page loader reject the same diagnostic. The loader
validates before splitting a page into rendered sections, including when an
invalid disclosure contains an extra H1. Source line numbers include frontmatter.

Focused regression coverage includes ATX and Setext headings, HTML H1-H6,
nested disclosures and containers, summaries, quoted attributes, comments,
fenced/indented/inline code, escapes, HTML raw-text elements, and CRLF sources.
CLI, editor-language diagnostics, valid rendering, rejected builds, and the
preview page loader are exercised. All 106 maintained page sources were checked;
none required correction. The restriction is documented in `docs/content.md`.
