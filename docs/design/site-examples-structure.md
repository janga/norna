# Site Examples Structure

This document defines the repository vocabulary for starter files, example
sites, fixtures, and documentation sites.

## Goal

`norna` should make it easy to find runnable examples and understand which
files are product documentation, which files are examples, and which files are
test fixtures.

The repository grew from one local demo, one starter, and a set of tests. The
current structure keeps those roles separate.

## Terms

### Starter

A starter is a template copied by `norna init`.

It should be small, conservative, and suitable as the first commit in a real
site repository. It should not be a showcase for every feature.

### Example Site

An example site is a runnable site that demonstrates one or more features.

Examples can be richer than the starter. They may show routes, navigation,
typography presets, typography rhythms, galleries, image carousels, inline
styles, and site-specific configuration choices.

### Documentation Site

A documentation site is a runnable `norna` site that explains the product
visually.

It can use images, diagrams, screenshots, and route pages to explain concepts
such as file structure, presentation inheritance, route navigation, and image
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

## Intended Direction

Runnable site examples are collected under `examples/`:

```text
examples/
  dog-gallery/
  routes-demo/
  typography-demo/
```

Only `dog-gallery/` exists today. Additional examples should be added when
they demonstrate a distinct feature or workflow.

- `dog-gallery/`: current local visual demo, manual inspection site, and
  navigation diagnostic target.
- `routes-demo/`: focused route/navigation example if the dog example becomes
  too broad.
- `typography-demo/`: focused typography preset, rhythm, and override example
  if needed.

The repository-local `site/` directory is reserved for the documentation site.
`docs/` should remain for reference documentation. It should link to the
documentation site when visual explanation is more useful than reference text.

`starters/basic/` stays separate from examples because it is copied by
`norna init`. It should stay small and conservative.

Fixtures may either stay under `fixtures/` or move under a clearly named test
area later. They should not be confused with examples.

## Constraints

- Do not remove the starter concept; it has a different purpose from examples.
- Do not make the documentation site the only documentation.
- Do not let examples become required input for production site repositories.
- Keep `norna init` deterministic and easy to test.
- Keep engine tests using stable fixtures, not visually evolving demo content.

## Open Decisions

- Whether the documentation site should be published anywhere, or exist only as
  a local/example build.
- How local example selection should work when there are multiple runnable
  examples.
