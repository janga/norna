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
