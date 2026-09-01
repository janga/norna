# BL-002: Automatic Sitemap

## Outcome

Every public multi-page build receives a deterministic `sitemap.xml` generated
from Norna's canonical page graph.

## Dependency

Implement after `BL-001` so URL normalization and public-page inclusion use one
shared contract.

## First Scope

- Include every routable public page, including pages hidden from navigation.
- Exclude navigation-only categories because they do not produce pages.
- Use the configured public site URL and base path.
- Fail clearly when `public/sitemap.xml` conflicts with generated output.
- Omit `lastmod` until Norna owns a trustworthy date source.

## Acceptance Criteria

- Output is stable for unchanged page trees.
- Root and base-path builds contain correct absolute URLs.
- Nested and unlisted pages follow the documented inclusion rule.
- A source-file collision stops the build before output is overwritten.
