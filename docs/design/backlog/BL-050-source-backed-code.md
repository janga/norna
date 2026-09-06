# BL-050: Source-Backed Code Excerpts

## Outcome

Developer documentation can display a selected file or named source region
without maintaining a second copied version of that code in `content.md`.

## Evidence

VitePress, Material for MkDocs, and Starlight provide direct or component-based
source inclusion. The completed `BL-046` migration inventory found that the
feature solves real drift in documentation kept beside software, but has less
value for standalone content sites.

## Decisions Required

- Define whether source may be read only from the site project root or from a
  narrower configured root.
- Define symlink, traversal, ignored-file, package, and sensitive-file rules.
- Choose a deterministic region syntax and behavior for a missing or repeated
  region.
- Integrate excerpt files into dev-server watching, build dependencies,
  diagnostics, and packaged-project checks.
- Define the standalone-site experience so the feature does not make code
  project assumptions part of ordinary Norna authoring.
- Keep inclusion build-time only; imported source must never be executed.

## Acceptance Criteria For Design

- A threat model covers path traversal, symlinks, accidentally published
  secrets, and package boundaries.
- The authoring contract identifies file, language, optional region, and
  displayed title without a general include or template API.
- Missing or changed sources fail with the page, block, path, and suggested
  correction.
- Local preview refreshes after an included source file changes.
- A migration can expand the same source to an ordinary fenced block when the
  native feature is unavailable or deliberately disabled.
