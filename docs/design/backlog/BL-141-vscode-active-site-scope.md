# BL-141 VS Code Active Site Scope

## Purpose

Keep the VS Code extension's Site Tree focused on the site the author has
chosen. Opening an unrelated source file must not add another site or switch
the tree. Make its homepage identifiable without knowing the file model.

**Status: Completed on 2026-09-20.** Creation and implementation authorized
on the same date. Installed locally as VS Code extension 0.3.1.

## Decisions Made

- One site in the workspace is selected automatically. Several sites require
  an explicit choice. Show only the selected site's tree and remember that
  choice for this workspace until the author changes it or it is unavailable.
- Discover candidates within workspace folders. Opening an external file may
  use existing IntelliSense, but cannot expand or change the tree's scope.
- Use VS Code's native Quick Pick through **Norna: Choose Site…**. Show readable
  site titles and source locations so equal titles remain distinguishable.
  Offer the same action in the tree toolbar when there are several sites.
- Mark the root page **Homepage**, matching the extension's English UI. Its
  title opens root `content.md`; its separate chevron expands children. Keep
  the common page icon and actual configuration/images/pages/public hierarchy.
- A removed workspace folder or missing site invalidates its selection and
  cached nodes. Refresh and reopening must not retain unrelated site roots.
- Page creation and information commands operate within the active site;
  stale rows and files belonging to another site cannot redirect an operation.
- Keep the local basic exercise to one site. Move the multiple-site exercise
  into a separate workspace. Flatten the instruction site's unnecessary
  Testpass category, preserve test IDs and update instructions and captures.

## Scope And Boundaries

Change the VS Code extension's site discovery, selection and tree presentation,
its focused regression coverage, reference/help and the disposable user test.
The Norna engine retains one required root `content.md` per site. IntelliSense
providers, public addresses and generated website navigation keep their current
contracts. No release, publishing, push or changes to the owner's VS Code
profile are included. Use the owner's Default profile for native checks.

VS Code's documented [workspace model](https://code.visualstudio.com/docs/editing/workspaces/workspaces)
provides the folder boundary; its [Quick Pick](https://code.visualstudio.com/api/ux-guidelines/quick-picks)
is the reference for explicit selection. Showing one active site in the
extension's own view is this item's product decision; Explorer continues to
show the workspace's physical folders.

## Acceptance And Verification

- Cover one, several and no workspace sites; explicit selection and
  cancellation; remembered selection on reopening; removal and rediscovery;
  external source files and inactive-site files; dirty source updates;
  command destination guards and earlier-engine fallback.
- Retain the existing refresh/reveal overlap regression. Repeated reads,
  opening and scope changes must not modify source files.
- Check the packaged extension's actual Choose Site widget, homepage source
  opening and an external-file click in the owner's Default profile. Inspect
  the complete tree in light/dark and a compact window.
- Update the canonical editor reference, extension help, changelog and
  contributor test plan. Use focused extension/package and documentation
  checks rather than the full engine suite.
- Keep local test sources and screenshots ignored. Preserve any exercise
  edits and previous local review content while revising the test plan.
- Commit this item as one logical change after verification.

## Implementation And Verification

The extension discovers candidates only within workspace folders, persists
one active root in workspace state and guards page actions against inactive
or stale rows. The native empty-view button and toolbar open **Choose Site**;
its labels identify workspace location and full source path. Homepage rows
show **Homepage** while keeping the normal page icon. No engine or
IntelliSense provider changed.

Native checks used the owner's VS Code 1.137.0 **Default** profile:

- A one-site workspace selected itself; the homepage label opened its root
  `content.md`. Its configuration, images, pages and public files remained
  in their physical hierarchy.
- A new two-site workspace started with an empty tree and a working
  **Choose Site…** button. The actual Quick Pick accepted a site selection.
  Cancellation left both an initial empty selection and an existing selection
  unchanged.
- Opening the other workspace site's `content.md`, then the instruction
  site's `content.md` outside the workspace, did not add or replace roots.
- An explicit switch selected the other site. **Developer: Reload Window**
  restored that selection even while an external source remained active.
- Removing the selected workspace folder removed its tree and selected the
  sole remaining site. The test workspace's folders were then restored.
- Image preview, Page Information and Add Page's creation preview worked;
  Escape at the creation preview wrote no page.
- Dark, light and half-screen screenshots were inspected. Temporary theme
  overrides and the window size were restored; no user-profile setting changed.

Focused checks passed:

- `node --check editors/vscode/site-tree.cjs`
- `node --check editors/vscode/test/suite/site-tree.cjs`
- `node editors/vscode/test/site-tree-contract.mjs`
- `node editors/vscode/test/package-contract.mjs`
- `npm --prefix editors/vscode run package`
- `npm run test:documentation`
- `npm run content:check` and `npm run build`, with a separate ignored
  `NORNA_INTERNAL_STATE_DIR` for the documentation build.
- The temporary test-plan site's `content:check` and `build`, also with a
  separate ignored state directory. Its old page URLs remain aliases.
- `npm run review:capture -- scratch hitta-i-tradet/ --viewport desktop --appearance dark`
- `npm run review:capture -- scratch stabilitet/ --viewport mobile --appearance light`

The initial adapter run found an incorrect test setup: the simulated active
editor still belonged to the chosen site. Pointing it at the external source
made the intended command-fallback case meaningful. Native review also caught
duplicate absolute paths in the chooser; the final package uses the workspace
name beside the complete path. The adapter passed again after that change.

The packaged native tree suite was adapted for explicit selection but was not
run in an isolated profile. Minimum VS Code, the full completion/formatter
matrix and the complete engine `npm test` chain were intentionally deferred;
the changed contract has focused coverage and native Default-profile checks.
Run the minimum-version check before wider extension distribution.

Installed extension bundle SHA-256:
`b8ebc807d9f176d41fb483070d9dbfce4a631ea3f659ff5b6ace1a7c7609b31b`.
Local VSIX SHA-256:
`f27fef5c5c0d4801c7bf9f8a428f2774f85f46c0e116416866f41d107a27747c`.

The ignored user test remains at `http://127.0.0.1:4399/vscode-test/`.
`Norna-ovning.code-workspace` includes only `ovning/site`; the separate
`Norna-flera-sajter.code-workspace` is used by VSC-23. All 25 feedback IDs are
retained. Five screenshots were refreshed, the instruction pages were moved
out of the unnecessary Testpass category, and UTF-8 text downloads retain
their encoding signature. Previous instructions/captures were backed up and
the exercise content was preserved.

## Dependencies

Builds on [BL-140 VS Code Page Files Implementation](BL-140-vscode-page-files-implementation.md)
and [BL-138 Root Page And Child Pages](BL-138-root-page-and-child-pages.md).
