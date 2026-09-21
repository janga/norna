# BL-144: VS Code Page And Image Authoring Prototype

## Purpose

Let an author complete ordinary page and image work from Site Tree without
first discovering or creating Norna's storage directories.

**Status: Completed on 2026-09-21.**

The owner requested simple working versions to evaluate and improve. This
bounded prototype combines the missing page actions and a first image journey;
it does not claim completion of all later authoring-track proposals.

## Decisions And First Scope

- Show Add Child Page and Page Actions on page rows, including a page with no
  `pages/`. The plus selects that parent directly. Keep existing keyboard and
  context-menu commands, and use native VS Code controls and icons.
- Reuse source opening and Page Information for content, title, description
  and navigation visibility. Page Actions makes these choices discoverable.
- Remove a non-home page or category with its owned files and descendants only
  after showing the exact directory and extent. Send it to the operating
  system's trash. Refuse dirty affected documents, changed plans and symbolic
  links. Never fall back to permanent deletion; Home cannot be removed.
- Import one selected JPG, JPEG, PNG or SVG at a time into the selected page's
  real `images/`. Create the directory when necessary, preserve the original,
  validate the filename and refuse collisions. A file picker also allows
  copying an image from another page.
- Offer insertion after import and from an existing image. Append a single
  `image-stack` to its owning page using normal editable, undoable document
  changes. Ask for alternative text and an optional caption. Preserve dirty
  prose and line endings. Refuse invalid/unclosed page content before insertion.
- Replace an image through an explicit action, keeping its filename and
  references. Preserve the old bytes in trash before replacement, and keep a
  recoverable copy if replacement fails.
- Show managed-image uses before removal, including unsaved content and local
  precedence over equal filenames on other pages. State incomplete analysis.
  Removing a used file requires confirmation; references are not rewritten.
- Keep operations scoped to the active site and real owning page. Engines
  without the new optional capability retain existing tree functionality.

## Boundaries And Follow-ups

No page moves, URL changes, ordering, automated link repair, general file
manager, theme creation, new attachment rules or changes to image resolution.
Drag/drop, clipboard, batch import, insertion at arbitrary cursor positions,
insertion into existing blocks and richer usage navigation remain later work.

[BL-134 VS Code Image File Operations](BL-134-vscode-image-file-operations.md),
[BL-135 VS Code Image Block Insertion](BL-135-vscode-image-block-insertion.md)
and [BL-137 VS Code Image Usage And Removal Review](BL-137-vscode-image-usage-removal-review.md)
should build on this evaluated baseline. Their remaining scope still needs
discussion. Local theme operations remain in
[BL-136 VS Code Local Theme Creation And Removal](BL-136-vscode-local-theme-creation-removal.md).

## Verification And Documentation

Use disposable pages/images in the owner's normal VS Code profile. Verify the
visible actions, first-child creation, content/information edits, cancellation,
import, insertion/save/reopen/undo, replacement and trash recovery. Cover
collisions, dirty files, stale targets, homepage protection, cross-site and
symbolic-link refusal with focused deterministic tests. Completion suggestions
and formatting are unchanged; do not repeat their complete widget matrix.

The reference should answer how to add a child when `pages/` is absent and how
to add/use/remove a page image without knowing its storage path. Introduce the
visible entry points, then explain source effects and recovery beside each
operation. Record actual checks and limitations before completing this item.

## Verification Record — 2026-09-21

Implemented engine planning/validation and native extension actions. The
extension is packaged as 0.4.0 for the owner's Default profile. Native controls
follow VS Code's [tree action API](https://code.visualstudio.com/api/extension-guides/tree-view#view-actions);
copy and trash use its [filesystem API](https://code.visualstudio.com/api/references/vscode-api#FileSystem).

Passed focused checks:

- `node scripts/test-editor-site-files.mjs`: ownership, conflicts, source and
  destination changes, protected homepage, symbolic links, descendants,
  local image precedence (including filesystem case handling), unsaved usage,
  literal examples, incomplete analysis and LF/CRLF insertion.
- `npm --prefix editors/vscode run check`: extension build/syntax, existing
  Markdown/tree contracts and package contents. Subsequent changed adapters
  were checked directly rather than repeating the unchanged aggregate.
- `node editors/vscode/test/site-file-actions-contract.mjs`: cancellation,
  preserving originals and dirty prose, reviewed trash operations, recovery
  after an injected replacement failure and unsaved reference reporting.
- `node editors/vscode/test/site-tree-contract.mjs`: first-child plus without
  the location question, active-site selection, older engines and existing
  tree behavior.
- `node editors/vscode/test/package-contract.mjs`, `npm run test:dead-code`,
  `npm run test:documentation`, `npm run content:check`, `npm run build`,
  `npm run package:check`, and `npm --prefix editors/vscode run package`.

Native verification in the ordinary VS Code 1.138.0 Default profile:

- Created `Prototyptest` and its first child `Undersida för test` through visible
  page-row plus buttons. The first child created its missing `pages/` directory
  and opened the reviewed source. Page Actions showed five expected choices.
- Imported `exempel.png` as `bl144-test.png` through the native file picker;
  compared the copied bytes with the unchanged source. Keyboard selection
  worked. Earlier automation clicks had not actually selected the file.
- Appended an image block with Swedish alternative text and a caption, saved,
  undid and redid the insertion, closed/reopened the page, then edited and saved
  again. Compared exact UTF-8/LF bytes at each checkpoint. Existing Prettier
  remained installed; its settings were not changed.
- Inspected the dark-theme page/file tree and source editor. The image menu
  showed insertion, replacement and removal. After reloading the final installed
  build, replaced the test image through the native picker and confirmation.
  The confirmation identified its reference at `content.md:9`. Verified the new
  image bytes and unchanged filename/page content.
- Removed the test image through Image Actions, then restored it through
  Finder's **Put Back**. An older same-name image was already in Trash from the
  replacement test, so Trash added a timestamp. Put Back retained that name;
  renaming the restored image to `bl144-test.png` restored the original path.
  This recovery detail is documented in the user reference.
- Removed the test parent through Page Actions. The confirmation correctly
  reported two pages and three files. Restored the whole branch through
  Finder's **Put Back** and compared every source-file hash with the saved
  manifest. Both pages and the image were identical; other exercise files
  were unchanged. Finder's own `.DS_Store` metadata was excluded.
- Moved the disposable `070-prototyptest` branch back to Trash after verification
  and inspected the cleaned-up tree. The owner's existing pages, including
  `Foo`, remain unchanged. Trash was not emptied.

Native checks used the owner's existing dark theme and normal sidebar width;
no separate light-theme or window-size matrix was run for these native controls.
The unchanged Page Information edit flow retains its existing contract coverage
and was not repeated manually. Computer-control interruptions delayed the
checks, but all new file-operation journeys were completed.

No full `npm test`, completion-widget matrix, minimum-version run or separate
formatter matrix was run. Completion vocabulary and formatting are unchanged.
No push, release or Marketplace publication is part of this work.
