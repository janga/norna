# BL-001: Internal Link And Anchor Validation

## Outcome

`content:check` reports broken internal page, heading-anchor, and public-file
links before build or publication.

## Why First

This establishes one reusable resolver for Norna page identities, URLs,
anchors, base paths, and public files. Sitemap, redirects, search, and editor
diagnostics all benefit from the same rules.

## First Scope

- Validate local links found in page Markdown across the complete site.
- Resolve relative and site-relative page paths, generated heading ids,
  explicit heading ids, and files under `public/`.
- Ignore external schemes and keep optional network checking outside this
  feature.
- Aggregate all failures through existing content diagnostics.
- Reuse the resolver in the editor service where practical.

## Acceptance Criteria

- Valid links work with root and configured base-path sites.
- Missing pages, anchors, and public files name the source page and link.
- Encoded characters, query strings, and trailing-slash forms have defined
  tests.
- A link is interpreted by the same page and heading model used for rendering.
- No network request is required by `content:check`.
