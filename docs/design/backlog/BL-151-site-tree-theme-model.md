# BL-151 Site Tree For The Site And Theme Model

## Purpose And Decisions Made

Recorded on 2026-09-29; implementation awaits a separate instruction.
Follow BL-150 Theme Inheritance And Explicit Preset Replacement with the remaining editor
presentation and authoring support. BL-149 already supplies a working editor
for root/ and correctly owned site-level files; do not implement it twice.

Reuse existing add/remove controls and document icons. Explain the scopes of
tree-theme.yaml and page-theme.yaml, the selected theme source, and what takes
effect after optional-file removal. Protect the required root tree theme.
Provide valid creation templates, correct schemas and real-widget IntelliSense
checks. Keep content.md accessible through the page row, actual filesystem
ownership, and the page's images immediately below its row.

BL-150 supplies working filename recognition, shared file rules, creation and
removal protection, full theme schemas, and diagnostics using unsaved ancestor
themes. Reuse that baseline. This item owns the remaining source/scope
presentation and consolidation of the two tree projections below.

The 2026-09-29 inheritance decision distinguishes modifications from explicit
preset replacement. Explain both scope and behavior: a file without preset
modifies inherited values; preset starts a new base even when its name matches
the inherited preset. Root tree-theme.yaml requires preset. Creating an
optional theme must start as modifications without preset; do not silently
break inheritance through the creation template. Explain adding/removing
preset in YAML help and explain which inheritance resumes after file removal.
Show the active preset/source as concise help where useful; a field-by-field
effective-values inspector remains outside this item. Test suggestions and
editing on both inherited modifications and explicit replacement.

Consolidate the overlapping physical-tree projections in editor-site-tree.mjs
and editor-site-editing-tree.mjs as part of this adaptation. Identify actual
callers first, share traversal and file rules where both projections remain
necessary, and remove obsolete paths where they have no supported consumer.
Preserve damaged entries, unsaved-source diagnostics and the current visible
tree. Reuse the source-file definitions from BL-150 Theme Inheritance And Explicit Preset Replacement. Site resources already have an independent site owner after
the BL-149 follow-up; keep file actions and site diagnostics independent of
the homepage's presence.

No elaborate effective-values inspector or new theme-design interface. Reassess
the remaining BL-136 VS Code Local Theme Creation And Removal proposals only
after this workflow has been evaluated. Update help and reference, perform
focused editing/persistence checks, and obtain local visual approval.

## Dependencies

BL-149 Separate Site And Root Page and BL-150 Theme Inheritance And Explicit Preset Replacement.
