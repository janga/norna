# Editor Workflow Test Plan

This plan helps maintainers verify that the packaged Norna extension supports
real editing, not just activation or completion-provider responses.

## Acceptance Boundary

A completion test must accept a suggestion through VS Code's suggestion
widget and check the inserted text. Calling the provider API only establishes
that a candidate exists; VS Code can still filter it out.

A persistence test must start with a dirty document, save through VS Code,
compare the buffer and file bytes, close the document, reopen it, edit again,
and save again. Saving a clean document twice is insufficient because save
participants may not run. Preserve line endings and all text outside the
intentional edit. Also verify that an unchanged save is harmless.

## Automated Scenarios

| Scenario | Required evidence |
| --- | --- |
| New block | Backtick and tilde fences, with and without a partial name, produce an accepted Norna snippet. |
| Continued authoring | Insert an image block, choose an actual image filename, save and reopen, then complete an image field again. |
| Callout | Select a type, replace its snippet placeholder, and preserve the marker/body line break through subsequent edits and saves. |
| Blank-line discovery | A blank body line offers all six callout types and four fenced block types. Accept a callout through the widget after a literal Markdown example; also verify widget insertion of each of the six types. |
| Named sidenote | Insert a named reference, observe a missing-definition diagnostic, save and reopen, add the definition, and verify that the diagnostic clears. |
| Invalid then repaired YAML | Introduce a duplicate key, observe its diagnostic, repair it, save and reopen without a stale error. |
| Mixed Markdown persistence | Preserve known/unknown callouts, literal examples in code fences, multiline and quoted YAML, tabs, and named notes over three dirty save/reopen cycles. |
| Line endings | Run the mixed-content cycle with both LF and CRLF and compare exact saved bytes. |
| Standalone YAML | Select a preset through Red Hat YAML, save, reopen, select another value, and save again. |
| Ownership | Norna does not offer its page-specific help in ordinary Markdown/YAML; incompatible editor APIs are rejected and support recovers after refresh. |
| Formatter coexistence | Real Prettier is active and can format a probe file, but the Markdown-specific save exception preserves Norna source despite global format-on-save being enabled. |

## Completion Relevance

[BL-109: Context-Relevant IntelliSense Tests](backlog/BL-109-context-relevant-intellisense-tests.md)
adds exact allowed sets, including empty sets, to the packaged integration
suite. A test fails on an extra candidate or duplicate as well as a missing one.

- Opening fences offer the block vocabulary; closing fences and fences inside
  ordinary code, literal Markdown examples, comments, and indented code do not.
- Blank, unindented body lines offer callouts and fenced blocks without a
  required syntax prefix. Blank lines inside literal or nested content do not
  receive these top-level templates.
- Image/card roots, item mappings, and enum fields each have an explicit
  expected set. Existing fields are omitted. YAML comments and multiline text
  have no structural suggestions.
- Frontmatter uses its actual YAML mapping. Page metadata must not receive
  navigation fields, and text inside a description must not receive field or
  Markdown-block suggestions.
- Sidenotes are suggested in ordinary body text, not headings, lists, tables,
  blockquotes, tabs, inline code, or comments. Literal callout examples receive
  no active callout suggestions.
- One document is repeatedly changed between these contexts. Cursor movement,
  saving/reopening, and switching between recognized, ordinary, incompatible,
  and other compatible projects must not retain stale suggestions. Image
  candidates must remain within the selected site.

The completion API does not expose an extension/provider identifier for each
item. The integrated tests identify Norna/schema suggestions by documentation
links, Norna labels/details, and known block-snippet signatures. Direct parser
and schema tests assert exact results without this attribution limitation.
Built-in word suggestions and arbitrary AI suggestions are not treated as
Norna output and are not disabled in the user's editor.

## Construction Selection Matrix

Image filename checks select unused and already-used files from the real widget
in stacks, carousels, and cards. Check visible usage labels and ordering for
local and other-page images, then assert insertion and saved bytes. Engine
tests also cover unsaved additions and deletions, duplicate filenames, and
literal examples that must not count as references.

Entry insertion also exercises **Add image** and **Add card** in all three
editable list blocks: blank lines with zero, two, or four spaces, empty lists,
insertion between images, and non-default list indentation. Assert full source
after real widget acceptance and saving. Parser tests must reject insertion
that would transfer existing fields, alter multiline text, or rewrite a flow
sequence; ordinary fences and generated `page-list` remain excluded.

The construction suite also runs `widget-priority.cjs`. A deterministic generic
provider competes with Norna while Red Hat YAML stays active. Tests inspect
actual widget order for blank-line constructors, embedded properties and
values, frontmatter, managed images, and YAML snippets, then accept selected
entries. File transitions include a nested example site, an incompatible
project, adjacent ordinary Markdown/YAML, and literal code fences. A separate
check keeps the user's explicit snippets-at-bottom preference effective.
Only the isolated workspace changes snippet-placement settings for this test;
the previous workspace value is restored afterward.

This ranking contract covers only Norna-owned completion items. In standalone
YAML files, Red Hat supplies ordinary schema properties and values, while
Norna contributes file templates and structured snippets. The YAML banner
ranking case tests a Norna snippet; it does not demonstrate or require that
Red Hat's `preset`, `palette`, or other field/value suggestions outrank a
generic provider. Selecting a preset through Red Hat is tested separately as
an authoring workflow, not as a Norna ranking guarantee.

`widget-constructions.cjs` observes the real suggestion widget with Playwright
attached to the isolated VS Code window. It moves through the suggestions,
locates the intended label and kind, and clicks that row. It then compares the
complete document with an independent expected-source fixture and verifies the
saved file bytes. It never calls `insertSnippet` to bypass the widget.

| Construction | Entry contexts | Selection cases |
| --- | --- | --- |
| `image-stack`, `image-carousel`, `card-list`, `page-list` | Blank body line, backticks, tildes, partial block name | 16 |
| `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`, `DANGER` | Blank body line, `> [!`, partial type | 18 |
| Named sidenote reference and definition | `[^` and `[^margin:` | 4 |
| Complete content page | Empty `content.md` | 1 |
| Configuration, theme, site-wide content, category | Each empty recognized YAML file | 4 |

The blank-line cases include a preceding live image block and a literal
four-backtick Markdown example, as on the public Examples page. Embedded block
syntax is checked with the engine parser after insertion. Complete YAML file
templates must preserve the literal `$schema` directive, not treat it as a
snippet variable. Their visible `Complete file` description distinguishes them
from Red Hat schema suggestions with the same title.

This matrix does **not** establish that every Norna feature has editor support.
Tabs, code titles, and code line emphasis currently have no Norna completion
provider; they are recorded as coverage gaps, not passing selection cases.
HTML `details`, ordinary tables, and reference footnotes are standard source
constructs rather than Norna-specific snippets. Exhaustive widget selection of
every configuration property/value and every embedded YAML field is not part
of this matrix; the relevance and authoring suites cover those contracts at
their stated levels.

Manual suggestion tests disable automatic suggestion triggers in the isolated
test workspace only. They do not hide suggestion kinds or filter competing
providers. Opening uses VS Code's Trigger Suggest command, not a physical
Control-Space keystroke; operating-system keybinding conflicts remain outside
this test. Existing authoring tests also exercise keyboard acceptance.
Editor sticky scroll is disabled only in this isolated matrix because VS Code
1.96 can retain invalid heading line numbers while fixtures replace documents.

The VS Code inspector uses loopback port `9238`, checked before launch. An
occupied port causes failure instead of attaching to another window. No
maintained Norna preview port or user profile is changed. Results are saved as
`editors/vscode/.vscode-test/widget-constructions-<vscode-version>.json`, with
the tested extension bundle's SHA-256 hash so same-version builds can be told
apart. Do not run editor integration jobs concurrently.

The suite uses the packaged VSIX, real VS Code, and Red Hat YAML. Test files,
settings, and installed test extensions are isolated under
`editors/vscode/.vscode-test/`. It must not edit the user's profile or authored
site files.

## Commands And Matrix

From the repository root:

```sh
# Current VS Code, Norna, and Red Hat YAML.
npm run test:editor-integration

# Minimum supported VS Code, same workflows.
npm run test:editor-integration:minimum

# Current VS Code with Prettier coexistence.
npm --prefix editors/vscode run test:integration -- --with-prettier

# Only the construction selection matrix, for focused regression work.
npm --prefix editors/vscode run test:integration -- --suite constructions
```

Use the current baseline for changes to authoring or persistence. Add the
formatter scenario when changing save behavior or formatter guidance. Run the
minimum-version suite for compatibility changes and before distributing an
updated extension. Do not repeat all three after unrelated engine changes.

The formatter scenario sets global `editor.formatOnSave` to `true` and
`editor.defaultFormatter` to Prettier, then overrides Markdown save formatting
to `false` and assigns standalone YAML to Red Hat. This verifies the documented
ownership boundary; it does not claim arbitrary Markdown formatting is safe.

## Limits And Follow-up

Verified on 2026-09-13: the baseline passed on VS Code 1.137.0 and 1.96.0;
the coexistence run passed on 1.137.0 with Prettier 12.4.0. All three used
Red Hat YAML 1.24.0 and the packaged Norna VSIX, including the completion
relevance scenarios. Seven focused editor-block tests and the Markdown contract
test also passed. The subsequent blank-line discovery tests passed on both
VS Code versions, including actual insertion of every callout type. Prettier
was not rerun for this completion-only follow-up. At that checkpoint, the
documentation check found a trailing-space difference between the live
single-image example and its displayed source.

The image-usage follow-up passed on VS Code 1.137.0 and 1.96.0 with Red Hat
YAML 1.24.0: 86 widget/priority cases per version, including 12 selections
checking usage labels and local/other-page ordering. The editor language-service
aggregate passed, including nine focused parser/completion tests. This change
does not alter formatting; Prettier coexistence was not rerun. At that
checkpoint, the documentation check found quoted-blank-line differences
between the live semantic-callout example and its displayed source.
Tabs, code titles, and code line emphasis still
have no dedicated completion suggestions.

Final closeout on 2026-09-14 reconciled the displayed examples with their live
sources and documented the approved sidenote behavior. Checks passed against
an isolated export of the Git index, excluding unrelated table/migration work
and local theme edits:

- `npm run test:page-markdown`: shared page model, structured YAML blocks,
  named notes, and tabs/code metadata.
- `node scripts/test-editor-language-service.mjs`: editor language-service
  aggregate, including nine focused parser/completion tests.
- `npm run schemas:check`: all nine generated schemas.
- `npm run test:documentation`: canonical references and maintained examples.
- `npm run test:client-javascript`: feature-script loading, including the
  independent note enhancement script.
- `npm run test:ci-lockfile`: CI lockfile normalization.

The client-JavaScript assertion was corrected to expect the note enhancement
script rather than CSS-only notes. The editor implementation did not change
during closeout; the recorded widget tests on both VS Code versions and the
earlier formatter coexistence tests were reused. No full release suite was run.

These tests close and reopen editor tabs within an extension host. VS Code may
retain a closed tab's document model in memory; this is not a cold-cache test.
They do not simulate a full VS Code restart, remote workspaces, every operating system,
every keyboard layout, or arbitrary extension combinations. Installed versions
are reported in test output; a moving extension release can change results.

For each reported editor failure, add the smallest reproducible workflow at
the failing layer before fixing it. Record whether failure occurred in project
discovery, candidate generation, widget filtering/insertion, diagnostics,
formatting, saving, or reopening. A successful activation is not evidence that
the remaining stages work.
