# BL-135: VS Code Image Block Insertion

## Purpose

Use a page's existing image in its content without typing the filename and
Norna block syntax manually. This is step 3 of the
[VS Code Files And Images track](../vscode-authoring-track.md).

**Status: Needs decision; outline for later visual discussion.**

[BL-144 VS Code Page And Image Authoring Prototype](BL-144-vscode-page-image-authoring-prototype.md)
provides an authorized first version: append one editable image stack to the
owning page, after import or from an existing image. Use that baseline when
discussing insertion at a selected location or into an existing block.
The existing **Insert Image** action now opens a single form for the selected
image's preview, alternative text and caption as part of
[BL-134 VS Code Image File Operations](BL-134-vscode-image-file-operations.md).
Consider selecting several existing images and their display order in a later
iteration. This item still owns placement inside prose or an existing block.

## Scope And Boundaries

Connect a selected image source to an explicit insertion point in that page's
`content.md`. Reuse existing image-block definitions and editor construction
support. This item adds a convenient tree-to-content workflow; it does not
introduce a new image construct, copy files or silently edit another page.

## Decisions Made

Adding an image file and inserting a content reference are separate actions.
Present a visual journey and discuss the insertion behavior before fixing the
brief. Use the Default profile and the shared documentation method.

## Preliminary Proposals

- Place the caret in the page, select its image, then invoke an insertion
  action. Make the target page and location explicit when focus has moved from
  the editor to the tree.
- Start with a valid `image-stack` for a single image and editable alternative
  text/caption fields. Decide whether insertion into an existing compatible
  block is part of the first useful scope or a later addition.
- Apply targeted editor edits with normal save and Undo behavior, preserving
  unsaved prose and unrelated source formatting.

## Open Questions

Use sketches to decide how the action remembers or asks for the insertion
point, what happens when another page is active, and where alternative text
and caption are entered. Decide the first supported content contexts before
including multiple-image or existing-block insertion.

## Dependencies

- Technical: image/page selection from
  [BL-133 VS Code Page Files](BL-133-vscode-page-files.md) and existing block
  construction support. Images may already exist on disk; import is not a
  technical prerequisite.
- Track order: review and implement after
  [BL-134 VS Code Image File Operations](BL-134-vscode-image-file-operations.md).
  This sequence allows the author to evaluate import before content insertion.

## Candidate Verification And Documentation

Exercise the real tree/editor action and verify exact inserted source at the
intended location. Cover focus changes, another active page, dirty content,
allowed/refused contexts, cancellation and Undo/Redo. Save, close, reopen,
edit and save again; compare file bytes. If suggestions change, accept each
changed suggestion through the real widget. Check the rendered image and
turn that verified journey into user documentation.

## Ready For Implementation When

The visual insertion flow is approved and supported contexts, target handling,
source effects and persistence tests are specified.
