# BL-151 Site Tree For The Site And Theme Model

## Purpose And Decisions Made

Recorded on 2026-09-29; implementation awaits a separate instruction.
Follow BL-150 Complete Tree And Page Theme Packages with the remaining editor
presentation and authoring support. BL-149 already supplies a working editor
for root/ and correctly owned site-level files; do not implement it twice.

Reuse existing add/remove controls and document icons. Explain the scopes of
tree-theme.yaml and page-theme.yaml, the selected theme source, and what takes
effect after optional-file removal. Protect the required root tree theme.
Provide valid creation templates, correct schemas and real-widget IntelliSense
checks. Keep content.md accessible through the page row, actual filesystem
ownership, and the page's images immediately below its row.

No elaborate effective-values inspector or new theme-design interface. Reassess
the remaining BL-136 VS Code Local Theme Creation And Removal proposals only
after this workflow has been evaluated. Update help and reference, perform
focused editing/persistence checks, and obtain local visual approval.

## Dependencies

BL-149 Separate Site And Root Page and BL-150 Complete Tree And Page Theme Packages.
