# BL-090: Readable Examples With Exact Source And Clear Syntax Boundaries

## Status

Implemented. The six-column table retains ten representative rows with short
cells, and the displayed source matches it. The page now distinguishes GFM
tables, the Norna row-heading marker, GitHub-style alerts, and the additional
DANGER type. Shared configuration matches the linked demonstration; code and
caption explanations no longer assume a particular layout. Reusable source
fidelity rules were added to the documentation style guide.

Content and documentation checks passed. The final audit in
[BL-091: Final examples audit against implemented behavior](BL-091-final-examples-implementation-audit.md)
checks the complete combined result; human gallery review is still pending.

## Problem

The comparison table uses long explanatory sentences that make its Markdown
source difficult to scan. Source classifications can also conceal Norna
extensions: `{row-header}` is not standard Markdown, and GitHub-style alerts
must not be presented as part of the formal GFM specification.

## Outcome And Scope

Keep each example short enough to understand while preserving an exact,
reproducible relationship between the displayed source and rendered result.

- Shorten table cell text and column labels while retaining enough columns
  and rows to demonstrate sticky headings, available width, and overflow.
- Show the complete source for the displayed example. Do not substitute an
  unexplained abbreviated table or depend on unreadably small type.
- Introduce ordinary Markdown tables first; identify the optional
  `{row-header}` annotation explicitly as a Norna extension.
- Distinguish standard Markdown, GFM tables, GitHub-style alerts supported by
  Norna, Norna-specific blocks, configuration, and CLI commands using concise,
  accurate labels. Avoid adding another conceptual preface to the gallery.
- Correct known source/result mismatches in shared-content and theme examples;
  disclose the minimal surrounding preset or site settings needed to reproduce
  a result without repeating the whole reference.
- Keep each canonical reference link adjacent to the relevant example and
  explain only boundaries that help the reader make a choice.
- Apply the source-fidelity and readability rules consistently to public
  examples; do not add page-specific CSS to hide engine defects.

## Acceptance And Verification

- The table source is substantially easier to scan and still exercises the
  implemented table behavior at representative widths.
- Each corrected result has copyable, supported source with necessary context.
- Source classifications and terminology match the actual parser and canonical
  reference. No Norna-specific marker is labelled standard Markdown.
- Follow `docs/design/documentation-style-guide.md` and update its example
  guidance only where a reusable rule is missing.
- Validate changed content and reference links, check the rendered examples,
  and leave the full section-by-section audit to the last item in the sequence.
