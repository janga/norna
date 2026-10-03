# BL-166: Page Order In Frontmatter

## Purpose

Let authors change page presentation order without changing page directory
names. Store sibling order in each page's frontmatter, with predictable
placement in both the CLI and VS Code and advance notice when placement
requires updating several pages.

**Status: Implemented on 2026-10-04; owner VSIX/interface review remains.**
The owner approved optional order, warnings for duplicates and confirmation
before renumbering, and delegated the remaining technical choices.

Previously, directories such as `010-guides` carry both order and slug. Norna omitted
the numeric prefix from the public URL, but reordering could rename source
directories, including paths to descendant pages and their files. The new
model makes source paths easier to recognize and keeps them stable
during sibling reordering.

## Scope And Boundaries

- Replace numeric directory ordering with frontmatter order throughout the
  engine, rendered navigation, CLI and VS Code Site Tree.
- Create a page directly before or after a sibling, or as a parent's first or
  last child. Reuse the placement model for page moves.
- Support spaced order values and deliberate renumbering when an insertion
  cannot fit. Explain all additional file changes before applying them.
- Convert maintained repository content and handle other known sites
  individually. A general migration command is outside this item.

Directory hierarchy still determines page ancestry and public paths. Moving
to another parent or changing a slug can still change paths and URLs; retain
the existing choice to preserve previous addresses, selected by default.
Independent URL hierarchy remains separate work under
[BL-139 Decoupled Page Addresses](BL-139-decoupled-page-addresses.md).

## Decisions Made

- Page ordering should no longer make source paths harder to understand after
  a move. The owner proposed per-page order values, duplicate diagnostics and
  renumbering to make space between values.
- VS Code should let the author create the page at its intended position,
  using the existing page-placement interaction as the starting point. CLI
  creation and movement should offer analogous placement choices.
- Renumbering must be explained before it changes several pages. Extra edits
  to existing page files must not come as a surprise.
- On 2026-10-03 the owner delegated the conversion approach. Use controlled
  conversion of known sites, following the repository's existing approach to
  source-layout changes. Include adapting repository sites, starters and
  fixtures; do not build a general migrator or permanent dual-format support.

## Implementation Contract

### Order And Source Paths

Use this optional field:

```yaml
navigation:
  order: 1000
```

A page could then live at `root/pages/guides/pages/install/content.md`.
Use positive safe integers with gaps, normally 1000, 2000 and 3000.
This contract is implemented.

- Treat order as local to one sibling group, including unlisted pages. The
  homepage has no sibling order.
- Insert between existing values when possible. Ordinarily, reordering
  changes only the moved page's frontmatter.
- When no suitable integer remains, renumber only the destination sibling
  group, preserving the chosen presentation order. Descendants retain their
  own order values when their parent moves.
- Warn about duplicate values and use slug as a deterministic tie-breaker.
  Put pages without an order after explicitly ordered pages, sorted by slug.
  The owner approved optional order and warnings on 2026-10-03. Dates never
  affect ordering. CLI/editor placement assigns order automatically.
- Keep build and preview read-only with respect to authored order. Renumber
  only as part of an explicit authoring operation.

### Placement And Renumbering Review

Use one engine plan for CLI and editor operations. It must identify the
placement, affected source files and old/new order values before applying
changes. Preserve the existing stale-plan, dirty-file and rollback protections
when an operation also needs to edit sibling frontmatter.

In VS Code, select the intended position before completing the creation form
or move. Include any renumbering notice in that operation's confirmation,
with an inspectable list of affected pages. The review states:

> This placement requires new order values for 8 existing sibling pages.
> Their content.md files will be updated.

Count existing pages whose values actually change; distinguish these edits
from the new or moved page itself. Cancellation leaves source files unchanged.
After applying the operation, summarize the extra files changed. Preserve
unrelated frontmatter, comments and page content when editing order values.

CLI placement forms:

```sh
norna page:add "Installation" --after /guides/overview/
norna page:add "Installation" --before /guides/reference/
norna page:add "Installation" --parent /guides/ --first
norna page:add "Installation" --parent /guides/ --last
```

Use equivalent placement selectors for `page:move`. A before/after target
identifies its parent; reject contradictory selectors. When adding at a parent
without a position, default to its last child. Targets use logical site paths,
independent of deployment prefixes and physical directory names.

`--dry-run` should show the complete plan, including renumbering. Interactive
CLI use should request confirmation when extra existing pages need new order
values. Unattended use should require an explicit allowance for those changes;
use `--allow-renumber` for this explicit allowance. Do not add a second editor confirmation
solely for renumbering.

### Conversion Of Existing Sites

Keep conversion a bounded delivery task:

1. Inventory maintained repository sites, starters and fixtures, and known
   external sites that will use the changed engine. Record the external sites
   needing a separate conversion before upgrading their engine.
2. Convert each selected site in a reviewable change: derive frontmatter order
   from its existing sibling sequence, remove ordering prefixes and update
   references that contain physical source paths. Preserve URLs, slugs,
   presentation order, aliases and page-owned files.
3. Check path-dependent metadata and regenerate derived output where needed.
   Verify the converted site's structure and build with the changed engine
   before adopting the upgrade. Keep existing site content and local edits intact.

A small, inspectable script may perform repetitive edits across selected
sites. It need not become a supported product command. Keep per-site changes
reviewable and reversible through a commit or backup. Do not replace the
owner's scratch site from a fixture or convert unrelated sites automatically.

Document the new source format and the manual conversion steps. Older sites
can remain on their current engine until converted. The required `sourceFormat: 2` setting distinguishes the formats. Without it,
the new engine reports conversion instructions before a build or mutation;
with it, a numeric prefix is an ordinary part of a legitimate slug.
Do not infer format independently for each directory or silently convert it
during build, preview or a page move.

## Technical Choices

- `navigation.order` is an optional positive safe integer. Missing values sort
  last; ties sort by slug. Renumber with spacing 1000 when a gap is exhausted.
- Mark the new source format with `sourceFormat: 2` in site settings. Diagnose
  an unconverted site before interpreting its directory names as slugs.
- Retain explicit `--order` for authors choosing a value. Reject combining it
  with relative placement flags. Keep the existing URL-to-URL move form and
  add placement selectors. Require `--allow-renumber` in unattended commands
  that change other pages' order values.
- Preserve the existing dirty-file guards. Show sibling edits in the normal
  creation/move confirmation, with paths and old/new values.

## Dependencies

Build on the implemented placement and address handling in
[BL-153 VS Code Site Tree Page Placement And Previous Addresses](BL-153-vscode-site-tree-page-placement.md)
and [BL-158 VS Code Page Slug Editing](BL-158-vscode-page-slug-editing.md).
Changing storage must preserve their existing move and alias behavior.

Settle source-path conventions before choosing cross-page file-reference
syntax in [BL-142 Page-local Files And Explicit Sharing](BL-142-page-local-files-explicit-sharing.md).
[BL-159 Managed Local Markdown Images](BL-159-managed-local-markdown-images.md)
follows this item in discussion order; its page-local image processing does
not require completing this implementation.

## Acceptance Criteria

- One ordering contract covers engine structure, rendered navigation and Site
  Tree, including missing/duplicate values and all placement choices.
- Focused checks cover normal insertion, exhausted gaps, sibling reorder,
  parent moves, confirmation/cancellation, stale plans, dirty siblings and
  rollback after a failed multi-file edit.
- The conversion inventory and verification steps cover repository content,
  starters, fixtures and a separate path for each known external site.
- Documentation covers hand-created pages, CLI/editor placement and
  renumbering notices. The owner installs the VSIX and reviews the interface.

## Rough Implementation Size

The pre-implementation estimate was **6–10 focused development days** for the
approved contract. This is an engineering estimate, not a delivery
date; it excludes waiting for owner interface review and converting an
unknown number of external sites.

The implementation was divided into these areas:

1. Shared page model, ordering rules, schema and format recognition.
2. Creation/move planning and safe edits of sibling order values.
3. CLI placement and confirmation, plus VS Code creation and review flows.
4. Repository content conversion, documentation and focused integration checks.

The main cost is replacing assumptions about numbered directories across
existing readers and writers. Relevant code includes `page-model.mjs`,
`site-structure.mjs`, `src/lib/sitePages.ts`, `src/content.config.ts`,
`site-node-create.mjs`, `editor-page-placement.mjs` and the page-move helpers.
Individual site conversion keeps this work bounded without adding a second
long-term source model or a migration product.

## Delivery And Verification

- Shared engine ordering, schema and source-format checks are implemented.
  The renderer and Site Tree consume the same ordered structure. Home entry
  IDs cannot collide with a page whose slug is `root`; a page may also use
  `pages` or a numeric slug.
- CLI and editor creation support before, after, first child and last child.
  Sibling reordering updates frontmatter without renaming directories.
  A move to another parent keeps the existing alias choice, enabled by default.
- Exhausted gaps produce a review of extra sibling files and old/new values.
  CLI scripts require `--allow-renumber`; the editor uses its existing form
  or final move confirmation. Changed previews, dirty sources and failed
  multi-file writes are covered by focused tests, including restoration.
- VSIX 0.14.0 uses `sitePageOrderApiVersion: 1` and accepts page placement
  APIs 1 and 2. The new engine exposes placement API 2 so older extensions
  cannot apply a transaction whose extra sibling writes they do not understand.
- Public references now explain hand-created pages, ordering, CLI/editor
  placement, renumbering review and individual source-format conversion.

### Conversion Inventory

| Sources | Sites | Result |
| --- | ---: | --- |
| `site/` | 1 | Converted and built; 83 content pages, 86 output routes. |
| `examples/` | 8 | Converted; all eight example builds pass. |
| `fixtures/` | 15 | Converted; structure checks and relevant consumer tests pass. |
| `starters/` | 2 | Converted; initialized and installed-package workflows pass. |
| `docs/design/vscode-authoring-review/site/` | 1 | Converted; structure and documentation checks pass. |

Conversion moved 163 child directories across 45 sibling groups. Comparing the
old and new trees confirmed the same URLs and sibling sequence for all 190
pages in these 27 sites. Owned images moved with their directories; source
links, example excerpts, generated schemas and the image manifest were updated.

Known separate sites remain unchanged and need individual conversion before
adopting the new engine:

- `../testsajt`: dependency pinned to Norna 0.7.1.
- `../www.walde.se`: dependency pinned to Norna 0.7.14.
- `.local/test-sites/scratch/site`: existing owner scratch content was preserved.
  It must be converted separately before use with this working-tree engine.

A separate, disposable review copy exists at
`.local/test-sites/bl166-order/site`, using the working-tree engine. `Dogs` and
`Adopt` deliberately have orders 1 and 2. Creating after `Dogs`, or moving a
child after it, therefore exercises the renumbering notice. Cancel once and
then complete the operation; check the displayed files and unchanged sibling
directory names. Also try ordinary sibling reordering and a parent move with
and without new aliases.

### Checks And Remaining Owner Review

Passed relevant checks cover page model/order, creation and movement, editor
language/resource/form contracts, nested navigation, aliases, site links and
attachments, sitemap, managed media, content checking/sync planning, project
configuration, theme inheritance, source upgrade, migration audit, schemas,
documentation, installed-package CLI/preview, and all example builds.
The documentation build and VSIX packaging also pass.

Native VS Code interaction, the real suggestion widget, Undo, and dirty
save/reopen behavior have not been manually reviewed for this change. The
owner installs `editors/vscode/norna-vscode.vsix` (0.14.0) and performs that
review. Automated cancellation/stale/dirty/rollback checks are not a substitute
for that review. No release, push or external-site conversion was performed.
