# BL-134: VS Code Image File Operations

## Purpose

Add and remove a page's image files from the Norna tree using familiar VS Code
interactions. This is step 2 of the
[VS Code Files And Images track](../vscode-authoring-track.md).

**Status: Needs decision; outline for later visual discussion.** This is not
an accepted implementation brief.

## Scope And Boundaries

Receive files through native tree drag and drop or a file picker, copy them to
the selected page's `images/`, and expose image-file removal. Reuse VS Code's
file APIs. Norna maps the logical page to its source directory and validates
managed-image names; there is no new general-purpose file manager.

Keep adding a file separate from editing `content.md`. Image-block insertion
and contextual usage review belong to subsequent items. Clipboard import,
format conversion, page moves and arbitrary project-file removal are outside
this first scope.

## Decisions Made

Discuss the illustrated workflow before fixing the brief. Use the Default
profile, disposable mutation files, per-item verification and documentation
as recorded in the track. Copying preserves the selected original image.

## Preliminary Proposals

- Offer drag and drop and a keyboard-accessible file picker using one shared
  operation. Show the destination page before resolving invalid filenames or
  collisions; never silently overwrite an existing image.
- Support a defined multiple-file flow. Specify partial failure and
  cancellation before implementation rather than promising atomic behavior
  from the file API alone.
- Remove a selected image through a standard context action with an explicitly
  verified trash/recovery behavior. Do not promise that ordinary Undo restores
  it unless that exact workflow is tested.
- Existing content diagnostics continue to report missing references. Until
  the usage-review feature exists, describe removal as file removal without
  implying that the image was proved unused or that content was rewritten.

## Open Questions

Resolve these with before/action/result scenes: which page/resource nodes
accept drops; how filename conflicts are resolved; how multiple-file outcomes
are shown; and which confirmation and recovery behavior accompanies removal.
Include a keyboard-only journey and an interrupted operation in the proposal.

## Dependencies

- Technical: page/file targets from
  [BL-133 VS Code Page Files](BL-133-vscode-page-files.md) and the existing
  managed-image rules.
- Track order: after BL-133 VS Code Page Files has been reviewed and committed.
  Usage analysis is deliberately not a technical prerequisite for this basic
  file workflow.

## Candidate Verification And Documentation

Test actual drops, file selection and removal: correct page/site, supported
formats, invalid names, collisions, multiple files, unchanged originals,
cancellation, write failures and recovery after closing/reopening VS Code.
Assert that import/removal does not rewrite `content.md`; no source outside the
chosen operation may be overwritten. Use disposable images in the Default
profile. Turn the verified import/remove journey into user instructions.

## Ready For Implementation When

The illustrated proposal is accepted, target/collision/batch/recovery behavior
is explicit, and the outline has a bounded acceptance and test plan.
