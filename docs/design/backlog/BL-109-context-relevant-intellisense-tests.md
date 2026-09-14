# BL-109: Context-Relevant IntelliSense Tests

## Outcome

**Complete, 2026-09-14.** Extend the editor workflow tests so Norna offers only
context-appropriate completions, not merely a desired candidate somewhere in
the result. This builds on the implemented editor contract in
[BL-108: Standard And Uniform Content Syntax](BL-108-standard-uniform-content-syntax.md).

## Scope And Acceptance

- A blank body line offers the six callout types and four fenced blocks without
  requiring a syntax prefix. Verify actual insertion, including after a fenced
  Markdown example. Literal and nested blank lines must not receive top-level
  templates.
- Check exact sets of Norna block names, fields, and enum values where the
  contract is unambiguous. Check both missing and unexpected candidates.
- Suppress active block suggestions at closing fences, inside literal Markdown
  examples, ordinary code, comments, and indented code.
- Offer fields only in their owning YAML mapping, not comments or multiline
  text; omit fields already present and fields belonging to other block types.
- Suppress note/callout suggestions in literal examples and contexts where the
  construct is not allowed. Do not leak Markdown snippets into frontmatter.
- Repeat requests after cursor movement, content edits, saving/reopening, file
  switching, and switching between compatible and incompatible project roots.
  No stale completion set may survive these transitions.
- Strengthen ownership checks: identify all Norna candidates, not only labels
  beginning with `Norna`. Check there are no duplicate embedded properties or
  enum suggestions in the supported Norna/Red Hat setup.
- Keep actual widget insertion and edit/save/reopen tests from the
  [editor workflow test plan](../editor-workflow-test-plan.md).

Do not promise to suppress arbitrary suggestions produced by other extensions
or AI tools. Test Norna's own output exactly and supported provider cooperation
separately. Do not modify the user's extension profile or authored files.

## Verification

Use inexpensive context/schema tests first, then the packaged VSIX integration
suite. Reuse its isolated workspace and stable test commands. Verify on current
and minimum supported VS Code; use the existing Prettier scenario to check
that relevance and persistence still hold with the documented save exception.

Update the durable test plan and fix regressions exposed by the new tests.
No site-layout or public-syntax change is intended; no visual approval is
required for completing this test work.

## Result

Exact candidate-set tests now cover Markdown context, embedded YAML ownership,
frontmatter mappings, and cursor/file/project transitions. The tests exposed
and drove fixes for snippets inside literal code examples, false closing-fence
detection, and property suggestions inside frontmatter text or the wrong map.

Passed: seven focused editor-block tests, the Markdown contract test, and the
packaged integration suite on VS Code 1.137.0 and 1.96.0. The same integration
suite passed with Prettier 12.4.0 active and Markdown save formatting disabled;
all runs used Red Hat YAML 1.24.0. These include widget acceptance and repeated
dirty edit/save/close/reopen cycles with exact LF/CRLF byte checks.

The blank-line discovery follow-up passed both VS Code versions, including
widget insertion of all six callout types. Prettier coexistence was not rerun
for this follow-up because save behavior was unchanged.

The full release suite was intentionally not run. The documentation/source
differences found during evaluation have been reconciled; the documentation
check passed against the staged implementation on 2026-09-14. The implementation
is committed together with the shared BL-108: Standard And Uniform Content
Syntax and BL-110: Context-Scoped Completion Priority contracts.

## Construction Selection Follow-up

The matrix now observes the real VS Code widget and selects every supported
content constructor across its documented entry contexts, including each image
and list block from a blank line. It checks actual insertion and saved bytes,
not just candidate availability. Complete-file templates now identify
themselves as `Complete file` to distinguish them from Red Hat's schema
suggestions. A widget test exposed and drove a fix for `$schema` being consumed
as a snippet variable when inserting YAML templates.

All 43 selection cases passed on VS Code 1.137.0 and 1.96.0 with Red Hat YAML
1.24.0. Each run records the tested extension bundle hash. The three unsupported
constructors below are reported separately and are not included in that count.

Remaining editor-support gaps: tabs, code titles, and code line emphasis.
These must not be described as selectable or covered by passing widget tests.
No new syntax or completion support for these gaps is implemented in this item.
See the construction matrix in the
[editor workflow test plan](../editor-workflow-test-plan.md) for exact coverage.
