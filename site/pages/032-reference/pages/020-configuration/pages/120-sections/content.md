---
page:
  description: Choose uniform or repeating H2 background surfaces and understand the tree-navigation restriction.
---

# Section backgrounds

An H2 starts a section. `sections.backgroundPattern` assigns coordinated
palette backgrounds to successive H2 sections, not arbitrary colors to headings.

```yaml title="theme.yaml: one continuous reading surface" {2}
sections:
  backgroundPattern: uniform
```

## Patterns

| Value | Sequence | Available navigation |
| --- | --- | --- |
| `uniform` | Normal background throughout | All modes |
| `alternating` | Base, soft, base, soft | `sections`, `top` |
| `accented` | Base, soft, emphasis, soft, base: 1-2-3-2-1-2-3... | `sections`, `top` |

The introduction and first H2 use the normal background. H3 and deeper
headings stay within their H2 surface. Each page restarts the sequence.
Non-uniform bands span the viewport; the content still obeys its width limits.

## Defaults and navigation

Omit the setting to keep the preset's pattern. Without a preset it is `uniform`.
Built-in presets automatically become uniform when navigation resolves to
`tree`. An explicit `alternating` or `accented` override instead fails validation;
remove it or set `uniform`.

A persistent navigation tree already creates a visual region beside the
document. A uniform reading surface keeps that distinction clear. The rule
remains in force on mobile and in Focus reading because the effective site
navigation mode has not changed. Cards, code and callouts retain their own
backgrounds.

This field can be inherited through [page themes](/reference/configuration/theme/#page-themes),
subject to the same navigation rule. Adding a listed child or category can
make an automatic site use tree navigation, exposing a previously valid
non-uniform override as an error.
