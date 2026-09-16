# Documentation for contributors

The [Norna reference](https://janga.github.io/norna/reference/) is the canonical
user reference for source files, configuration, content, commands and reader
behavior. Its single authored source lives under
[`site/pages/032-reference/`](../site/pages/032-reference/); Norna renders those
Markdown files into the documentation site.

Use [Getting Started](https://janga.github.io/norna/getting-started/install-norna/)
for the first-site tutorial and [Examples](https://janga.github.io/norna/examples/)
for maintained source/result demonstrations. Task procedures for editor setup,
publishing and upgrades live under
[Working on a site](https://janga.github.io/norna/reference/workflows/).

## Work on the engine

Start with [Engine Development](engine-development.md) for paths, focused tests,
review environments, package checks and the release procedure. The
[example source index](../examples/README.md) identifies runnable examples;
[BACKLOG.md](../BACKLOG.md) tracks future work.

Read the [Documentation Style Guide](design/documentation-style-guide.md)
before changing reference, schema help, editor descriptions or diagnostics.
Use the [reference maintenance map](design/reference-inventory.md) to find
the code and tests associated with each reference area. Design rationale and
review evidence remain under [`docs/design/`](design/).

## Match documentation to a release

The website describes current development, which may be newer than npm's
latest published package. `norna engine:version` reports the active installation;
`norna engine:version --latest` also checks npm.

For a fixed release, open its Git tag. Through `v0.7.26`, reference sources
remain in that tag's `docs/` directory. Later releases use
`site/pages/032-reference/`. Schema and editor links distinguish the current
web reference from the installed release's source reference.

The published [AI index](https://janga.github.io/norna/llms.txt) links directly
to the same authored Markdown sources. There is no second editable reference
copy in `docs/`.
