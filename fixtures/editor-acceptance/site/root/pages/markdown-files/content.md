---
navigation:
  order: 4000
---

# BL-160 Markdown files

## Same file, three paths

[Explicit path](downloads/checklist.txt "Inline file title")

[Dotted path](./downloads/checklist.txt?view=1#checklist)

[Filename shorthand](checklist.txt)

## Shared definition

[Full reference][checklist]

[checklist][]

[checklist]

## Other files

[Reference-only file][reference-only]

[Spaces and Unicode](<downloads/räkningar ett.txt> "Unicode filename")

## Test steps

1. Open the live links. Every checklist link reaches a file starting with
   **CHECKLIST ORIGINAL**. The browser decides whether to open or download it.
2. Inspect References and deletion for `reference-only.txt`; cancel deletion.
3. Add unsaved prose. Rename `checklist.txt` to `checklist-renamed.txt` in Site Tree.
4. Check path forms, title, query/fragment, definition and the link on
   **Incoming links**. Preserve unrelated unsaved prose.
5. Exercise text Undo/Redo, save, close and reopen changed pages.
6. Move this page under **Move destination**, then open its incoming link.
   The file moves with its owner; the incoming URL updates. Local paths stay local.

[checklist]: downloads/checklist.txt "Shared file title"
[reference-only]: ./downloads/reference-only.txt "Reference-only file title"
