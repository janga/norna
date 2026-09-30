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

## Site Tree Workflows

The `site-tree` suite verifies
[BL-131 VS Code Site Tree](backlog/BL-131-vscode-site-tree.md) through the
packaged extension's native tree view and input widgets. The current hierarchy
and resource scenarios follow
[BL-140 VS Code Page Files Implementation](backlog/BL-140-vscode-page-files-implementation.md).
For [BL-153 VS Code Site Tree Page Placement And Previous Addresses](backlog/BL-153-vscode-site-tree-page-placement.md),
verify the source-row action, target-row placement choices, preview and
cancellation in the native tree. Apply a sibling reorder and a cross-parent
move with a child page. Confirm that only the latter changes URLs, that old
addresses lead to the moved pages, and that known internal links use the new
addresses. Test an occupied destination and later creation at an old address;
the error must identify its owner and how to resolve it. A failed or stale move
must leave the original files recoverable and report any incomplete rollback.
Site selection follows
[BL-141 VS Code Active Site Scope](backlog/BL-141-vscode-active-site-scope.md):
show one workspace site, choose explicitly when several are available, and
keep that choice when opening other files.
The suite exercises:

- source opening through page/category labels, resource-file rows, independent
  chevrons, keyboard navigation, and active-file reveal without collapsing
  unrelated branches; directory labels select without opening a source;
- page title, description and navigation visibility, plus category label and
  description, through **Page Information**;
- dirty-buffer edits and Undo, followed by save/close/reopen/edit/save cycles
  with exact source comparisons, including preserved comments and link text;
- child and sibling pages, a root category, the creation preview, cancellation,
  URL collisions, and the restrictions on Home;
- unlisted descendants, malformed but openable pages, custom roots, isolation
  between sites, and refresh after external create/edit/rename/delete actions;
- owned YAML, normal image previews, equal image names under different pages,
  nested public files, and the inline Add Page action on a real `pages/` folder.

For active-site changes, also verify the native **Choose Site** Quick Pick:
select a site using its title and location, cancel without changing the tree,
and reload the window to confirm the saved choice. Open another site's source
and a source outside the workspace; neither may replace or add a root. Remove
the chosen workspace folder and confirm that its tree and actions disappear.
The homepage must be marked **Homepage**, and its page label must open the root
`content.md`; there is no separate content row. Directory labels must leave
the editor and expansion unchanged. Site configuration and public files appear
as siblings before the homepage. Within every page, images appear first,
followed by tree-theme.yaml, page-theme.yaml and child pages when present.
Verify `root/content.md` opens
from the homepage label, with no `root` segment added to public URLs.
Verify the configuration icon, initial expansion, and remembered collapse after
refresh/reload even while one of its files is active. Check Add on a leaf:
child-page creation, image import, cancellation without creating directories,
and the shorter category menu. Keep the beginner exercise to one site; use a separate workspace
for multi-site scenarios.

For theme-help changes, use the theme-inheritance fixture in a disposable copy.
Compare page and theme-file hovers for inherited modifications, explicit
replacement, replacement with the same preset, and a page-only replacement
whose child keeps the branch preset. Edit an ancestor without saving and check
that help updates; invalid themes must not leave an old preset displayed.
Preview removal of an optional theme and check the resumed source/preset before
cancelling. The required root tree theme must have no removal action. When
theme editing or completion changes, accept suggestions from the native widget
for both modifications and replacement, then verify Undo and save/reopen.

The engine's file projection and the extension adapter also have focused
deterministic checks. They cover source ownership, real/absent directories,
no-write browsing, resource command boundaries, creation destinations and
fallback to an engine exposing only the earlier logical tree API. The adapter
also covers selection/cancellation, restored choice, workspace removal,
external files, dirty homepage labels and stale-node command rejection. These checks
supplement the native controls; they do not establish widget usability.

Current VS Code uses its custom context menu, selected with keyboard navigation
after a real right-click. VS Code 1.96 on macOS uses the Command Palette because
its native context menus are outside the test's browser inspector. Both paths
select real commands and interact with the controls supplied by the tested
engine and extension. Native macOS context-menu selection by mouse is not
covered. The minimum-version path selects the target row before opening the
palette. Selecting a page or category opens its source; selecting a directory
does not. Account for the resulting focus change when invoking the command.

The formatter variant activates real Prettier and formats a probe before the
same source-edit and save scenarios. It uses the documented Markdown save
exception and Red Hat's standalone YAML formatter. It does not change the
user's settings.

Results include the extension bundle's SHA-256 hash in
`editors/vscode/.vscode-test/site-tree-<vscode-version>.json`. Light, dark and
compact-window captures use the same filename stem. These are ignored local
test artifacts. The full integration suite includes these tree workflows;
the focused suite does not rerun the completion selection matrix.

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

# Category description and tree mode, from blank values/keys and partial prefixes.
npm --prefix editors/vscode run test:integration -- --suite metadata

# Configuration paths, theme scopes and shared-content values.
npm --prefix editors/vscode run test:integration -- --suite configuration

# Native site tree and page information, without the completion matrix.
npm --prefix editors/vscode run test:integration -- --suite site-tree

# The same site-tree workflows at the compatibility and formatter boundaries.
npm --prefix editors/vscode run test:integration -- --suite site-tree --version 1.96.0
npm --prefix editors/vscode run test:integration -- --suite site-tree --with-prettier
```

The metadata suite accepts category `description` from a blank YAML line and
from `desc`, and `navigation.mode: tree` from a blank value and from `tr`.
Each case uses the real suggestion widget and checks the inserted bytes. It
is a focused metadata check, not the full construction or save matrix.

The configuration suite extends those cases with the physical paths introduced
by [BL-143 Site Configuration Directory And Page Files](backlog/BL-143-site-configuration-directory-page-files.md):
`site-config/settings.yaml`, `root/tree-theme.yaml`, root `tree-theme.yaml`,
and `site-config/shared-content.yaml`. It selects representative values from
blank positions and partial prefixes and rejects global fields in an empty
homepage theme. These are file-recognition checks; they do not claim exhaustive
selection of every pre-existing configuration value.

Use the current baseline for changes to authoring or persistence. Add the
formatter scenario when changing save behavior or formatter guidance. Run the
minimum-version suite for compatibility changes and before release or external
distribution. Installing a local VSIX for review in the owner's Default profile
is not distribution: use focused checks for the changed controls. Do not repeat
all three after unrelated engine changes.
The owner handles evaluation VSIX installation and manual interface review.
Provide the package path, version and a short review task. Directly relevant
automated checks remain the agent's responsibility; do not repeat earlier
passing checks without a relevant change. Completed editor changes may be
committed before owner review. Record remaining manual checks as unverified,
not passed. This decision, made on 2026-09-30, supersedes earlier per-item
requirements to install a VSIX or obtain manual interface approval before commit.

For installation, use **Extensions: Install from VSIX…** and then
**Developer: Reload Window**. If the running version remains old, investigate
that installation specifically rather than repeating UI installation for every
development edit. Do not operate the owner's VS Code for routine review unless
explicitly requested.

The formatter scenario sets global `editor.formatOnSave` to `true` and
`editor.defaultFormatter` to Prettier, then overrides Markdown save formatting
to `false` and assigns standalone YAML to Red Hat. This verifies the documented
ownership boundary; it does not claim arbitrary Markdown formatting is safe.

## Historical Verification And Limits

The dated records below describe the particular changes and bundles tested.
They are evidence, not additional test requirements or proof that a later
bundle passes. Explicitly pending review remains pending.

The 2026-09-20 extension 0.3.1 check used the same VS Code 1.137.0 Default
profile. Native selection, cancellation, external/inactive-site file opening,
window reload and workspace-folder removal passed. Homepage opening, image
preview, Page Information and cancelled Add Page were also checked. Light/dark
and half-screen captures were inspected. The extension adapter covers the
remaining scope and stale-node cases. The isolated integration suite was
adapted but not rerun; minimum-version, completion and formatter matrices were
deferred because those contracts did not change. See
[BL-141 VS Code Active Site Scope](backlog/BL-141-vscode-active-site-scope.md)
for exact commands and the installed package identity.

The 2026-09-20 extension 0.3.0 work used the owner's VS Code 1.137.0 Default
profile, as requested, with disposable files under `.local/bl-140-editor/`.
Native opening/expansion, root/deep Add Page, first-child creation,
cancellation, YAML/image/public-file opening, dirty metadata/Undo and two
save/reopen cycles with exact byte comparisons passed. External-resource
create/rename/delete refresh preserved unrelated expansion. Light/dark and
half-screen tree and Page Information presentation were inspected; temporary
workspace overrides and window size were restored.
First-child creation exposed overlapping tree refresh and reveal operations;
a deterministic adapter regression and a repeated native creation now pass.
The adapted automated tree suite, minimum-version run and full completion
matrix were intentionally not rerun; completion and formatting are unchanged.
See the exact coverage and package identity in
[BL-140 VS Code Page Files Implementation](backlog/BL-140-vscode-page-files-implementation.md).
Do not apply the earlier complete-matrix result below to this new hierarchy.

Site-tree verification on 2026-09-19 used Norna VSIX 0.2.0 and Red Hat YAML
1.24.0. All 12 workflows passed on VS Code 1.138.0 and 1.96.0, and on 1.138.0
with Prettier 12.4.0. The tested extension bundle has SHA-256
`bc3255f673764b2930dd5023876bff4191397ede1f2e9c0409a88dd30ce21cc4`.
Light/dark tree captures and compact Page Information captures were inspected.
The engine tests additionally cover CRLF, flow/block YAML, source comments,
malformed categories, stale creation plans and cross-site path rejection.
A final full editor integration run also passed on 1.138.0, checking the tree
together with the existing completion and persistence suites. The second-site
tree fixture is separate from documents rewritten by completion tests.

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

## Combined Page Form Review — 2026-09-26

The current development form combines page/category creation and Page
Information. Its alias list starts empty, with an Add button; each added row
can be removed. Existing values are prefilled when editing. Older engines
without `sitePageFormApiVersion: 1` retain the separate dialogs.

Focused checks completed:

- `node scripts/test-editor-page-form.mjs`: creation metadata, alias syntax and
  collisions, non-writing previews, empty metadata and stale creation plans.
- `node scripts/test-site-node-commands.mjs`: existing CLI creation behavior.
- `node editors/vscode/test/page-form-contract.mjs`: combined buffer edits,
  alias errors/removal confirmation, cancellation, stale buffers and HTML
  escaping. The file stays unchanged until the author saves the editor buffer.
- `node editors/vscode/test/site-tree-contract.mjs`: form command routing,
  parent choice, cancelled creation, site boundaries and older-engine fallback.
- `node editors/vscode/test/package-contract.mjs` and
  `npm --prefix editors/vscode run package`: packaged entry points and bundle.
- `npm run test:documentation` and `git diff --check`.

The actual generated webview HTML was captured and inspected in Chromium in
light, dark and compact layouts under `.local/page-form-review/`. These
captures use representative VS Code theme variables and do not establish
native VS Code rendering or keyboard behavior. The extension is installed in
the user's Default profile for that review. No complete release suite,
completion matrix or formatter matrix was run.

Before committing, review in the normal VS Code window: create a child page,
edit its existing values, add/remove alias rows, correct an invalid alias and
cancel an edit. Confirm that address/source previews are understandable and
that Tab, the input labels, plus/minus controls and narrow layouts are usable.
Review saved-alias removal with incoming links. A native interaction test of
the new webview and the normal save/reopen cycle remains outstanding; the
adapter checks above do not replace it. The native Site Tree suite has been adapted to use the webview fields and
syntax-checked, but has not been executed against VS Code in this change.
