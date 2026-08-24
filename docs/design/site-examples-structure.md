# Site Examples Structure

This document defines the repository vocabulary for starter files, example
sites, fixtures, and documentation sites.

## Goal

`norna` should make it easy to find runnable examples and understand which
files are product documentation, which files are examples, and which files are
test fixtures.

The repository grew from one local demo, one starter, and a set of tests. The
current structure keeps those roles distinct while allowing runnable examples
to serve as documentation and realistic integration tests.

## Terms

### Starter

A starter is a template copied by `norna init`.

It should be small, conservative, and suitable as the first commit in a real
site repository. It should not be a showcase for every feature.

### Example Site

An example site is a runnable site that demonstrates one or more features.

Examples can be richer than the starter. They may show pages, navigation,
complete theme presets, image stacks, image carousels, cards, notes, surfaces,
and site-specific configuration choices.

### Documentation Site

A documentation site is a runnable `norna` site that explains the product
visually.

It can use images, diagrams, screenshots, and additional pages to explain concepts
such as file structure, presentation inheritance, site navigation, and image
handling.

### Reference Documentation

Reference documentation is GitHub-readable Markdown for exact interfaces and
workflows.

It belongs in `docs/` and should remain useful without building a site. It is
the right home for command reference, configuration reference, content schema,
publishing workflows, and engine development notes.

### Fixture

A fixture is test data.

It should be minimal, stable, and optimized for regression tests rather than
for human reading or visual appeal.

## Repository Structure

Runnable site examples are collected under `examples/`:

```text
examples/
  complete-sites/
    dog-shelter-single-page/
    dog-shelter-multi-page/
  feature-demos/
    theme-presets/
    media-and-surfaces/
    sitewide-content/
```

`complete-sites/` contains coherent sites that show how Norna files work
together in a realistic project:

- `dog-shelter-single-page/`: sections and managed images without additional pages.
- `dog-shelter-multi-page/`: ordered pages with page-local content and
  images.

`feature-demos/` contains focused visual test benches:

- `theme-presets/`: one page per complete built-in theme preset, without
  overrides.
- `media-and-surfaces/`: image and card blocks, notes, palettes and section
  surfaces. This is also the broad demo-build and navigation-test target.
- `sitewide-content/`: convention-based logo handling, navigation, banner stacks,
  dismissal and footer content shared across pages.

The repository Pages workflow builds all examples and publishes them
under `/norna/examples/`. The HTML documentation links to those rendered sites
from its Examples page.

The repository-local `site/` directory is reserved for the documentation site.
`docs/` should remain for reference documentation. It should link to the
documentation site when visual explanation is more useful than reference text.

`starters/basic/` stays separate from examples because it is copied by
`norna init`. It should stay small and conservative.

Fixtures stay under `fixtures/`. They are intentionally smaller and more stable
than examples and should not be confused with user-facing sites.

## Constraints

- Do not remove the starter concept; it has a different purpose from examples.
- Do not make the documentation site the only documentation.
- Do not let examples become required input for production site repositories.
- Keep `norna init` deterministic and easy to test.
- Use examples for build, navigation and visual integration tests where the
  user-facing site is the behavior being protected.
- Use fixtures for isolated edge cases, invalid input and narrowly scoped
  engine regressions.

The repository-local `site/` remains the product documentation site and is not
an example or fixture.
