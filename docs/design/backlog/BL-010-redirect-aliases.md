# BL-010: Static Redirect Aliases

## Outcome

Known old page URLs can lead readers to a current canonical page after a site
reorganization.

## Dependencies

Implement after `BL-001` and `BL-002`; aliases must participate in global URL
collision checks and have explicit sitemap behavior.

## First Scope

- Let a page declare old site-relative paths through constrained metadata.
- Emit small static redirect documents that identify the canonical target.
- Exclude aliases from the sitemap.
- State clearly that static documents are not HTTP 301 responses.

## Acceptance Criteria

- Alias, page, category, public-file, and generated-route collisions stop the
  build with source locations.
- Targets work with root and configured base paths.
- Redirect output has a normal accessible link when automatic navigation does
  not run.
- Alias chains and external redirect targets are rejected initially.
