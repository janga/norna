# BL-004: Default 404 Page

## Outcome

Norna emits a useful localized `404.html` that retains the site's identity and
provides a route back to Home.

## Dependency

Implement after `BL-001` so Home URLs and base paths use the canonical URL
resolver.

## First Scope

- Render an engine-owned message through the normal site frame.
- Use built-in language-pack text and a normal link to Home.
- Support root and configured base paths.
- Defer editorial 404 content until a concrete need justifies a special source
  model.

## Acceptance Criteria

- Builds always contain one `404.html` unless a documented collision rule
  applies.
- The page remains usable without client-side JavaScript.
- GitHub Pages serves the output as expected for root and project sites.
- Navigation and asset URLs remain valid from the 404 location.
