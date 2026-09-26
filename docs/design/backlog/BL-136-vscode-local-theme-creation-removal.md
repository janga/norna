# BL-136: VS Code Local Theme Creation And Removal

## Purpose

Evaluate whether authors need a richer choice of initial overrides or a view
of effective inherited settings beyond the basic theme create/remove controls. This is step 4
of the [VS Code Files And Images track](../vscode-authoring-track.md).

**Status: Needs decision; outline for later visual discussion.**

Local-theme removal was approved separately on 2026-09-22 in
[BL-146 VS Code Removal, Addresses And Incoming Links](BL-146-vscode-removal-addresses-links.md):
the file's actions explain homepage or branch inheritance and confirm moving
it to the operating system's Trash. Basic missing-theme creation is implemented in
[BL-147 VS Code Site Tree Icons And Editing Model](BL-147-vscode-site-tree-icons-editing-model.md):
the page/category Add menu previews a normal text-width override and opens the
new file, with cancellation, dirty-buffer and overwrite protection. This draft
retains only additional initial-setting choices or a presentation of effective
inherited values, if the owner finds those necessary. Reuse the delivered
creation and removal actions.

## Scope And Boundaries

Opening existing settings and editing them with YAML support is already
available after [BL-133 VS Code Page Files](BL-133-vscode-page-files.md). The
remaining potential benefit is choosing an initial override with knowledge
of the effective inherited values. Basic creation and explained removal must
not be implemented again.

Use the existing limited page-theme model. `site-config/site-theme.yaml` is required and
shared. Optional root `theme.yaml` affects only the homepage; a child page
or category's `theme.yaml` is inherited by descendants. An empty file has no
overrides; the creation proposal should give the author a useful initial
setting. A separate settings form, preset redesign and general YAML-file
removal are outside this scope.

## Decisions Made

The owner chose to discuss this before image-usage review. The visual proposal
must explain local versus shared settings before requesting approval. Use the
Default profile, verified recovery and per-item documentation.

## Preliminary Proposals

- Assess whether to offer additional initial-setting choices alongside the
  delivered normal text-width override, using the same creation action.
- Describe removal as returning to inherited settings, showing the affected
  branch and acknowledging more local overrides on descendants.
- Preserve existing files and dirty editors. Verify the chosen recovery path;
  do not create an invalid empty file or replace the root theme as a shortcut.

## Open Questions

Determine whether the delivered normal text-width starting point is sufficient
and whether authors need to inspect effective inherited values before editing
or removal. Dirty-file handling and the basic create/remove controls are
already implemented; do not reopen them without a concrete defect.

## Dependencies

- Technical: settings discovery from
  [BL-133 VS Code Page Files](BL-133-vscode-page-files.md), existing theme
  validation and YAML editor support.
- Track order: after
  [BL-135 VS Code Image Block Insertion](BL-135-vscode-image-block-insertion.md).
  There is no technical dependency on image insertion; reuse earlier file
  handling where applicable without treating it as a theme-model dependency.

## Candidate Verification And Documentation

Cover page/category/Home eligibility, collisions, correct schema, dirty
documents, cancellation and recovery. Verify inheritance through several
levels, including a descendant overriding only some fields. Check effective
presentation after removal, not only file absence. Validate the affected
content/theme and document the verified create/remove journey.

## Ready For Implementation When

The visual proposal is approved, the creation/removal choices are explicit and
the brief defines a focused inheritance, persistence and recovery test plan.
