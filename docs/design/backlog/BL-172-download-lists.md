# BL-172: Download Lists

## Purpose

Show a coherent download menu on a page with several downloadable files.
Readers should be able to identify the file they need from one grouped list.

**Status: Needs decision.** Explicitly requested on 2026-10-04 and approved
as a separate design item alongside common HTML constructs.

## Scope And Boundaries

Build on the page-owned attachments delivered in BL-155. Existing Markdown
links already address these files; this item adds a grouped presentation and
the authoring information needed to choose between them.

The word menu describes grouped access to the files. It does not yet select
a dropdown, expandable block or permanently visible list. Archive generation,
bulk downloading and language/version selection are outside the initial scope.

## Decisions Made

- A page with several downloadable files should be able to display one
  coherent list of download links as a download menu.
- Keep this presentation work separate from BL-160's review of ordinary
  Markdown attachment links and file handling.
- File selection, labels, ordering, syntax and exact appearance remain open.

## Preliminary Proposals

Start with files in the owning page's `downloads/` directory and reuse the
existing attachment model. Evaluate a page offering a PDF guide, a spreadsheet
template and a ZIP example project. Show both the result and its source under
Norna extensions once the construct is implemented.

Compare an explicit list of selected files with a generated directory list.
Consider readable titles and short descriptions, with file type and size
derived from the referenced file where useful. These are proposals, not
approved fields or discovery rules.

## Open Questions

1. **Selection and placement:** does the author list files explicitly or opt
   into automatic collection? Where is the menu inserted on the page?
2. **File scope:** should the first version cover only the current page's
   attachments, or also explicit links to another page, public files or
   external files?
3. **Labels and order:** which metadata is useful, where is it stored, and
   how does the author control order independently of filenames?
4. **Presentation:** should the menu be a visible list, expandable block or
   another compact presentation? What happens with zero or one file?
5. **File action:** should entries retain ordinary browser handling or offer
   an explicit download request? Coordinate this decision with BL-160;
   the current system leaves opening/downloading to the browser and host.
6. **File lifecycle:** how do list entries participate in reference discovery,
   rename, removal and page moves? How is a missing listed file explained?

## Dependencies

Reuse [BL-155 Page Attachments](BL-155-page-attachments.md) and coordinate
reference syntax and file action with
[BL-160 Standard Markdown For Local Attachments](BL-160-standard-markdown-local-attachments.md).
The list can be designed using the existing attachment baseline while BL-160
is investigated. [BL-171 Button Links](BL-171-button-links.md) is related
presentation work, not a prerequisite.

## Ready For Implementation When

Selection, metadata, order, placement and file action are agreed. A concrete
source/result example demonstrates the menu with several files, including
long labels on a narrow screen. The plan specifies how references remain
correct when files or their owning page change.
