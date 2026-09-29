# BL-150 Theme Inheritance And Explicit Preset Replacement

## Purpose And Decisions Made

Implemented on 2026-09-29 after BL-149 Separate Site And Root Page.
The owner approved the local theme review on 2026-09-29 at 11:54 CEST.

Updated and approved on 2026-09-29 after comparing inherited settings and
explicit theme selection. This decision supersedes replacing the complete
package whenever a theme file exists.

Require root/tree-theme.yaml with an explicit preset. An optional descendant
tree-theme.yaml without preset modifies inherited fields for that page and its
descendants. An explicit preset starts a new theme from that preset and engine
defaults, discarding ancestor values, even when the preset name is unchanged.
Apply the file's other fields after its selected base. An optional
page-theme.yaml follows the same rules but affects only its own page, on top
of that page's tree theme; it never becomes the children's inherited base.
Both files accept the full theme vocabulary. Empty optional files make no
changes. Removing a local value resumes inheritance; removing an explicit
preset resumes inheritance for that file's remaining overrides.

Search and error pages use the root tree theme without homepage-only
overrides. Reader choices and accessibility constraints remain active.
Validate the resulting theme and preserve existing compatibility rules,
including image presentation/height, navigation/section backgrounds and
responsive heading hierarchy. Preserve the existing removal of an inherited
image-height limit when explicitly switching to prose-aligned images.

Replace site-config/site-theme.yaml and the ambiguous theme.yaml name. Reuse
existing presets, palette/typography/image resolution, schemas and rendering.
Share theme inheritance/resolution between its consumers and remove remaining
assumptions of global visual identity. No preset redesign or theme editor.

As approved in the follow-up review of BL-149, consolidate the engine's source
file definitions when introducing the new theme files: permitted locations,
required status, schema, creation template and scope. Reuse these definitions
for editor classification, creation and removal instead of adding another set
of filename checks. Keep initial project discovery small; expose the selected
engine's rules through metadata or its editor API once the engine is located.
Do not build a general file-type framework or duplicate this work in BL-151.

Update our own themes with a bounded conversion where useful; no general
historical converter. Verify the required root preset, field inheritance over
multiple levels, explicit replacement (including the same preset), local
isolation, removed overrides, invalid resolved combinations, independent site
roots, navigation between differently themed pages, and generated pages. Update
documentation in the same change. Review the changed presentation locally.

## Dependencies

BL-149 Separate Site And Root Page. This item does not gate that item's usability.

## Implementation And Verification

One shared resolver now supplies rendering, configuration validation, editor
diagnostics and typography inspection. Root, branch and page-only schemas
share the full visual vocabulary; schema version 6 adds the required root
preset. Source-file metadata supplies location, required status, schemas,
creation templates and removal effects to the engine and VS Code extension.
VS Code extension 0.9.0 was packaged and installed in the owner's Default profile.

Converted 31 maintained theme files across 26 site roots, plus seven files in
active local review sites. The documentation site and one fixture previously
lacked a preset; their explicit visual choices were retained over Project.
Existing presets were not redesigned. The converter was a bounded local tool,
not a new product migration command. Updated reference, starter instructions,
editor help, schemas, contributor guidance and the source-layout illustration.

Focused verification passed:

- Six inheritance tests cover mandatory root/preset, empty files, field
  inheritance and deletion, same-preset reset, page-only isolation, invalid
  resolved combinations, independent roots, rendered pages, generated search
  and error pages, and typography inspection.
- Existing preset output baselines, theme commands, configuration and schema
  tests, content checks, page rendering, page creation/moves/aliases, client
  JavaScript boundaries, engine commands and review-environment contracts.
  The invalid-homepage diagnostic case was corrected for the full page-theme
  vocabulary and passed a focused rerun.
- Engine/editor contracts, schema freshness, dead-code checks, documentation
  checks, the 78-page documentation build and the installed npm-package check.
- Real VS Code 1.138 suggestion-widget acceptance for root, branch and
  page-only themes, Undo/Redo, dirty save/reopen, and propagation/removal of an
  unsaved ancestor diagnostic when edited and undone.
- Local Chromium review of navigation between different presets, page-only
  isolation, light/dark/mobile views and usable links with JavaScript disabled.
  The owner approved the scratch fixture; the documentation view and updated
  SVG were also inspected locally. No full browser matrix or full release
  test chain was run.

Local evidence is under `.local/bl-150/`. The repeatable rendering fixture is
`fixtures/theme-inheritance/site`; use its README for a physical scratch copy.
BL-151 Site Tree For The Site And Theme Model remains separate and unstarted.
