# BL-110: Context-Scoped Completion Priority

## Outcome

Relevant Norna suggestions should appear before equally matching generic
suggestions in recognized Norna files, without changing editing elsewhere.

Depends on BL-108: Standard And Uniform Content Syntax and BL-109:
Context-Relevant IntelliSense Tests. Their working-tree implementations are
the baseline for this change.

## Scope

- Apply consistent `sortText` to Norna-owned completion items only, after
  existing file, version, and cursor-context checks.
- In standalone Norna YAML files, prioritize Norna's starting templates and
  schema-defined snippets only. Ordinary schema field/value suggestions come
  from Red Hat YAML; changing their ranking is outside this item's scope.
- Prioritize constructors on blank body lines and relevant properties and
  values inside Norna blocks. Preserve image-candidate relevance ordering.
- Recognize example and fixture sites by project structure, not a privileged
  directory name. Ordinary Markdown and YAML beside those sites stay ordinary.
- Leave literal code examples, incompatible projects, user settings,
  formatting, and other providers untouched.
- Respect VS Code's matching and snippet-placement settings. This is a
  preference among equally matching items, not a promise of absolute first
  place or exclusive ownership of the suggestion list.

Tabs, code titles, and code line emphasis are separate missing completion
features; this item does not add constructors for them.

## Acceptance

- Real suggestion-widget tests demonstrate ordering against a generic test
  provider with equal text matching; Red Hat YAML remains enabled.
- Accept suggestions through the widget and check actual inserted source.
- Cover blocks, fields, values, frontmatter, templates, and image candidates.
- Verify ordinary Markdown/YAML, literal fences, incompatible projects, and
  switching between ordinary and Norna files, including an example site.
- Test current and minimum supported VS Code in isolated profiles. Do not
  change the user's profile or authored files.
- Document the scope and ranking limitations and produce a tested VSIX.

## Status

Implemented and verified on 2026-09-13. One helper applies priority to Norna's
own items at the provider boundary, preserving their internal relevance order.
Explicit preselection was removed from YAML snippets; VS Code owns selection.
YAML snippet matching now includes the source prefix so a template can be
selected after `- ` or a property followed by a colon.

Passed: 17 real widget ranking/isolation cases on VS Code 1.137.0 with Red Hat
YAML 1.24.0 and Prettier 12.4.0; all 43 construction selection cases plus the 17
priority cases on minimum VS Code 1.96.0 with Red Hat YAML. The Markdown
contract check and scoped whitespace checks also pass.

The reference and editor test guide describe the priority and its limitations.
`test:documentation` still fails on an existing trailing-space difference
between the public single-image example and its displayed source. That authored
file was not changed here. No full release suite was run.

The tested package is available at `editors/vscode/norna-vscode.vsix`.
Implementation commits must be coordinated with the shared, uncommitted
BL-108 and BL-109 editor changes rather than committing an incompatible subset.
