# VS Code Files And Images Track

This track helps a site author work with pages, images and local themes through
Norna's readable page tree. It groups five bounded items for discussion and
delivery; each item owns its own requirements and tests.

**Status: First implementation completed on 2026-09-20.**
The owner has approved the working method, order and first interface. Later
steps retain their individual visual review and implementation decisions.

## Agreed Authoring Model

**Approved by the owner on 2026-09-20.** These decisions apply across the
authoring track and to later authoring work. Record and carry them forward
even when an individual item's implementation scope covers only part of the
model. They establish the direction, not approval of every future control.

- Provide a dedicated Norna entry in VS Code's Activity Bar. Keep the normal
  Explorer available.
- The VS Code extension's Site Tree shows one active workspace site. Select
  a sole site automatically; choose explicitly when several are available.
  Opening other files must not add or switch sites. Mark the root page
  **Homepage**. Explorer retains VS Code's ordinary workspace-folder scope.
- Follow Norna's actual file organization. Readable page titles may replace
  technical directory names and ordering prefixes, but the hierarchy must
  match storage. Do not insert synthetic directories such as `Page files`.
- Show configuration under its owning root, page or category, **before its
  `pages/` directory**. This applies at every depth, including the site's
  `config.yaml` and `theme.yaml` and existing local configuration below it.
- Show a page's images and other owned resources beneath that page, with
  actual resource filenames and recognizable `images/` and `pages/`
  directories. Begin page editing from the page's representation in the tree.
- Every represented `pages/` provides **Add page** for that location through
  its plus button and context menu. Use **New Page** on a parent to create its
  first child when `pages/` does not yet exist.
- Use one common page icon unless a page has an explicit presentation of its
  own. This does not introduce a custom-icon feature.
- The homepage is the site root and may have children: `site/content.md`,
  `site/images/` and `site/pages/`. Reordering children does not designate a
  new homepage. These paths illustrate the default site root; the selected
  site's actual root applies.
- Keep shared appearance in root `theme.yaml`, optional homepage-only
  appearance in root `page-theme.yaml`, and inherited branch appearance in
  local `theme.yaml` files farther down the hierarchy. The homepage-only
  settings do not cascade to its children.

The [revised visual proposal](vscode-authoring-review/README.md) illustrates
these decisions. [BL-138 Root Page And Child Pages](backlog/BL-138-root-page-and-child-pages.md)
has implemented the root storage model;
[BL-140 VS Code Page Files Implementation](backlog/BL-140-vscode-page-files-implementation.md)
implements the revised editor tree. The drawings remain the accepted design
record; the editor reference describes the delivered controls.
The selection and homepage clarification is implemented in
[BL-141 VS Code Active Site Scope](backlog/BL-141-vscode-active-site-scope.md).

| Item | Decisions it must carry into its own brief |
| --- | --- |
| BL-133 VS Code Page Files | Dedicated entry, physical hierarchy, readable page labels, owned resources, configuration before `pages/`, and the existing page-creation action at each `pages/`. |
| BL-134 VS Code Image File Operations | Add or remove images through the owning page's real `images/`; keep the tree and stored files consistent. |
| BL-135 VS Code Image Block Insertion | Keep the target page and its actual image ownership clear when selecting and inserting an image. |
| BL-136 VS Code Local Theme Creation And Removal | Create and remove the correct theme file for the intended scope; show it under its owner before `pages/`, including the homepage-only case. |
| BL-137 VS Code Image Usage And Removal Review | Identify images and references by their real owning page and path, including homepage images at the root. |

Later page moves, ordering and deletion must preserve the same mapping and
homepage identity. Their detailed behavior remains with the later authoring
items. The owner included opening existing `public/` files in the first
delivery. The accepted brief is
[BL-140 VS Code Page Files Implementation](backlog/BL-140-vscode-page-files-implementation.md).
The editor reads public addresses from the engine; the later possibility of
independent addresses is recorded in
[BL-139 Decoupled Page Addresses](backlog/BL-139-decoupled-page-addresses.md).

## Track Order And Technical Dependencies

The numbered order is the agreed discussion and delivery order. Finish and
commit an approved item before starting the next implementation. A technical
dependency means that an item actually needs an earlier capability; it is not
an alternative name for the chosen order.

| Step | Item | Draft maturity | Technical foundation |
| --- | --- | --- | --- |
| 1 | [BL-140 VS Code Page Files Implementation](backlog/BL-140-vscode-page-files-implementation.md) | Implemented; verified in the Default profile | Implemented [BL-131 VS Code Site Tree](backlog/BL-131-vscode-site-tree.md), accepted [BL-133 VS Code Page Files](backlog/BL-133-vscode-page-files.md) design |
| 2 | [BL-134 VS Code Image File Operations](backlog/BL-134-vscode-image-file-operations.md) | Outline | Page/file selection from BL-133 VS Code Page Files |
| 3 | [BL-135 VS Code Image Block Insertion](backlog/BL-135-vscode-image-block-insertion.md) | Outline | BL-133 VS Code Page Files and existing block support; importing new files is not a prerequisite |
| 4 | [BL-136 VS Code Local Theme Creation And Removal](backlog/BL-136-vscode-local-theme-creation-removal.md) | Outline | BL-133 VS Code Page Files and existing theme rules; no dependency on image insertion |
| 5 | [BL-137 VS Code Image Usage And Removal Review](backlog/BL-137-vscode-image-usage-removal-review.md) | Outline | Removal entry point from BL-134 VS Code Image File Operations and existing managed-image reference analysis |

The first implementation is complete. Later drafts remain under
`Needs Decision Or Evidence` until their individual discussion is complete.
The order here does not make those drafts implementation-ready or override
the repository's global queue.

The first [visual review site](vscode-authoring-review/README.md) presents
BL-133 VS Code Page Files with an illustrated journey and filesystem mapping.
Later review pages will be prepared when their item reaches discussion.

The owner has since selected a dedicated entry and a tree following actual
storage, with configuration before `pages/`. Proposal 2 reflects those choices
and now includes the owner's decision to open existing `public/` files.
[BL-138 Root Page And Child Pages](backlog/BL-138-root-page-and-child-pages.md)
implements the root model depicted in the revised drawings.

[BL-132 VS Code Site Authoring Continuation](backlog/BL-132-vscode-site-authoring-continuation.md)
retains the later structural and link-authoring proposals. Page moves,
reordering, page deletion and link reports are outside this track. Clipboard
image import may become a separate follow-up after the basic workflows are
evaluated. The track adds no new image format or theme model.

## Visual Discussion Before Each Brief Is Fixed

Present the proposal and its illustrations together before asking the owner
to decide. The owner is new to VS Code terminology. Explain terms such as the
Explorer sidebar and the Activity Bar (the strip of view icons), and show where
they are in the full window.

Use a local Norna review site, with one page for each item when it reaches
discussion. Prepare the shared site alongside the first visual proposal;
building a separate review platform is not another product feature. Run its
disposable review copy with the registered `scratch` review target. Keep
reusable source and illustrations with the design material rather than only
in disposable output.

Each review page contains:

- the author task and the proposed scope;
- a full-window VS Code sketch, plus detail views where needed;
- numbered before/action/result images showing a concrete click or keyboard
  sequence, with short explanations in Swedish and exact proposed UI labels;
- the few choices that need discussion, next to the relevant images.

Label proposed interfaces as proposals. Prepare the current item's scenes,
not complete designs for all later items. The owner can ask for clarification
and request revisions before accepting the brief. Do not ask them to settle
the layout through text-only questions before showing the proposal.

After acceptance, record the decisions, settle the acceptance criteria and
focused test plan, then implement. Review the working result and complete
relevant verification before committing that item.

## VS Code And Verification

The owner explicitly chose their **Default VS Code profile** for this track's
review and editor testing. Do not require an isolated editor profile as an
additional approval gate. Use disposable test files for mutation, failure and
recovery scenarios, while preserving the author's unrelated edits.

The existing packaged integration harness described in the
[editor workflow test plan](editor-workflow-test-plan.md) currently launches
an isolated profile. Do not claim that an unchanged harness run verifies the
Default-profile workflow. When implementing an item, choose or adapt the
focused checks to exercise the actual controls in the selected profile and
record what was tested. Retain the plan's actual-widget and source-persistence
requirements wherever suggestions or document edits change.

Use native VS Code views, menus, file dialogs and file APIs. A custom Tree View
still needs commands and drop handlers connected to its resources; it does not
inherit the Explorer's entire file manager. Add Norna behavior for page
ownership, valid source names and content syntax. Standard trash support does
not by itself establish a working Undo or recovery contract; test the chosen
behavior when introducing removal.

Each item gets focused checks and a short human workflow review. Check the
minimum supported editor and the combined workflows before distribution,
without repeating the full suite after every item. No engine release or
Marketplace publication is implied by this track.

## From Review Material To User Documentation

Write each illustrated workflow around an author task from the start. After
the behavior is implemented and verified, replace proposal drawings with real
captures and move the useful instructions into the canonical
[VS Code editor reference](../../site/pages/032-reference/pages/060-workflows/pages/010-editor/content.md)
or an appropriately scoped how-to page. Each item includes this documentation
work; it is not postponed until all five are complete.

The BL keeps requirements and verification evidence. The review page links to
the resulting user documentation instead of maintaining a second current
manual. Unimplemented proposals remain visibly separate from product help.
