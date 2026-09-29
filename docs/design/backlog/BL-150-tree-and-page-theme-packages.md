# BL-150 Complete Tree And Page Theme Packages

## Purpose And Decisions Made

Approved design on 2026-09-29; implementation awaits a separate instruction
after BL-149 Separate Site And Root Page.

Require root/tree-theme.yaml. An optional descendant tree-theme.yaml selects
a complete theme for that page and descendants, replacing the ancestor package.
An optional page-theme.yaml selects a complete theme for that page alone;
children still inherit the tree theme. Both accept the full theme vocabulary.
Missing values come from the selected preset and engine defaults, never hidden
ancestor fields. Preset selection remains optional. Search and error pages use
the root tree theme. Reader choices and accessibility constraints remain active.

Replace site-config/site-theme.yaml and the ambiguous theme.yaml name. Reuse
existing presets, palette/typography/image resolution, schemas and rendering.
Share theme selection/resolution between its consumers and remove remaining
assumptions of global visual identity. No preset redesign or theme editor.

Update our own themes with a bounded conversion where useful; no general
historical converter. Verify theme selection, full replacement, local isolation,
navigation between differently themed pages, and generated pages. Update
documentation in the same change. Review the changed presentation locally.

## Dependencies

BL-149 Separate Site And Root Page. This item does not gate that item's usability.
