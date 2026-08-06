# Site Examples Structure Note

This note defines the intended repository vocabulary before reorganizing
starter files, demo sites, fixtures, and documentation sites. It is a design
note, not an implementation record.

## Goal

`norna` should make it easy to find runnable examples and understand which
files are product documentation, which files are examples, and which files are
test fixtures.

The current repository grew from one local demo, one starter, and a set of
tests. A future structure should keep those roles separate.

## Terms

### Starter

A starter is a template copied by `norna init`.

It should be small, conservative, and suitable as the first commit in a real
site repository. It should not be a showcase for every feature.

### Example Site

An example site is a runnable site that demonstrates one or more features.

Examples can be richer than the starter. They may show routes, navigation,
typography presets, galleries, image carousels, inline styles, and site-specific
configuration choices.

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

A future structure should collect runnable site examples in one place, for
example:

```text
sites/
  starter-basic/
  dog-gallery/
  routes-demo/
  typography-demo/
  docs-site/
```

The exact names can change, but the roles should remain clear:

- `starter-basic/`: copied by `norna init`.
- `dog-gallery/`: local visual demo and manual inspection site.
- `routes-demo/`: focused route/navigation example if dog-gallery becomes too
  broad.
- `typography-demo/`: focused typography preset and override example if needed.
- `docs-site/`: visual documentation built with `norna`.

`docs/` should remain for reference documentation. It should link to the
documentation site when visual explanation is more useful than reference text.

Fixtures may either stay under `fixtures/` or move under a clearly named test
area later. They should not be confused with examples.

## Constraints

- Do not remove the starter concept; it has a different purpose from examples.
- Do not make the documentation site the only documentation.
- Do not let examples become required input for production site repositories.
- Keep `norna init` deterministic and easy to test.
- Keep engine tests using stable fixtures, not visually evolving demo content.

## Open Decisions

- Exact top-level directory name: `sites/`, `examples/`, or another name.
- Whether `starter-basic/` belongs beside examples or in a separate template
  area.
- Whether the current dog-gallery remains the primary manual test site or
  becomes one example among several.
- Whether the documentation site should be published anywhere, or exist only as
  a local/example build.
- How demo selection should work in npm scripts, for example
  `npm run demo:dev -- dog-gallery`.
