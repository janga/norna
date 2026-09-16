---
page:
  description: Choose font, typography profile and rhythm, and look up supported text-role overrides.
---

# Typography

Root `site/theme.yaml` controls fonts and text styling throughout the site.
The preset already supplies coordinated values; add overrides only for choices
that should differ. Page themes cannot change typography.

```yaml title="site/theme.yaml: change body line height" {4}
typography:
  overrides:
    body:
      lineHeight: 1.55
```

## Font, profile and rhythm

| Field under `typography` | Values and effect | Engine default without preset |
| --- | --- | --- |
| `fontFamily` | Nonempty CSS font-family stack | `Arial, 'Helvetica Neue', Helvetica, sans-serif` |
| `profile` | Coordinated sizes, alignment, weights and line heights | `restrained` |
| `rhythm` | Text-near spacing: `compact`, `normal`, `airy` | `normal` |
| `overrides` | Specific text-role changes after profile and rhythm | None |

`fontFamily` cannot contain semicolons, braces or line breaks. Norna does not
download fonts; name fonts readers can access and include fallback families.

| Profile | Intended effect |
| --- | --- |
| `restrained` | Lighter headings, normal prose and centered captions |
| `dense` | Tighter line heights and wider prose |
| `reading` | Generous body line height, narrow prose and left captions |
| `statement` | Stronger headings for short declarative pages |

Every role defaults to size `medium`, but the role scales differ: H1 remains
larger than H2, then H3 and H4. Rhythm controls heading, paragraph and caption
spacing; [layout spacing](/reference/configuration/layout/) controls gaps
between sections and structured blocks.

## Override fields

Put role settings below `typography.overrides`:

| Role | Accepted fields |
| --- | --- |
| `headings.h1` through `headings.h4` | `align`, `size`, `weight`, `lineHeight`, `spacingBefore`, `spacingAfter` |
| `body` | `align`, `size`, `lineHeight`, `paragraphSpacing` |
| `caption` | `align`, `size`, `lineHeight`, `spacingBefore` |

| Field | Accepted value |
| --- | --- |
| `align` | Object with `desktop`, `mobile` or both; each `left`, `center` or `right` |
| `size` | `small`, `medium`, `large`, `xlarge`, relative to the text role |
| `weight` | Heading weights 400, 500, 600 or 700 |
| `lineHeight` | Unitless; headings 1-3, body 1.4-3, captions 1.25-3 |
| Spacing fields | `0` or nonnegative length in `px`, `rem`, `em`, `ch` or `lh` |

```yaml title="site/theme.yaml: heading alignment and spacing"
typography:
  overrides:
    headings:
      h2:
        align:
          desktop: left
          mobile: center
        spacingAfter: 0.55em
```

Text width is `layout.textWidth`, not a typography override. It replaces the
profile's baseline width and remains subject to the reader's Display choice.

## Inspect effective values

`typography:profiles` lists installed profile and rhythm values.
`typography:show` reports resolved values with their origin for the root and
pages. See [Theme inspection](/reference/commands/theme/) for invocation.
