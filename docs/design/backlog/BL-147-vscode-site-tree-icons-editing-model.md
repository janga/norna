# BL-147: VS Code Site Tree Icons And Editing Model

## Purpose And Status

Help a site author recognize what each Site Tree row represents, open its
editable source, and find creation or repair actions without understanding
Norna's numbered directory names first.

**Status: Completed on 2026-09-26; local visual review approved.** The owner approved the
model and requested this implementation brief on 2026-09-26. It covers icons,
row behavior and file-state feedback together, rather than an icon-only change.

A page is a directory containing `content.md` at a permitted location in the
selected site's hierarchy. The homepage is the selected site's root page.
A navigation category uses `category.yaml` instead of `content.md` and has
no authored page content of its own.

## Approved Row Model

| Row | Representation and action |
| --- | --- |
| Page, with or without details | One common document icon and the readable page title. Clicking the title opens its `content.md`. Only the separate chevron expands or collapses details. |
| Homepage | The same page icon, visibly marked **Homepage**. Clicking opens the selected site's root `content.md`; child ordering never changes homepage identity. |
| Navigation category | A recognizable group/folder icon. Clicking its title opens `category.yaml`; its chevron controls expansion. Retain its actual configuration-file row. |
| `images/` and `pages/` | Real directories with folder icons. A distinct image/page-folder variant may help, but the written name must carry the meaning. Directory labels select; chevrons expand. |
| `site-config/` | A settings icon, initially expanded, with the user's later expansion choice remembered per site and workspace. |
| `public/` | A real folder beside `site-config/`. Explain on hover that its files are published unchanged, for example `robots.txt` and icons. |
| Individual files | Real filenames and appropriate file-type icons. Clicking opens VS Code's appropriate editor or preview; images need not open as text. |

- Suppress only the page's recognized, owned `content.md` child row: the page
  row is its editing entry point. This is a view projection, not a file move or
  new storage format. A misplaced file named `content.md` must remain visible
  for correction.
- A page is expandable exactly when it has visible details. Count all visible
  children, including configuration, `public/`, unexpected files and existing
  empty directories, rather than testing only for `images/` and `pages/`.
  A page with no details has no expansion chevron.
- Keep actual directory nesting. Existing empty directories remain visible;
  missing `images/` and `pages/` are not synthetic tree rows. Browsing alone
  creates no files or directories.
- Preserve ordering after removing the content row: root `site-config/`,
  `public/`, optional `theme.yaml`, `images/`, then `pages/`; other pages start
  with optional `theme.yaml`. Categories retain their configuration before
  `pages/`. Show additional unexpected entries under their actual owner with
  a stable order, without making recognized entries harder to find.
- A page hover explains **Open page content** and shows the actual source
  path, including directory ordering prefixes. Explain required-file status
  in missing-file and removal guidance instead of repeating **mandatory** on
  every valid page. Category help identifies its corresponding source.
- Keep theme help on hover: root `theme.yaml` affects only the homepage;
  a page/category theme affects its branch. Keep actual filenames visible.

## Icons, Selection And Accessibility

- Use a small, consistent family of existing VS Code product icons and native
  file-type icons. Do not introduce a custom page-icon configuration feature.
  Keep the base object icon identifiable when showing warnings or errors;
  use a separate decoration or description for state.
- Distinguish type from state. Homepage, unlisted, unsaved, warning and error
  information must remain understandable through text or accessible labels,
  without depending on color or a subtle icon difference alone.
- Keep native keyboard tree navigation. Activating a page/category opens its
  source; expanding or collapsing must not open it. Context-menu and Command
  Palette alternatives remain available. Opening respects VS Code's normal
  editor/preview settings.
- When `content.md` becomes active, reveal/select its owning page row rather
  than a hidden file row. Resource files retain their own selection. Files
  opened through the website's **Open in VS Code** link follow the same rule.
- Preserve the selected site, other expanded branches and remembered settings
  expansion through refresh. File creation/removal updates the chevron and
  actions without switching sites or losing the user's place. Opening another
  site's file must not change this tree's scope.

The design follows VS Code's guidance to reuse existing icons, use file icons
for files and keep row actions limited. Native controls fit this source-editing
task and retain familiar keyboard behavior; the mapping from a page to its
hidden content file is a Norna-specific design decision. See
[VS Code View guidelines](https://code.visualstudio.com/api/ux-guidelines/views).

## Add And Remove

- Keep a discoverable **+** on every page, including pages with no details.
  Retain **Add page** on `pages/` and appropriate directory/context actions.
  Put other actions under **…**; do not introduce fake file rows as buttons.
- Offer creation of missing supported Norna source files only at their allowed
  location. This includes local themes and optional shared configuration, and
  repair of required files. Use the installed engine's rules and valid
  templates; do not offer a second copy of an existing singleton file or
  overwrite existing content. Keep image import and child-page creation
  available when other images/pages already exist.
- Create missing storage directories when the selected add/import operation
  proceeds. Cancellation leaves no empty directories or partial files.
- Optional removable files have **Move to Trash…**, with confirmation of the
  actual path and effect. Required site configuration and individual
  content/category source files remain protected from standalone deletion.
- Removing a page removes its owned files and descendants. Confirm the branch
  and warn about incoming internal links from remaining pages. Preserve the
  existing link-review and dirty-file safeguards; never fall back to permanent
  deletion. The homepage remains protected from page removal.
- Preserve active-site and stale-target checks in existing mutations. Adding
  an action to this view does not bypass those checks.

## File Problems And Recovery

Make problems visible without treating every unfamiliar filename as an error.
Reuse the installed engine's structural/schema rules and existing editor
diagnostics; this work must not create a competing validation model.

| Situation | Required feedback |
| --- | --- |
| Recognized file in the wrong location | Show it under its actual directory, mark the placement problem and explain the permitted location. Keep it openable; do not move it automatically. |
| Expected file with invalid content | Keep its normal type recognizable and mark the error. Opening reaches the editable file; expose the diagnostic and source location where available. |
| Missing required source or configuration | Retain the affected root/directory in the tree, name the missing file and offer an appropriate creation/repair action. Do not silently discard the page or switch to another site. |
| Conflicting page/category sources | Show an actionable structural error; do not silently choose one source and hide the other. |
| Extra author file that Norna does not use | Keep it distinguishable from supported sources with informational help, rather than claiming that it is forbidden. Arbitrary valid `public/` filenames remain published resources. |

An incomplete directory must not be silently converted into a page or category.
If neither source exists, repair must explicitly choose the intended kind.
Keep generated output, operating-system metadata and excluded symbolic links
out of the authoring view; they must not produce a flood of warnings.
Diagnostics should identify the responsible file even when its owning page
indicates that a descendant needs attention. Clear the mark after correction
or removal; reflect current editor diagnostics for unsaved edits where those
are available. Other valid pages remain usable while one entry is broken.

## Dependencies And Boundaries

Build on the completed
[BL-145 VS Code Site Tree Ordering And Add Menu](BL-145-vscode-site-tree-ordering-add-menu.md)
and [BL-146 VS Code Removal, Addresses And Incoming Links](BL-146-vscode-removal-addresses-links.md).
This brief supersedes passive page/category labels, separate page-content rows
and the absence of page-source tooltips in the earlier model. Retain the rest
of its physical hierarchy, theme scopes and native controls.

Basic missing-theme creation is included here. Reconcile that delivered scope
with [BL-136 VS Code Local Theme Creation And Removal](BL-136-vscode-local-theme-creation-removal.md)
when completing this item, leaving only additional unimplemented refinements.
Do not reopen image insertion or removal design already delivered by the
existing actions. No drag/drop, page moves, reordering, new URL model, attachment
storage, filesystem migration or general validation rewrite is included.

## Focused Acceptance And Verification

| ID | Scenario and expected result |
| --- | --- |
| TREE-01 | Leaf page, page with details and homepage: correct common icon, source opens once, content row is absent and only rows with visible children have chevrons. |
| TREE-02 | Category and nested directories: category source opens; directory labels only select; mouse and keyboard expansion never opens a source. |
| TREE-03 | Existing empty folders, missing folders and resource-only details: physical structure stays visible; **+** works on a leaf; cancellation writes nothing. |
| TREE-04 | Missing supported files: correct creation choices and templates by owner, no duplicate singleton files, no overwrite and a visible repair route for a missing homepage. |
| TREE-05 | Misplaced, invalid, conflicting and unused files: distinct feedback, accessible type/state, useful repair guidance, and no error for a valid static public file. Repair clears stale marks. |
| TREE-06 | Active content/resource changes, external creation/removal, refresh and reload: correct row reveal, updated chevrons and preserved site/expansion state. |
| TREE-07 | Optional-file/page removal from the revised rows: correct target, confirmation, cancellation, Trash recovery and incoming-link warning; required-file/homepage protections remain. |
| TREE-08 | Native window with light/dark appearance and a narrow sidebar: labels, icons, tooltips, keyboard focus and **+**/**…** remain understandable and reachable. |

Use disposable site files in the owner's normal **Default VS Code profile**.
Present the visual implementation for local review before broadening tests.
Check the projection with `node scripts/test-editor-site-tree.mjs` and the
adapter with `node editors/vscode/test/site-tree-contract.mjs`; add only direct
creation/diagnostic/action checks needed by changed code. Native control checks
must demonstrate the actual row actions, rather than only invoking commands.
Reuse existing removal tests instead of repeating the whole CRUD matrix.
No full release, browser-navigation or IntelliSense completion matrix is
required unless this implementation actually changes those contracts. Record
the tested extension/engine versions and any unverified native interactions.

Update the canonical editor reference, extension help/changelog and authoring
track in the same implementation. Explain which row edits a page, how details
map to disk and how to add or repair a missing file, in that order. Reference
examples must describe delivered behavior. Run `npm run test:documentation`
for those updates.

## Implementation And Verification — 2026-09-26

Implemented in extension 0.6.0 with the working-tree engine, whose package
version is still 0.7.27. The engine exposes the optional
`siteTreeEditingApiVersion` capability and an opt-in editing projection;
older extensions retain the original file-tree representation. Missing-file
plans and writes reuse schemas and source-path rules, recheck the destination,
and use exclusive creation rather than overwrite. The existing removal
implementation is unchanged.

The editing tree retains physical directories, conflicting sources and
incomplete entries; reads dirty buffers for source validation; and combines
its state with available editor diagnostics without replacing object icons.
Creation from the settings folder is scoped to site configuration. A direct
read of the current exercise site returned 31 items with no issues in 44 ms;
this is a local observation, not a performance guarantee.

Passed directly relevant checks:

- `node scripts/test-editor-site-tree.mjs`: existing logical/physical API,
  metadata, ownership, older projection and creation compatibility.
- `node scripts/test-editor-source-files.mjs`: editing projection, damaged
  roots/branches, wrong placement/type, valid public files, dirty repairs,
  all supported templates, cancellation, collisions, stale directory identity
  and symlink boundaries.
- `node editors/vscode/test/site-tree-contract.mjs`: row commands/icons,
  leaf/empty-folder expansion, active source reveal, category opening,
  settings-only Add choices, source creation/cancellation, dirty-buffer
  protection, error clearing, external editor diagnostics and damaged-site
  retention/repair after reload. These are adapter tests, not native clicks.
- `node editors/vscode/test/site-file-actions-contract.mjs`: six existing
  import/removal/replacement safeguard cases, including dirty/stale targets,
  site switching, cancellation and recovery behavior at the file API boundary.
- `node editors/vscode/test/package-contract.mjs` and
  `npm --prefix editors/vscode run package`: extension manifest and packaged
  bundle. The latter runs the extension build, not the engine test chain.
- `node --check editors/vscode/test/suite/site-tree.cjs`: the existing native
  workflow was adapted to direct source opening; it was not executed here.
- `npm run test:documentation` and `git diff --check`.

Installed the final VSIX in the owner's Default profile. The installed and
packaged extension bundles have the same SHA-256:
`050894cebba6a0257ca610f647cec8259ba6bb2734b3a4613a9033c0eadebffe`.
The exercise site resolves its engine to this repository, not an older copied
package. Reload the VS Code window to activate the installed bundle.

**The owner approved the local result on 2026-09-26.** An initial concern about
leaf-page indentation was withdrawn after inspection; no artificial expansion
controls or indentation changes were introduced. Automated native inspection
could not run: macOS denied AppleScript assistive access, and screen capture
could not access the display. The owner's general visual approval does not
establish a separate keyboard/focus, light/dark, narrow-sidebar or OS-level
Trash-restoration matrix. Those cases were not reverified through native
automation in this run; adapter results do not establish native observations.

No full `npm test`, isolated-profile integration run, formatter/completion
matrix, website build, browser-navigation suite, push or release was run.
Updated the editor reference, extension README/changelog and authoring track.
BL-136 VS Code Local Theme Creation And Removal now retains only the decision
about richer initial overrides or effective inherited-value presentation.
