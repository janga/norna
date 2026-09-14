# BL-108: Standard And Uniform Content Syntax

## Outcome And Gate

Make Norna's content syntax easier for authors and AI tools to learn and easier
for IntelliSense to describe, by using established formats and consistent
rules instead of YAML-like text and context-specific alternatives.

**Complete, 2026-09-14.** The user approved the multiple-note presentation
fixture and public example on 2026-09-13. Canonical references, public examples,
editor guidance, and client-JavaScript documentation now describe the approved
syntax and note behavior.

The user approved the
[syntax handbook](../content-syntax-handbook-draft.md) and its remaining parser
defaults, including YAML boundaries, string/null rules, note definitions, and
footnote behavior in tabs. Simpler IntelliSense, especially its interaction
with other modules, is an explicit acceptance outcome. Implementation must
verify library behavior and editor integration rather than treat those
technical assumptions as already proven.

## Implementation Checkpoint

- Structured image/card blocks use YAML 1.2 Core and `items`. Engine validation,
  generated JSON schemas, and embedded Markdown completions share one field
  contract. The editor API is now version 2 so older engines do not receive
  incompatible snippets.
- YAML scalar source ranges preserve safe card-link updates in `page:move`,
  including quoted/escaped values, flow mappings, folded scalars, and CRLF.
- GitHub alerts are the only callout form, also in tabs. Code titles and tab
  labels share JSON string decoding. Norna no longer repairs Markdown on save;
  the scoped supported formatter setup is documented in the editor reference
  and FAQ.
- Named sidenotes resolve across the page, accept multiple notes per paragraph,
  and use letters independently of numbered footnotes. Return links reveal and
  focus footnote references inside tabs. Maintained content uses the new syntax.
- Notes share a collision-safe paragraph layout. Long or multiple notes can
  increase the space before the next paragraph; that approved tradeoff is
  documented with the responsive and print behavior.
- Sidenote reference hover and keyboard focus now highlight the matching note
  without changing layout or navigating. Note enhancement loads independently
  of tabs. The reference and public example explain this behavior.
  Focused browser checks passed for hover/focus, a page without tabs, and
  footnote return links after separating the scripts:
  `node scripts/test-navigation.mjs --site-dir fixtures/preset-baseline/site tests/named-notes.spec.ts --grep 'hover|return links'`
  (3 tests). No broad suite was repeated for this follow-up.

Verification completed: YAML/schema tests; Markdown/tab/string tests;
`test:content-check`, `test:content-sync-plan`, `test:content-sync`,
`test:page-move`, `test:site-links`, `test:page-content`, `test:managed-media`,
`test:markdown-constructs`, `test:presentation-review`, `test:examples`,
`test:client-javascript`, `test:ci-lockfile`, `test:dead-code`, `package:check`,
and the documentation build. Named-note unit tests and browser checks cover
multiple/adjacent notes, 320-1920px, all reading widths, Focus reading, tab return
focus, no JavaScript, and print. Existing navigation-note browser assertions
were updated from float implementation details to actual two-column placement.
Packaged editor integration passed on VS Code 1.137.0 and 1.96.0; the API 2
VSIX is built at `editors/vscode/norna-vscode.vsix` for manual evaluation.
Follow-up: block snippets previously returned by the completion provider were
filtered out by the suggestion widget because their replacement range included
the fence but their filter text did not. The corrected VSIX was verified by
accepting suggestions in the editor after backtick and tilde fences, both bare
and with a partial block name (`test:editor-integration`, VS Code 1.137.0).
The full release suite was not run.

Editor follow-up: the [workflow test plan](../editor-workflow-test-plan.md)
defines real suggestion-widget acceptance, three dirty save/close/reopen cycles
with exact LF/CRLF file checks, continued completion after reopening, and
diagnostic repair. A separate run installs active Prettier with the documented
Markdown save-formatting exception. These tests exposed and corrected missing
callout filter text; provider-only checks had not caught the unusable suggestion.

The approved review examples remain available at
`http://127.0.0.1:4322/reading-and-images/#sidenotes` and the public example at
`http://127.0.0.1:4321/norna/examples/#sidenotes`. Reference/source syntax is
updated, including paragraph spacing, hover/focus highlighting, and the
no-JavaScript behavior. Final verification used an isolated export of the
Git index so unrelated table/migration work and the user's invalid local theme
setting did not enter the tested implementation. See the editor workflow test
plan for the final checks and remaining editor-constructor gaps, which do not
change this syntax contract.

This is one coordinated item with separate implementation commits. Do not
introduce additional backlog items merely to divide its implementation steps.

## Original Problems

- Image/card data looks like YAML but uses a custom line parser. YAML multiline
  scalars do not work, quoted strings have different semantics, and duplicate
  fields can silently overwrite earlier values.
- Card-list options followed by a bare sequence do not form one valid YAML
  document.
- Callouts have a second authoring form specifically inside tabs.
- Sidenotes use positional `{note-ref}` / `{note: ...}` pairing and allow only
  one pair per paragraph, unlike named reference footnotes.
- Tab labels, code titles, and structured text fields have different string
  decoding rules. Decide which differences follow a standard and which are
  accidental before promising long-term compatibility.

Relevant implementation: `scripts/lib/norna-markdown-blocks.mjs`,
`scripts/lib/content-tabs.mjs`, `scripts/lib/semantic-callouts.mjs`,
`scripts/lib/code-fence-metadata.mjs`, and `src/lib/sectionContent.ts`.

## Approved Direction

- Optimize for standards and uniformity, not minimal character count.
- No backward-compatibility layer and no automatic migration tool. Update
  repository-owned maintained content during implementation. This decision is
  specific to this change, not permission for arbitrary future breakage.
- Use real YAML for image/card block data. Put list entries under `items` and
  supported block-level options beside it. Retain `image-stack`,
  `image-carousel`, `card-list`, and `page-list` names.
- Use established YAML quoting and multiline rules, strict field types, and
  errors for duplicate or unknown fields. Define empty-value validity per field.
- Keep GitHub-style alerts as the only callout authoring form, inside and
  outside tabs. Remove the tab-specific colon callout form. Preserve the closed
  semantic type set and neutral warning-producing fallback for unknown types.
- Use `[^margin:name]` and matching definitions for sidenotes, distinct from
  ordinary `[^name]` reference footnotes. Allow several sidenotes per paragraph.
- Letter sidenotes by first reference order: `a` through `z`, then `aa`, `ab`,
  and so on. Footnotes keep a separate numeric series. No limit or automatic
  warning at 26 sidenotes; do not renumber on viewport changes.
- One sidenote definition has one reference. Ordinary footnotes can be reused.
- Sidenote references belong only in ordinary body paragraphs, not in tabs,
  callouts, tables, or other containers. Ordinary footnotes remain allowed in
  tabs, callouts, and tables.
- Sidenote bodies are one paragraph with emphasis, strong emphasis, links, and
  inline code. No headings, lists, images, tables, code blocks, containers, or
  further note references. Source wrapping does not create another paragraph.
- Keep three syntax families: YAML-based structured blocks, colon-delimited
  tabs containing Markdown, and familiar Markdown text/reference constructs.
  Retain native HTML `details`; do not invent another disclosure syntax.

## Work Order After Approval

1. Verify the editor ownership boundary and parser capabilities, then implement
   the approved YAML contract and block schemas. Share the field
   contract with validation/editor support; cover image discovery, rendering,
   link checking, and source-editing commands such as `content:sync` and
   `page:move`, not just the parser's happy path.
2. Remove context-dependent callout syntax and align validation, rendering,
   source highlighting, and completion examples inside and outside tabs.
3. Implement named sidenote resolution at page scope, separate display marker
   series, content boundaries, and multiple-note placement without collisions.
   Ensure ordinary footnote return links can reveal the containing tab.
4. Reconcile string rules, editor completions, diagnostics, maintained fixtures,
   starter content, and examples with the approved handbook. Update any private
   evaluation material only explicitly and in its own repository.
5. Finish canonical references and public examples after the relevant gate in
   the agent instructions. Purely deterministic syntax documentation need not
   wait for a visual review; changed note layout does.

Keep each intermediate commit coherent with its focused tests. Do not ship a
new parser while source-rewriting commands or editor suggestions still produce
the previous data format.

## IntelliSense Simplification

Make simpler editor integration an acceptance outcome, not just a hoped-for
side effect of changing the source format.

- Define block fields, types, defaults, and allowed values once. Reuse that
  contract for engine validation, schemas, completion information, and example
  snippets instead of maintaining parallel descriptions.
- Use an established YAML parser for syntax and a shared schema for data shape.
  Keep Norna-specific checks for semantic relationships such as managed image
  lookup, links, and cross-block constraints that the schema cannot express.
- Red Hat currently provides YAML-file support. Do not assume that it also
  validates YAML inside a Markdown fence labelled `image-stack` or `card-list`.
  Verify the supported integration point before assigning embedded blocks to
  it; otherwise retain a small Norna-owned Markdown adapter with source-position
  mapping and the same field contract.
- Give each document region an explicit owner for completion, diagnostics,
  and formatting. Avoid duplicate suggestions and duplicate errors for the
  same issue. Do not introduce competing save-time repairs or require disabling
  unrelated extensions globally.
- Test repeated saves and explicit formatting with the recommended supported
  formatter configuration. Do not promise compatibility with arbitrary third-
  party formatter behavior. Explain any scoped settings needed for Markdown.
- Preserve detection of valid Norna projects and engine/schema versions. Do not
  offer Norna constructs in unrelated projects merely because a file is Markdown
  or YAML.

No general editor rewrite or new language server is implied. Reuse existing
helpers, removing special cases where the common parser/schema actually
replaces their responsibility.

## Acceptance And Verification

- The approved handbook has no unresolved questions affecting the implemented
  scope, and its examples become focused acceptance cases.
- Real YAML, including quoted and multiline strings, is interpreted once with
  a shared schema contract. Unknown/duplicate keys, wrong types, invalid roots,
  and invalid items produce file/line-aware errors without silent coercion.
- Legacy forms are not silently treated as successful new-format input. Explain
  the required form without providing compatibility aliases or a migrator.
- `content:check`, builds, source-editing commands, and IntelliSense agree on
  accepted syntax. Data updates preserve valid YAML and intended scalar values.
- Engine-only and supported VS Code/Red Hat configurations use the same field
  definitions. Embedded-block completions and errors identify the correct
  source ranges without duplicating another provider's output. Consecutive saves
  under the documented formatter setup do not rewrite valid syntax incorrectly.
- Callout examples work identically inside/outside tabs; unsupported uppercase
  meanings retain their neutral fallback and useful diagnostic.
- Notes resolve across page sections. Duplicate/missing/unused definitions and
  name normalization follow the approved policy. Multiple references to one
  sidenote fail clearly; footnote reuse retains distinct return destinations.
- Letter markers pass `z` to `aa` and stay stable across resizing, Focus reading,
  and responsive fallbacks. Note targets are not derived from display markers.
- Browser checks cover multiple sidenotes in one paragraph, adjacent paragraphs,
  wide blocks, shallow/deep navigation, narrow viewports, print, and no JavaScript.
  No overlap, duplicate reading content, unreachable note, or lost return focus.
- Reference-footnote return links into tabs reveal the correct alternative;
  no-JavaScript and print output retain the content.
- Use focused syntax/validation/editor tests first and the registered review
  environments for visual checks. Do not run a full release suite for the draft.

## Related Work

This revises parts of the completed contracts in
[BL-047: Standard Reference Footnotes](BL-047-standard-footnotes.md),
[BL-049: Content Alternatives](BL-049-content-alternatives.md), and
[BL-102: Semantic Callout Terminology](BL-102-semantic-callout-terminology.md).
Their historical text is not approval to retain superseded forms here.

[BL-023: Multilingual Sites With A Shared Page Tree](BL-023-multilingual-sites-shared-page-tree.md)
and [BL-100: Future Versioning Foundation](BL-100-future-versioning-foundation.md)
are future context, not prerequisites. Do not implement language/version
management as part of this syntax change.
