# BL-140: VS Code Page Files Implementation

## Purpose

Implement the agreed [BL-133 VS Code Page Files](BL-133-vscode-page-files.md)
design: a discoverable Norna authoring tree that follows the real file
organization while showing readable page names.

**Status: Implemented and verified locally on 2026-09-20.**
Implementation was authorized on 2026-09-20. The owner approved
the shared structural decisions and explicitly included opening existing
`public/` files. The [visual proposal](../vscode-authoring-review/README.md)
is the implementation reference, not a claim of shipped behavior.

## Accepted Contract

- One Norna entry in the Activity Bar hosts the existing Site Tree view. The
  ordinary Explorer remains available. Retain the view's stable identifier.
- Each site has one root page, named by its title and opening its root
  `content.md`. Use the same page icon as for descendants. Distinguish multiple
  discovered sites by their locations without introducing a second homepage.
- Page/category rows represent their actual source directories. Readable
  titles hide numeric ordering prefixes, while real resource names stay
  visible. Page titles open `content.md`; category titles open `category.yaml`;
  separate chevrons control expansion.
- Existing configuration appears beneath its owner before `pages/`, at every
  depth. Include root `config.yaml`, `theme.yaml`, optional `page-theme.yaml`
  and `sitewide-content.yaml`, plus existing branch `theme.yaml` and
  `category.yaml`. Keep the distinct theme scopes understandable in tooltips.
- Show actual `images/` and child `pages/`. Show existing `public/` and its
  files/directories under the site root. Resource files open through VS Code's
  normal editor selection, including its image preview. Do not duplicate
  `content.md` beneath its page or invent `Page files`/`Site settings` groups.
- Each `pages/` offers Add page with that directory as the destination. Reuse
  existing title/segment/creation-review steps. Existing page actions create
  the first child when `pages/` does not exist; browsing creates nothing.
- Preserve New Page, New Category, Page Information, dirty-buffer edits,
  unlisted pages and malformed-but-openable sources. Resource nodes must not
  accidentally receive page-metadata editing actions.
- Refresh after external file and directory changes and follow opened files
  without collapsing unrelated branches. Identically named files belonging to
  different pages retain distinct identities and open the correct source.
- Use engine-supplied page addresses. The editor must not derive public URLs
  from the file tree; future address choices belong to
  [BL-139 Decoupled Page Addresses](BL-139-decoupled-page-addresses.md).
- Capability-check project engines. Preserve existing supported behavior with
  an older site-tree engine and explain unavailable file-tree functionality.

## Boundaries

No image import/deletion, image-block insertion, theme creation/deletion,
page moves/reordering/deletion, address overrides or custom configuration
editor. Opening a file uses existing IntelliSense; this work does not change
completion providers or formatting. Generated `.norna` output is excluded.

## Verification And Delivery

- Focused engine cases for source ownership, nested `pages/`, configuration
  ordering, root/branch themes, empty and absent directories, nested public
  files, duplicate filenames, custom roots, multiple sites and malformed
  source repair. Browsing must leave source bytes and directory inventory
  unchanged.
- Verify the packaged extension's Activity Bar view, tree labels, independent
  expansion, opening text/YAML/images, Add page at root/depth/first-child,
  cancellation, metadata commands and refresh through actual VS Code controls.
  Use the owner's Default profile and disposable mutation fixtures. Inspect
  light/dark and a compact window; preserve profile and formatter settings.
- Run the smallest relevant editor/package and documentation checks. Adapt
  existing tree regression coverage to the new hierarchy; record exactly which
  real controls and compatibility cases were exercised.
- Update the canonical editor reference and extension help in the same work
  after behavior is verified. Preserve the approved proposal as design
  history and link readers to current instructions.
- Commit this implementation as one logical item. No npm release, push or
  Marketplace publication is implied.

## Dependencies

The design is [BL-133 VS Code Page Files](BL-133-vscode-page-files.md).
The working foundation is implemented
[BL-131 VS Code Site Tree](BL-131-vscode-site-tree.md) and
[BL-138 Root Page And Child Pages](BL-138-root-page-and-child-pages.md).
This delivery is step 1 of the
[VS Code Files And Images track](../vscode-authoring-track.md); later steps
remain separate discussions and deliveries.

## Implementation And Verification — 2026-09-20

The implementation follows the accepted model and packages it as extension
0.3.0. The engine supplies an optional physical-file projection alongside its
unchanged logical page API. The adapter retains the earlier tree when the
project engine lacks that capability. Page addresses still come from the
engine. The canonical editor reference and extension README describe the new
file view.

Passed checks:

- `node scripts/test-editor-site-tree.mjs`: physical ownership and ordering,
  nested public files, duplicate filenames, no writes during browsing, empty
  and absent directories, dirty sources, malformed-source repair, multiple
  sites and resource create/rename/delete snapshots, alongside the existing
  metadata and creation contract.
- `npm --prefix editors/vscode run check`: syntax, bundle, Markdown contract,
  VSIX contents and the new adapter contract. The adapter check was rerun after
  improving active-image reveal and serializing refresh/reveal operations as
  `node editors/vscode/test/site-tree-contract.mjs`; it also covers command
  destinations, cancellation, resource-action guards and older-API fallback.
  The new overlap case holds a reveal while requesting another refresh and
  reveal, then checks that child resolution completes without invalidation
  or deadlock.
- `npm run test:documentation`, `npm run content:check`, and `npm run build`.
  Content/build used `.local/bl-140-build-state` through
  `NORNA_INTERNAL_STATE_DIR`, keeping live review caches separate.
- `npm --prefix editors/vscode run package` produced the updated VSIX, which
  was installed in the owner's Default profile. After the native creation fix,
  packaging and `node editors/vscode/test/package-contract.mjs` passed again.
  The repository bundle, VSIX and installed bundle have identical bytes
  (SHA-256 `3406307f514a55c28c9e003ce4a31fef7adbccd25fd3e5d901b34436557c36c5`).

Native controls exercised in the owner's VS Code 1.137.0 Default profile:

- Norna Activity Bar entry and the corrected **Norna: Site Tree** heading;
  distinct site roots; homepage and category labels opening without expansion;
  independent chevrons; configuration ordering.
- Root `pages/` plus button through the actual title, segment and creation-review
  widgets; created-source opening and selection. The same controls created
  `/topics/deep-review/` in the selected nested `pages/` directory.
- Cancelling the first-child creation preview left the previously absent
  `pages/` directory absent. Subsequent first-child creation discovered an
  overlapping refresh/reveal error. Serializing tree operations fixed it;
  `/created-from-root/first-nested-page/` was then created, opened and selected
  without the error. The created file bytes match the expected template.
- Root `page-theme.yaml`, category YAML, a nested public text file, and PNG
  previews at the root and under Guide. Equal image names opened their correct
  physical files, while Guide's unrelated expanded branch remained open.
- Configuration-file context menus exclude Page Information. The complete
  dark window was visually inspected after the final package reload.

- Page Information changed a title with a pre-existing unsaved paragraph;
  the tree followed the dirty title while the on-disk source stayed untouched.
  Undo restored the title and retained that paragraph. Two edit/save/close/reopen
  cycles then passed exact byte comparisons, preserving prose and the previous
  URL alias. The second cycle changed the description through Page Information.
- Image and nested public-file creation, rename and deletion outside VS Code
  appeared automatically without Refresh. Unrelated Guide descendants stayed
  expanded throughout all three changes.
- The complete light window, half-screen-width tree and compact Page Information
  dialog were inspected. Labels, actions and fields remained usable. The
  window returned to its previous size, and temporary workspace appearance and
  accessibility overrides were restored byte for byte. The ordinary Default
  profile and global formatter settings were not changed.

Screen-control interruptions delayed these checks; the remaining cases were
completed after the owner restored the window at 18:58 local time. Disposable
inputs and exact save-cycle evidence remain under `.local/bl-140-editor/`.
No authored site files were used for mutation checks.

The automated native tree suite has been adapted, including a first-child
creation regression, and passes syntax checking, but has not been run for this
delivery. The owner's requested Default profile was used for the native checks
above instead of the runner's isolated profile. The minimum-version and full
completion suites were also not run; completion providers and formatting are
unchanged. These focused native checks do not claim coverage of the full completion
or minimum-version matrix.

The design/preparation commit is `1bd74bc`; this implementation is delivered
as its own logical commit. No release, push or Marketplace publication is
included. Later authoring-track items still require their own discussion.
