# BL-145: VS Code Site Tree Ordering And Add Menu

## Purpose And Status

Help an author distinguish a page's grouping row from its editable files and
add content without first creating storage directories.

**Status: Completed on 2026-09-22.** The owner approved the working result and
requested the final ordering/help refinements that day. This refines the delivered
[BL-144 VS Code Page And Image Authoring Prototype](BL-144-vscode-page-image-authoring-prototype.md).

## Approved Contract

- Page headings and directory labels select a row without opening a source
  file. Use the separate chevron or keyboard arrows for expansion. Remove
  grouping-row tooltips except the requested explanation of `public/`; retain
  VS Code's native selection/focus indication.
- Show the real `site-config/` directly below the homepage, with a settings
  icon. Expand it initially; remember subsequent expansion choices per site
  in the workspace, including after refreshing or reloading VS Code.
- Keep `public/` beside `site-config/`; do not move files. Illustrate public
  files with site-wide resources such as `robots.txt` and icons, not attachments.
- Root order: `site-config/`, `public/`, `theme.yaml`, `content.md`, `images/`,
  `pages/`. Other pages: `theme.yaml`, `content.md`, `images/`, `pages/`.
  Categories retain `category.yaml` instead of `content.md`.
- Keep the real filename `theme.yaml`, with its scope explained on hover,
  not as a permanent row description. Homepage help says it affects this page
  only; other page/category help includes descendants and inherited settings.
  This order and hover treatment reflect the owner's follow-up on 2026-09-22.
- Show only existing directories. Every page retains a plus even when
  `images/` or `pages/` is absent. The plus opens **Add…**, offering a child
  page or image import; categories offer child pages only. Reuse the existing
  creation/import/insertion flows and cancellation safeguards.
- Keep other page actions under the ellipsis. File rows open the actual file;
  following an active editor reveals that file row within its owning page.
- Preserve existing keyboard/context commands and older-engine page-only
  behavior. No new filesystem format, image resolution rules, downloads,
  drag/drop, page moves or diagnostic taxonomy.

## Design Basis And Verification Plan

Use VS Code's native Tree View and Quick Pick controls. A grouping command
that does nothing keeps single-click expansion on the separate chevron; this
follows the editor's [tree implementation](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/browser/parts/views/treeView.ts).
Native row hover/focus colors are controlled by VS Code, not overridden by this
extension. No custom tree renderer or changes to the user's profile settings.

Check physical order, actual-file ownership, initial/remembered expansion,
passive grouping rows, real file opening, Add menu destinations and cancellation
with focused contracts. Inspect the installed extension in the owner's normal
Default profile; exercise the plus on a leaf and reload with configuration
collapsed. Reuse the existing import/insert and page-creation implementation
rather than repeating the complete CRUD or completion-widget matrix.

The reference answers: which row edits my page, where are its settings, and how
do I add a child or image when no directory exists? Assume basic VS Code opening
only. Show the physical tree and row behavior before Add actions; explain folder
creation and theme scope beside those tasks. Update the authoring-track decisions,
extension README and changelog together after verification.

## Verification Record — 2026-09-22

Implemented the physical order in the engine's optional file-tree projection
and the native controls in extension 0.4.1. Existing page/image operations and
the logical tree API remain compatible. The installed Default-profile bundle
matches the packaged source (SHA-256
`17736e53321e453d81bdbd0c18581ef15eadfd605497b0e074f298b652e670c1`).

Passed focused checks:

- `node scripts/test-editor-site-tree.mjs`: physical root/page/category order,
  real/absent directories, ownership, no-write browsing and existing page rules.
- `node editors/vscode/test/site-tree-contract.mjs`: passive grouping commands,
  file opening/reveal, settings icon and initial/remembered expansion, Add
  choices by node type, first-child destination, import ownership, cancellation,
  site switching, stale targets, refresh coordination and older-engine fallback.
  Repeated after changing the active-settings-file reveal contract and after
  the owner's final ordering/hover refinements.
- `node editors/vscode/test/package-contract.mjs` and
  `node --check editors/vscode/test/suite/site-tree.cjs`.
- `npm run test:documentation`, `npm run content:check`, `npm run build`,
  `npm --prefix editors/vscode run package`, and `git diff --check`.

Native inspection in VS Code 1.138.0, the owner's Default profile:

- Inspected the root ordering, settings icon and theme help in the existing
  dark theme and a narrow window. The final view puts `theme.yaml` above
  content/category information and no longer displays Page appearance beside
  it. The accessibility tree exposes the scoped theme help and public-folder
  tooltip. Clicking page/directory
  labels left the editor and expansion unchanged; keyboard expansion worked.
- Verified initial settings expansion, then collapsed it and reloaded the
  window while `site-theme.yaml` remained active. The saved collapse survived.
  An earlier refresh reopened it: automatic active-file reveal caused this,
  so reveal now stops at the collapsed settings group. The regression is
  covered by the adapter contract.
- The owner approved the working tree. After restoring computer control,
  opened the visible plus on **Tom sida**, which has neither `images/` nor
  `pages/`. The **Add to Tom sida** widget contained exactly **Add child page…**
  and **Import image…**. Selecting the first reached the page-title input;
  cancelling returned without creating directories or changing its content.
- Native selection of **Import image…** from the new plus could not be fully
  observed: computer control lost the window during that attempt. The shorter
  category Add menu and revised ellipsis were checked by deterministic adapter
  contracts, not repeated through native controls. Existing import/insertion
  was already exercised in
  [BL-144 VS Code Page And Image Authoring Prototype](BL-144-vscode-page-image-authoring-prototype.md).
  This is a recorded verification limit, not a known implementation failure.

The local exercise's public attachment example is retained under
`.local/vscode-testplan/before-bl-145/ovning-public-nedladdningar/` and replaced
in the exercise by `robots.txt` and `.well-known/security.txt`. Its public-file
test instructions were updated. Maintained fixtures also use site-wide public
files. No product filesystem migration was introduced.

The isolated integration suite was adapted to file-row opening/reveal but not
run: the owner requested the ordinary profile. No separate light-theme,
minimum-version, complete CRUD, formatter or completion-widget matrix, and no
full `npm test`, push or release. Those contracts were not changed.
