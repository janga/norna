# BL-005: Static Search

## Outcome

Larger sites can opt into an accessible search page backed by an index of the
completed static HTML.

## Dependencies

Implement after `BL-001` and `BL-002` so search shares page inclusion, URLs,
anchors, and base-path rules with validation and sitemap output.

## First Scope

- Evaluate Pagefind or an equivalent established post-build indexer.
- Add one site-wide enable switch and a generated `/search/` page.
- Index editorial page and section content while excluding navigation,
  banners, and footer content.
- Link results to matching pages or section anchors.
- Load search JavaScript only on the search experience.

## Acceptance Criteria

- Search works with supported languages, nested pages, and GitHub Pages base
  paths.
- Ordinary pages remain free from search JavaScript.
- Local development has a predictable documented index-refresh workflow.
- Dependency size, licensing, maintenance, and package impact are reviewed
  before adoption.
