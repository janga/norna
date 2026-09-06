# BL-052: Documentation Migration Assistant

## Outcome

A maintainer can assess a Docusaurus, VitePress, MkDocs, or Starlight source
tree before migration and receive a complete account of what Norna can keep,
rewrite, or cannot yet represent.

## Evidence

The completed `BL-046` inventory defines content-preserving migration as the
target. Existing evaluation copies demonstrate that ordinary Markdown, page
hierarchy, and links migrate well, while MDX components, template expressions,
tabs, includes, and dialect-specific metadata need explicit translation.
Manual discovery across a large tree is error-prone even when Norna should not
adopt the source product's feature.

## Syntax Status: No New Content Syntax

The assistant must emit only current, accepted Norna syntax or the documented
plain-Markdown fallback for a missing feature. It must not make a competitor's
syntax an implicit Norna dialect.

The CLI contract needs a separate review. A read-only command shaped like
`norna migrate:check --from docusaurus <source-directory>` is a reasonable
starting point, but the supported products, configuration discovery, report
format, and command name are not approved by this draft.

## First Scope

- Start with a read-only audit. Classify every source file and unsupported
  construct as direct, deterministically rewritable, or unresolved.
- Report source file and line, detected dialect, proposed Norna form, and any
  information or interaction that a rewrite would lose.
- Detect MDX imports and JSX, custom containers, tabs, code metadata, imported
  snippets, includes, frontmatter fields, template expressions, and plugins
  that affect content.
- Never execute source components, templates, plugins, or configuration.
- Use parser-backed inspection where a maintained parser exists. Do not infer
  nested syntax from regular expressions alone.
- Defer file writes until the read-only report has been tested against the
  retained source corpus and the output-directory safety contract is defined.

## Later Write Mode

- Write only to an explicitly selected empty destination.
- Preserve page hierarchy, titles, descriptions, listed state, URLs, internal
  links, and public files when the source model provides them.
- Use accepted Norna constructs where they exist and readable Markdown
  fallbacks otherwise.
- Leave a machine-readable unresolved report and fail the migration when any
  source content would otherwise be discarded.
- Keep source provenance for expanded includes, imported code, converted
  diagrams, and other generated output.

## Acceptance Criteria For Design

- Representative fixtures cover all four primary source systems and pin their
  source versions.
- Re-running an audit produces the same ordered report.
- Unsupported syntax is never omitted or downgraded without an explicit
  diagnostic.
- The design separates source-dialect recognition from Norna page and content
  generation.
- A write-mode proposal defines collision handling, rollback, partial output,
  symlinks, sensitive files, and existing destinations before implementation.
- The package and dependency impact of each source parser is measured before
  it can become a runtime dependency of Norna.
