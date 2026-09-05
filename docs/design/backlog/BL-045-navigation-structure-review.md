# BL-045: Read-Only Navigation Structure Review

## Outcome

Site owners can inspect the navigation structure Norna derives from their files
before deciding whether to reorganize pages or categories.

## User Contract

`norna navigation:review` reads the selected site and reports:

- page and category counts, listed hierarchy depth, and sibling-group width;
- H2 and H3 counts for each page;
- resolved incoming and outgoing internal page links;
- the configured and effective navigation mode for each routable page;
- existing link-graph errors, measurable observations, and bounded review
  recommendations in separate groups.

`--format text` is the human-readable default. `--format json` emits a stable,
versioned object suitable for scripts. Findings never modify files and do not
claim that a subjective information-architecture choice is automatically wrong.

## First-Scope Recommendations

- Ask the user to review a category that has only one listed child.
- Ask the user to review unusually deep branches or wide sibling groups, while
  reporting the exact measured threshold and treating it as guidance rather
  than an error.
- Do not move pages, create categories, rewrite headings, or choose where a page
  contents outline should appear.

## Acceptance Criteria

- The command reuses the canonical page, Markdown, link, and navigation models.
- Text and JSON output describe the same deterministically ordered data.
- Unlisted page subtrees are excluded from navigation measurements but remain
  visible in the complete page inventory.
- Broken internal links appear as errors and produce a non-zero exit status.
- A valid site with review recommendations still exits successfully.
- Tests cover a homepage, category, nested pages, an unlisted subtree, H2/H3
  outlines, incoming and outgoing links, configured navigation, and malformed
  command options.
- Canonical command documentation defines the syntax, scope, output, review
  thresholds, and read-only guarantee.

## Non-Goals

- No source changes, interactive repair flow, or AI-generated judgment.
- No VS Code integration; editor diagnostics remain separate work.
- No adaptive page-contents placement decision; that remains `BL-044`.
