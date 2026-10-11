# BL-181: Replace ImageMagick With Sharp

## Outcome

Authors can install Norna through npm and build sites containing JPEG and PNG
images without separately installing ImageMagick. Image processing remains
part of Norna, with the existing authoring syntax, responsive image behavior
and SVG handling.

## Status And Priority

**Ready; first item in Next.** The owner requested this brief, including
automated tests and documentation changes, on 2026-10-11. Preserve the existing
first priority of BL-180 Preserve And Relocate Getting Started Knowledge.
There is no technical dependency on completing that editorial inventory.

This brief scopes implementation; creating it does not implement the switch
or establish that its acceptance checks have passed.

## Current Evidence

Inspected at `f8854d0` on 2026-10-11:

- ImageMagick discovery, dimension reading and conversion are concentrated in
  [generate-images.mjs](../../../scripts/generate-images.mjs). Raster inputs
  are JPEG and PNG. Conversion applies automatic orientation, resizing,
  metadata stripping and WebP quality 82.
- Sharp 0.35.3 is installed indirectly through Astro's optional dependency.
  A local in-memory JPEG-to-WebP probe succeeded. This is not evidence of a
  clean package installation or behavior on another operating system.
- The generator uses output version 3 and source hashes to decide cache reuse.
  Raster URLs contain the source hash and width, but not the processing recipe
  version. Raising the manifest version alone would regenerate different
  bytes at the same URL.
- Dimension reading currently precedes automatic orientation. Verify dimensions
  after orientation rather than copying this ordering into the new pipeline.
- Existing managed-media tests cover cache reuse, missing variants, changed
  sources and SVG output. Markdown-image tests cover generated HTML, ownership
  and moves. Package and CI-lockfile checks already exist.

## Scope And Boundaries

Replace the raster backend and remove its external installation requirement.
Keep `.jpg`, `.jpeg`, `.png` and `.svg` as the supported authoring formats.
Preserve SVG copying, page ownership, source-file immutability, captions,
alternative text, responsive markup, inspection and carousel behavior.

This item does not introduce additional image formats, animation features,
author-selectable image processors, an ImageMagick fallback, or new quality
settings. It does not implement
[BL-178 Automatic Site Image Processing](BL-178-managed-shared-images.md),
which concerns named site artwork such as logos and icons.

`sourceFormat: 2` stays unchanged. The authoring format is unchanged; generated
image cache versions describe a different concern.

## Implementation

1. Declare Sharp as a direct runtime dependency. Select and record a version
   compatible with Norna's supported Node versions; update affected lockfiles
   without relying on Astro to continue supplying Sharp. Ensure its native
   optional packages are installed through the supported npm workflow.
2. Replace command discovery and `identify`/`convert` subprocesses with Sharp.
   Retain one processing backend and an actionable diagnostic when its native
   runtime cannot load. Identify the source file when decoding fails.
3. Use the correctly oriented dimensions for the manifest, aspect ratios,
   carousel checks and variant selection. Preserve the current widths of
   480, 768, 1080, 1440 and 1920, plus the oriented source width when different;
   do not enlarge small sources. Produce WebP, starting with quality 82, and
   verify transparency, colour handling and removal of embedded metadata.
4. Preserve the existing CLI, build, content-sync and local-preview entry
   points, including preview started by the VS Code extension. Keep the native
   image dependency in the project's engine process, not the extension bundle.
5. Remove ImageMagick installation from `.github/workflows/engine-tests.yml`,
   `.github/workflows/deploy.yml` and both starter deployment workflows.
   Check generated-image cache paths and keys against the current `_norna`
   output paths; the inspected starter still uses a former cache path.
6. Update required consumers, fixtures and expectations in the same change.
   Review generated manifests from maintained-site builds; do not hand-edit
   cached image metadata to simulate a successful conversion.

## Regeneration And Cache Policy

Regenerate on the next image-processing operation for each site. There is no
global conversion of all sites and no conversion during `npm install`.
Already published static sites continue to work until their next deployment.

- Give the Sharp raster recipe a new cache identity. Its first `images`,
  `build`, content-sync or preview-start operation regenerates all referenced
  JPEG/PNG variants in the selected site. Current processing scans the site's
  references, so this is a one-time pass over that site's used raster images,
  not generation triggered by a reader opening a page.
- Unreferenced source images and other sites remain untouched. Source images
  are never rewritten. Unchanged SVG output should remain reusable; separate
  the raster recipe identity from the unchanged SVG-copy behavior as needed.
- Subsequent operations reuse valid Sharp output. A changed source, changed
  recipe or missing output triggers regeneration only for the affected image.
- Include the raster recipe identity in generated URLs, through a versioned
  path or a digest that includes the recipe, so browser/CDN caches cannot serve
  old ImageMagick bytes for newly generated Sharp output. Preserve source
  hashes as source identity, independently of the chosen URL construction.
- Publish a successful manifest and remove obsolete generated files only after
  the required conversions succeed. A failed conversion must not be recorded
  as a reusable result or cause source files to be changed.
- Do not add a compatibility mode that indefinitely accepts old raster output
  as current. The one-time regeneration on a site's next processing operation
  keeps subsequent cache behavior uniform.

The implementation note and release guidance must explain that the first
build or preview after upgrading can take longer and change the tracked
generated-image manifest. No manual batch conversion or cache deletion should
be required from the author.

## Automated Tests

Extend maintained tests rather than duplicating their existing assertions.
The initial estimate is roughly 8–12 focused new or extended cases; coverage
of the outcomes below matters more than the number of test functions.

| Area | Required evidence |
| --- | --- |
| Raster output | Valid JPEG and PNG become decodable WebP with the promised widths and aspect ratios; narrow sources are not enlarged. |
| Orientation | An asymmetric EXIF-rotated/mirrored fixture produces the expected pixel arrangement and oriented dimensions; manifest and carousel classification agree with the result. |
| Transparency and colour | Transparent PNG retains alpha; representative profiled/CMYK input produces the intended web colour result within a meaningful tolerance. |
| Metadata and errors | Generated WebP omits EXIF/IPTC/XMP as documented; malformed input and an unavailable Sharp runtime produce useful diagnostics without reporting success. |
| Cache transition | A pre-Sharp manifest and existing raster variants trigger regeneration and new URLs; a second run reuses output; missing variants, changed sources and recipe changes invalidate the appropriate entry. |
| Ownership and static images | Original source bytes remain unchanged; unused sources and another site are untouched; unchanged SVG is copied/reused without rasterization. |
| Integration | Ordinary Markdown images, image blocks, cards and carousels use valid output through CLI, build and preview; source moves and generated HTML remain covered. |

Use small, maintained fixtures whose relevant properties and provenance are
known. Decode output to check dimensions, alpha, orientation and metadata;
do not require byte-for-byte equality with ImageMagick or incidental encoder
output. Keep source-file hash checks to establish source immutability.

Extend `scripts/test-managed-media.mjs` and related existing image tests where
appropriate. Test processing-version invalidation and URL identity explicitly;
the current cache test's changed-source case alone does not cover this switch.
Integrate new checks into a maintained npm/CI entry point.

### Installation Matrix

Add a small GitHub Actions matrix for Windows, macOS and Ubuntu. Each job must:

1. Install the candidate npm tarball in a clean temporary project, including
   its native dependencies, and exercise site creation. Ensure the generated
   site uses that same candidate tarball rather than a previously published
   Norna release.
2. Install using npm and verify a clean `npm ci` from the lockfile used by the
   delivery workflow. Exercise the shared-lockfile case across operating
   systems, rather than only creating a new platform-local lockfile each time.
3. Add small JPEG and transparent PNG fixtures, build the site, and decode or
   inspect its generated image output. Include a repeat build for cache reuse.
4. Establish that `magick`, `identify` and `convert` cannot supply a hidden
   dependency. A runner may already contain ImageMagick; use a controlled
   command environment or failing sentinels that reveal attempted execution.

Use the maintained delivery Node version on all three systems and cover
Norna's minimum supported Node version in an additional Ubuntu job. A real
install and conversion are required: a lockfile dry run is insufficient.
Keep the full regression suite on its primary CI platform rather than
duplicating it in every matrix job. Record tested OS/architecture/Node/npm
versions; three jobs do not establish support for every Linux distribution or
CPU architecture.

## Documentation And Examples

Update current public guidance together with the implementation:

- `README.md`, starter READMEs and Getting Started: normal npm installation
  includes image processing; remove the separate ImageMagick prerequisite.
  Keep native-dependency troubleshooting out of the introductory happy path.
- Reference: requirements, page images and cache behavior, image/build commands,
  publishing and embedded publishing. Describe the automatic first-use cache
  renewal and unchanged authoring format.
- Installation FAQ: replace obsolete installation instructions with focused
  guidance for failed Sharp/native dependency installation. Review incoming
  links and preserve or explain the old `install-imagemagick` anchor where
  needed, so existing links do not become dead ends.
- Examples and their source: update installation demonstrations in Building a
  Site, Norna Extensions and the content-tabs reference. Update the maintained
  content-tabs and navigation-example fixtures and their affected captures.
  Keep shown source and rendered examples identical.
- Tests: update the examples-gallery browser expectations and any documentation
  contracts tied to replaced installation examples. Distinguish active Norna
  installation guidance from arbitrary parser fixture text; historical design
  records need not be rewritten merely because they mention ImageMagick.
- Release notes: explain the removed system dependency, supported installation
  path and one-time image regeneration. Existing user workflows with a now
  unnecessary ImageMagick install step should not require source conversion.

Coordinate the documentation handoff with
[BL-180 Preserve And Relocate Getting Started Knowledge](BL-180-preserve-getting-started-knowledge.md):
its inventory must not reintroduce obsolete installation requirements into the
new introduction. This item covers the dependency change, not the complete
Getting Started rewrite.

## Acceptance And Verification

- The candidate package installs and builds raster-image sites through the
  automated matrix without using ImageMagick.
- Existing authoring syntax and source files remain valid. Sharp output meets
  the image, cache and URL requirements above; SVG behavior is retained.
- `npm test` passes before completion, as this changes installation and shared
  generated-output behavior. During development, run focused image/package
  checks and reuse passes while their relevant inputs remain unchanged.
- Run the relevant browser image and updated-example tests outside the
  aggregate, preview checks, and the documentation Pages build. Reuse checks
  already covered by the aggregate; do not rerun them merely for the commit.
- Inspect a small representative set of photos, transparent artwork and
  screenshots/figures for visible colour or quality regressions. Record that
  inspection separately from automated results. Obtain applicable presentation
  approval under `AGENTS.md` if the output changes materially.
- Current documentation and generated deployment workflows describe the
  delivered installation accurately; documentation/link checks pass.
- Record passed, failed and unrun checks, platform results and any blocking
  failures under the [verification rules](../../engine-development.md#common-checks).

## Sources

- [Sharp installation](https://sharp.pixelplumbing.com/install/): prebuilt
  binaries, optional dependencies and cross-platform lockfile considerations.
- [Sharp input metadata](https://sharp.pixelplumbing.com/api-input/),
  [image operations](https://sharp.pixelplumbing.com/api-operation/),
  [resizing](https://sharp.pixelplumbing.com/api-resize/) and
  [output options](https://sharp.pixelplumbing.com/api-output/).
- [GitHub-hosted runners](https://docs.github.com/en/actions/concepts/runners/github-hosted-runners).

These sources were inspected on 2026-10-11. Recheck relevant supported versions
when selecting the implementation dependency.
