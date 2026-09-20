# BL-136: VS Code Local Theme Creation And Removal

## Purpose

Create or remove a local theme from its page/category without manually finding
the directory or guessing what happens to inherited settings. This is step 4
of the [VS Code Files And Images track](../vscode-authoring-track.md).

**Status: Needs decision; outline for later visual discussion.**

## Scope And Boundaries

Opening existing settings and editing them with YAML support is already
available after [BL-133 VS Code Page Files](BL-133-vscode-page-files.md). The
new benefit here is creating a valid local theme and removing it with
an understandable account of the inherited result.

Use the existing limited page-theme model. Root `theme.yaml` is required and
shared. Optional root `page-theme.yaml` affects only the homepage; a child page
or category's `theme.yaml` is inherited by descendants. An empty file has no
overrides; the creation proposal should give the author a useful initial
setting. A separate settings form, preset redesign and general YAML-file
removal are outside this scope.

## Decisions Made

The owner chose to discuss this before image-usage review. The visual proposal
must explain local versus shared settings before requesting approval. Use the
Default profile, verified recovery and per-item documentation.

## Preliminary Proposals

- Create a local theme through the selected page/category, with the destination
  and an explicit initial setting. Open it in the existing YAML editor.
- Describe removal as returning to inherited settings, showing the affected
  branch and acknowledging more local overrides on descendants.
- Preserve existing files and dirty editors. Verify the chosen recovery path;
  do not create an invalid empty file or replace the root theme as a shortcut.

## Open Questions

Show and discuss how the initial setting is chosen, how much inherited-value
detail the author needs before removal, and how dirty files are handled. Keep
the first proposal focused on a single understandable local override.

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
