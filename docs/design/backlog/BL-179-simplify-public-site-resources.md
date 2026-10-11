# BL-179: Simplify Public Site Resources

## Purpose

Give content images one predictable source location and Norna's existing image
management. Keep `public/` focused on named site artwork and technical files.

## Decisions Made

The owner approved implementation on 2026-10-11.

- Remove the general `public/images/` source directory, including empty folders.
- Ordinary content images belong directly in the owning page's `images/` and
  use existing Markdown or Norna image-block processing.
- Keep the recognized logo, favicon, touch icon and social-image filenames
  directly in `public/`, together with existing technical files, explicitly
  declared verification files and `.well-known/`.
- Continue to copy named site resources unchanged, with their current published
  addresses and automatic discovery. Do not introduce new configuration.
- Document recommended image formats and sizes. Automatic variants and icon
  generation are a separate idea in BL-178 Automatic Site Image Processing.

## Scope And Boundaries

Update the shared publication policy and its editor consumers, diagnostics,
reference, Examples and maintained review fixture. Move the documentation's
content illustration to its page. Adapt the existing disposable review copy
without resetting the owner's other test edits. No legacy URL compatibility or
general migration command is required.

Technical `.well-known/` files retain their existing protocol-oriented model;
it must not be presented as an alternative image directory. This does not change
page slugs named images, downloads or shared, or page-owned attachments.

## Acceptance Criteria

- Build/content checks reject `public/images/` with a clear page-image location.
- Editor creation, import, rename and move use the same rule before changing files.
- Supported named artwork and technical files still publish at the configured
  base path; collision checks, verification declarations and symlink refusal remain.
- Static synchronization removes obsolete shared-image output after the source
  is corrected, and preserves previous output when validation fails.
- Examples contain real supported resources; manual public-file move exercises
  use technical files under `.well-known/`.
- Focused publication, editor-resource, documentation and affected-site build
  checks pass. Record any manual editor review still outstanding.

## Documentation Understanding Plan

The reader asks where to put a logo, ordinary image, downloadable document or
technical verification file. Assume they can identify a file but do not know
Norna's source/output distinction. Start with the role of `site/public/`, show
it beside a page's `images/` and `downloads/`, then list exact recognized names
and published locations. Place practical format/size guidance beside the named
artwork. Link detailed managed-image and attachment behavior to their references;
keep automatic-processing proposals out of published documentation.

## Implementation And Verification

Implemented 2026-10-11 at 12:42 CEST. The shared publication policy rejects the
former image directory and directs authors to the owning page's `images/`.
The editor reuses that policy for creation, import, rename and move; its public
folder help now describes only named site artwork and technical files.

The branding illustration moved to its page's managed images with unchanged
source bytes. Reference and Examples now explain source ownership, supported
site artwork, recommended formats/sizes and unchanged-copy behavior. The
previously owner-deleted, unreferenced favicon comparison PNGs are also removed
from the tracked public-image area. The actual logo and favicon remain intact.

Directly relevant verification passed:

- Public synchronization (three cases) and publication contracts (seven cases),
  including refusal of empty `public/images/`, non-destructive failed preflight,
  removal of obsolete output, collision rules, and a build below `/docs/`.
- Eight engine resource-action cases, eight extension resource-adapter cases,
  and the Site Tree engine check. Import refusal is shown in the input dialog;
  cancelling that correction writes no files.
- Documentation links, examples, source snippets and image references.
- Documentation build: 86 HTML pages and 83 search documents. Editor acceptance
  fixture build: 20 HTML pages. The active disposable copy's content check passed.
- Byte comparisons for the moved SVG, named logo/favicon and technical fixture
  output. The former shared-image output directory is absent after preparation.
- Local HTTP checks returned the exact source bytes for logo, favicon and both
  technical review files; the review page renders both short and full links.
- Inspected the branding illustration and editor review page at 1024px, and
  the recognized-file table and size recommendations at 390px.

The active `test-sites/editor-review/` copy was adapted without resetting other
test edits. Its 35 pre-change source files were backed up under
`.local/editor-review-backups/2026-10-11-bl179/`; unrelated source files were
compared byte-for-byte. Public move exercises now use disposable technical
verification files under `.well-known/`, with a matching external import.

No full release suite was run. Native VS Code interaction, Undo/save/reopen and
manual acceptance remain with the owner. No new VSIX is needed: Reload Window
loads this working-tree engine. BL-178 remains an unimplemented idea.
