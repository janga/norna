# BL-140: VS Code Page Files Implementation

## Purpose

Implement the agreed [BL-133 VS Code Page Files](BL-133-vscode-page-files.md)
design: a discoverable Norna authoring tree that follows the real file
organization while showing readable page names.

**Status: Ready; implementation authorized on 2026-09-20.** The owner approved
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
