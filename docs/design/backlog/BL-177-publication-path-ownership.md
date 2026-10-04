# BL-177: Publication Path Ownership And Collision Checks

## Purpose

Give every published URL area one owner. A page named images, downloads or
shared must not compete with files published from another source directory.

## Decisions Made

The owner approved this scope on 2026-10-04, including implementation.

- Reserve `/_norna/` for resources, below the configured site base path.
  Keep the current source tree, page ownership and content-hashed image URLs.
- Publish managed images below `/_norna/images/`, attachments below
  `/_norna/downloads/`, and shared public images below `/_norna/shared/`.
- Restrict public sources to robots.txt, CNAME, llms.txt, recognized logos,
  browser icons and social images, an explicit shared-image area, verification
  files and .well-known/. The generator owns sitemap.xml and 404.html.
- Verification filenames outside .well-known/ must be explicitly declared.
  Accepting a verification HTML file does not permit arbitrary HTML pages.
- Check all publication owners through shared engine rules during validation,
  creation, import, rename, move and build. Report both sources and the URL.
- No migration tool, old resource URLs, redirects or duplicate publication
  are required. Update maintained references and fixtures with the change.
- Normal builds never rewrite authored source files.
- Shared-image processing is a separate follow-up, BL-178. Stable original
  image addresses and Copy Link for managed page images are outside this item.

## Implementation Brief

Keep local Markdown forms (`images/name.jpg`, `downloads/file.pdf` and existing
shorthands). Full attachment URLs use an unambiguous page key: `~home` for the
homepage, or slug segments joined by `--`, which is not legal inside a slug.
For example, `/help/install/` owns
`/_norna/downloads/help--install/guide.pdf`. This also prevents an extensionless
attachment from claiming the directory of a descendant page.

Shared images live in `public/images/`; recognized site images retain their
current root filenames in public/. They publish below `/_norna/shared/`.
Technical public files retain their explicit paths. Settings `verificationFiles`
lists exact root filenames. .well-known/ permits regular files and nested
directories. Reject symlinks, unsafe paths, case/Unicode-equivalent collisions,
unrecognized files and attempts to populate generated resource areas.

Preserve useful public-source labels in diagnostics. Move generated search
assets and compiled CSS/JavaScript into separate areas under /_norna/ as well;
keep the reader-facing search page at /search/ when search is enabled.
Root-specific hosting requirements remain the host's responsibility when a site
is deployed below a path; no build writes outside its own output directory.

## Acceptance Checks

- Identical filenames belonging to Home, nested pages and shared images have
  distinct output paths. Pages named images, downloads and shared still work.
- Allowed technical sources and declared verification files publish unchanged;
  arbitrary public files fail before generated output is replaced.
- File/directory, case and Unicode collisions report the sources and URL.
- Local attachment rendering, Copy Link, rename and page move use the same
  paths, preserving titles, reference definitions, query strings and fragments.
- Hash changes select new image output. Existing SVG/raster rendering and
  search work with a non-root base path, including without JavaScript where
  the feature otherwise supports it.
- Documentation and generated schemas describe the accepted public inputs.
- Owner performs native VS Code review; automated checks do not claim it.

## Dependencies

Builds on BL-154 Site Tree Context Actions, BL-155 Page Attachments,
BL-159 Managed Local Markdown Images and BL-160 Standard Markdown For Local
Attachments. Supersedes their unrestricted public-file publication paths.

## Implementation And Verification

Implemented on 2026-10-04. The shared publication policy supplies resource
addresses, public-source validation and collision checks to build, content
validation, editor operations and page creation. Public Markdown image links
now participate in reference discovery and rename/move updates. Generated
image names preserve the source extension so equal bytes in same-stem JPG
and JPEG sources cannot claim one output file. Existing content hashing and
cache reuse remain in place.

Directly relevant checks passed:

- Publication policy and output collisions; public sync; page attachments;
  link resolution; file and page rename/move; aliases; new-page creation.
- Editor engine language/source operations, placement and resource adapter
  contracts, including cancellation and rollback. These are automated tests.
- Managed SVG/raster output, changed-image hashes, cache reuse and repair;
  ordinary Markdown images; card images and client asset loading; static
  search and search indexing of tabs.
- Generated schema consistency, schema metadata, unused-code check and
  whitespace check.
- Isolated documentation build: 87 HTML pages and 83 search documents.
  All 74 distinct resource files referenced by rendered HTML existed.
- A dedicated build verified logo, icon, social-image, shared-image and
  attachment addresses below `/docs/`, including unchanged published bytes.
- Updated editor acceptance fixture: 20 generated HTML pages. Its source
  examples use supported shared images and the new attachment addresses.

The documentation test reaches an existing unrelated assertion: it expects
seven entries below Examples, while the owner's current move of Complete
sites leaves six there. That source move and assertion were left unchanged.

Native VS Code suggestions, Undo/save/reopen and manual interface acceptance
remain for the owner. This changes the engine and generated schema, with no
new extension package. Reload Window loads the working-tree engine. The active
editor-review scratch copy and its in-progress tests were left untouched;
only the maintained fixture was updated. Shared-image processing remains
BL-178 Managed Shared Images.
