# BL-166: Page Order In Frontmatter

## Purpose

Let authors change page presentation order without changing page directory
names. Store sibling order in each page's frontmatter, with predictable
placement in both the CLI and VS Code and advance notice when placement
requires updating several pages.

**Status: Needs decision; highest-priority design discussion.** Created at the
owner's request on 2026-10-03, ahead of BL-159. Frontmatter is the working
direction; the exact field and ordering rules below still need agreement.
This record does not start implementation.

Today, directories such as `010-guides` carry both order and slug. Norna omits
the numeric prefix from the public URL, but reordering can rename source
directories, including paths to descendant pages and their files. The new
model should make source paths easier to recognize and keep them stable
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

## Preliminary Proposals

### Order And Source Paths

Use a field such as:

```yaml
navigation:
  order: 1000
```

A page could then live at `root/pages/guides/pages/install/content.md`.
Choose positive integers with gaps, initially for example 1000, 2000 and
3000. These names and values illustrate the proposal, not current syntax.

- Treat order as local to one sibling group, including unlisted pages. The
  homepage has no sibling order.
- Insert between existing values when possible. Ordinarily, reordering
  changes only the moved page's frontmatter.
- When no suitable integer remains, renumber only the destination sibling
  group, preserving the chosen presentation order. Descendants retain their
  own order values when their parent moves.
- Warn about duplicate values and use slug as a deterministic tie-breaker.
  Put pages without an order after explicitly ordered pages, sorted by slug.
  Avoid dates as a hidden sorting rule. Diagnostic severity and whether order
  may be omitted remain open questions.
- Keep build and preview read-only with respect to authored order. Renumber
  only as part of an explicit authoring operation.

### Placement And Renumbering Review

Use one engine plan for CLI and editor operations. It must identify the
placement, affected source files and old/new order values before applying
changes. Preserve the existing stale-plan, dirty-file and rollback protections
when an operation also needs to edit sibling frontmatter.

In VS Code, select the intended position before completing the creation form
or move. Include any renumbering notice in that operation's confirmation,
with an inspectable list of affected pages. Suggested wording:

> This placement requires new order values for 8 existing sibling pages.
> Their content.md files will be updated.

Count existing pages whose values actually change; distinguish these edits
from the new or moved page itself. Cancellation leaves source files unchanged.
After applying the operation, summarize the extra files changed. Preserve
unrelated frontmatter, comments and page content when editing order values.

Proposed CLI forms, subject to the command compatibility decision:

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
the flag name remains to be chosen. Do not add a second editor confirmation
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
can remain on their current engine until converted. Decide how the new engine
reports a former format without silently treating its numeric prefixes as
part of the public slug; a legitimate numeric slug must remain distinguishable.
Do not infer format independently for each directory or silently convert it
during build, preview or a page move.

## Open Questions

1. Confirm the field name, integer range, initial spacing and renumbering
   algorithm. Is `navigation.order` the right public name?
2. May authors omit order? Confirm duplicate warning versus error and the
   proposed deterministic fallback rules.
3. Choose the smallest explicit format/version boundary that distinguishes
   converted sites from former numbered directories, and gate editor actions
   by the selected engine's capabilities.
4. Settle placement flags, compatibility with existing `--order`/move options
   and the explicit CLI allowance for renumbering. Define the final editor
   confirmation presentation and dirty-file handling for sibling edits.

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

## Ready For Implementation When

- The four open decisions have an agreed, bounded implementation brief.
- One ordering contract covers engine structure, rendered navigation and Site
  Tree, including missing/duplicate values and all placement choices.
- The focused check plan covers normal insertion, exhausted gaps, sibling reorder,
  parent moves, confirmation/cancellation, stale plans, dirty siblings and
  rollback after a failed multi-file edit.
- The conversion inventory and verification steps cover repository content,
  starters, fixtures and a separate path for each known external site.
- Planned documentation updates cover hand-created pages, CLI/editor placement and
  renumbering notices. The owner installs the VSIX and reviews the interface.

## Rough Implementation Size

Allow roughly **6–10 focused development days** for the scope above, after the
open choices are settled. This is an engineering estimate, not a delivery
date; it excludes waiting for owner interface review and converting an
unknown number of external sites.

Plan four implementation stages with bounded commits:

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
