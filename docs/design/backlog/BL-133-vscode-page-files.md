# BL-133: VS Code Page Files

## Purpose

Let a site author find a page's images and existing settings through readable
page titles, then open them without navigating numbered directories. This is
step 1 of the [VS Code Files And Images track](../vscode-authoring-track.md).

**Status: Design accepted on 2026-09-20.** The owner approved the structural
summary, requested an implementation item and included existing `public/`
files. [BL-140 VS Code Page Files Implementation](BL-140-vscode-page-files-implementation.md)
is the accepted delivery brief. The proposal history below records the
discussion; the implementation brief resolves its former open questions.

## Visual Proposal 2

The [local review material](../vscode-authoring-review/README.md) contains a
maintained Norna site and editable SVG sketches. Its scratch copy is served at
<http://127.0.0.1:4399/vscode-review/bl-133/>.

Start with the full-window overview, physical-path mapping and three-step
page-to-image journey. The revised sketches show the dedicated entry,
homepage root, real resource directories, configuration before `pages/`, and
an Add page action on `pages/`. Shared, homepage-only and inherited themes,
a possible `public/` directory, deep/empty branches and light/dark/compact
examples make the remaining choices concrete. Every scene is a proposal.

The old synthetic groups and alternative pane have been replaced; their
discussion history remains in Git. The sketches do not establish an approved
implementation brief. Resource inventory, labels and detailed controls remain
open. The page proposes reusing the existing create-child action when a
page has no `pages/` yet, creating that directory only on actual page creation.

## Scope And Boundaries

Extend the existing site tree with discovery and opening of source files.
Normal editing in VS Code remains available after opening a file. This item
does not add resource-file creation, import, removal, image-block insertion
or a custom configuration editor. The agreed Add page placement reuses
existing page creation.

Keep the authored page/category hierarchy, sibling order and unlisted pages
from [BL-131 VS Code Site Tree](BL-131-vscode-site-tree.md). Add resources to
that view without changing URLs, source directories or the published website's
navigation. Reuse the engine's page ownership and current editor behavior.

The first proposed inventory is page-owned managed image sources, existing
local `theme.yaml` files on pages/categories, the homepage's optional
`page-theme.yaml`, and the site's existing `config.yaml`, `theme.yaml` and
`sitewide-content.yaml`. The selected site's
actual root applies even when it is not named `site`. Generated `.norna`
output is not authoring content. Decide the treatment of `public/` assets in
the discussion below before fixing the inventory.

## Decisions Made

The owner reconfirmed the complete
[shared authoring model](../vscode-authoring-track.md#agreed-authoring-model)
on 2026-09-20. These structural decisions apply to later items as well;
this item's narrower delivery scope must not omit or defer recording them.

- **Implementation authorized.** Include existing `public/` files for opening
  as ordinary resources. Reuse the existing page action for a first child
  without an existing `pages/`. Native control details follow the accepted
  sketch and remain subject to review of the working result.
- Keep public URL calculation in the engine. The independent-address question
  is recorded in [BL-139 Decoupled Page Addresses](BL-139-decoupled-page-addresses.md)
  and is not an implementation prerequisite.
- **2026-09-20: Dedicated Norna entry approved.** Reach the authoring view
  through its own icon in VS Code's Activity Bar. The owner chose this for
  discoverability. This becomes the tree's default location; present one
  Norna authoring tree. VS Code's normal Explorer remains available.
- **Filesystem mapping approved.** Put a page's actual images, settings and
  child `pages/` beneath that page. Hide ordering prefixes in readable page
  labels; do not introduce a synthetic `Page files` directory. Show existing
  configuration before `pages/`, at the site root and deeper levels.
- Each represented `pages/` directory provides an **Add page** action. Page
  entries use a consistent icon unless they have an explicit presentation of
  their own; settle the visual treatment in the revised sketch.
- The homepage is the site root after
  [BL-138 Root Page And Child Pages](BL-138-root-page-and-child-pages.md).
  Its `content.md` and `images/` live at that root. Reordering children does
  not replace the homepage. Root `theme.yaml` is shared, while root
  `page-theme.yaml` affects the homepage alone.
- Use native VS Code presentation and existing file editors/image viewing.
- Present sketches and a concrete user journey together on the local Norna
  review site before asking for acceptance.
- Discuss and approve this item separately, using the owner's Default VS Code
  profile, then verify and commit it before the next implementation.
- Reuse verified journey text and real captures for user documentation in this
  same delivery. The shared track records the review and documentation method.

## Preliminary Proposals

### File Groups And Labels

The first sketch used **Page files**, **Site settings** and a separate
**Selected page files** alternative. The owner preferred resources under the
owning page but required the presentation to match actual storage. Replace
the synthetic grouping with real files and directories in Proposal 2.
The revised view shows readable page labels alongside actual resource
filenames and distinguishes the shared root theme, homepage-only theme and
inherited child themes. A page row represents its source directory and opens
`content.md`; this proposal does not duplicate that file as another row.

Opening a file uses its real source URI and the editor's normal open/preview
behavior. An image need not already be referenced in content to appear here.
Usage badges and reference searches belong to the later image-usage item.

### Scenes To Present Together With The Proposal

| Scene | Author action | Result the sketch must make understandable |
| --- | --- | --- |
| Find the Norna view | Select its proposed entry point | Where the page tree lives relative to the normal file explorer and editor |
| Open a page | Select a page title | Its `content.md` opens while the page's position in the hierarchy remains clear |
| Find an image | Expand the page and its actual `images/` | Its image sources are listed without navigating numbered directories |
| View the image | Select an image | The image opens in VS Code; the owning page remains identifiable |
| Open settings | Open the site's root theme, homepage-only theme and a local theme | Shared settings, homepage-only settings and inherited branch settings are distinguishable |
| Use a page with children | Expand its real `pages/` and inspect the parent's files | Resources and child pages map to their actual stored hierarchy |
| Create a child | Use Add page on `pages/`, or the existing page action for a first child | The creation destination is clear without inventing nonexistent directories |

Use representative existing content for the scenes. Include a narrow-window
view and a page without images or a local theme. Inspect light/dark sketches
before presenting them. Mark absent settings as absent rather than suggesting
that a file has already been created.

### Candidate Acceptance And Test Plan

Finalize these after the visual choices are accepted:

- A user can open page content, a local image, a local theme and shared
  configuration from the proposed view, using mouse and keyboard. The opened
  resource is the real file for the selected page/site.
- Children and resources remain distinguishable on deep branches, pages with
  long titles and unlisted pages. Existing open/create/page-information actions
  keep working; changing selection does not collapse unrelated branches.
- Identical image filenames on different pages open different correct files.
  Custom site roots and multiple discovered sites do not mix resources.
- External create/rename/delete operations and ordinary source saves refresh
  the relevant resources. Selection and expansion persist where possible;
  disappearing files produce a useful refresh/opening outcome.
- Opening and expanding the tree writes no source files and creates no empty
  directories. Existing dirty documents are not overwritten or force-saved.
  Invalid but present source files remain accessible for repair.
- Exercise the actual packaged extension's tree and commands in the Default
  profile. Compare tree actions with opened editor URIs, and check source bytes
  remain unchanged by browsing. Inspect light/dark and compact-window results.
  Extend the existing focused site-tree checks only where this scope changes
  their contract; no image import or deletion tests belong to this item.
- Verify the final illustrated browse/open journey and update the canonical
  editor documentation. State any untested interaction explicitly.

## Open Questions

Ask these with the corresponding sketches, not as a text-only questionnaire.
Recommendations below are starting proposals and do not settle the answers.

1. **Does the revised filesystem-based tree make ownership clear?** Show the
   approved arrangement with real `pages/`, images and configuration, including
   a deep branch and an empty page. Settle labels, focus and empty states from
   that concrete sketch without reopening the agreed placement.
2. **Which shared files are needed for the first useful version?** The proposed
   baseline includes page images and existing local/shared configuration.
   Show where logos, icons and downloads in `public/` would fit, and establish
   whether opening those is needed now. They use different ownership rules
   from managed page images; including them must not imply managed import.

Labels, empty states, ordering of resource groups and focus behavior should be
shown in the same proposal and refined from that feedback. Implementation
details that do not affect these author choices can be resolved in the brief.

## Dependencies

- Technical foundation: implemented
  [BL-131 VS Code Site Tree](BL-131-vscode-site-tree.md), existing file opening,
  site discovery and schema ownership. Inspect the current `site-tree.cjs`
  adapter and engine site-tree API before adding another representation.
- The root-file model is implemented by
  [BL-138 Root Page And Child Pages](BL-138-root-page-and-child-pages.md).
- Track order: first discussion and first implementation. The local review
  site is shared preparation for the visual proposal, not a dependency on
  another new editor feature.
- Current behavior is defined in the
  [editor reference](../../../site/pages/032-reference/pages/060-workflows/pages/010-editor/content.md),
  [managed-image reference](../../../site/pages/032-reference/pages/010-site/pages/050-images/content.md)
  and [theme reference](../../../site/pages/032-reference/pages/020-configuration/pages/060-theme/content.md).
  Native view guidance: [VS Code views](https://code.visualstudio.com/api/ux-guidelines/views).

## Ready For Implementation When

The owner has reviewed the illustrated journeys, the placement/resource scope
questions are resolved, and the chosen labels and opening behavior are
recorded. Replace alternatives with an accepted brief and a focused test plan
before moving this item into the implementation queue. Record visual approval
explicitly; approval of the track's method is not approval of this interface.
