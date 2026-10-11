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
