---
page:
  description: Choose a preset and understand site-wide overrides and inherited page themes.
---

# Theme configuration

The required `site/theme.yaml` chooses the site's presentation. Start with a
**preset**, a coordinated set of colors, fonts, spacing and media defaults:

```yaml title="site/theme.yaml"
preset: documentation
```

## Presets and root overrides

| Preset | Intended use |
| --- | --- |
| `documentation` | Sustained reading, guides and reference; narrow serif prose |
| `project` | Product/project explanation with code, cards and supporting images |
| `portfolio` | Image-led presentation with broad media and restrained sans-serif text |
| `statement` | Short editorial presentations with stronger headings and spacious rhythm |

The preset does not create content or choose navigation. Those follow the
page tree and `config.yaml`. [Preset values](/reference/configuration/presets/)
lists the complete public defaults; the [Theme explorer](https://janga.github.io/norna/examples/theme-presets/)
lets you compare the same content interactively.

Write overrides beside `preset`; nested objects merge by key:

```yaml title="site/theme.yaml: change only palette and text width" {2,4}
preset: documentation
palette: near-monochrome
layout:
  textWidth: normal
```

Omitting `preset` is valid. Unspecified values then use engine defaults given
in the relevant setting pages, rather than an implied preset. Unknown fields
are errors; YAML is not an open-ended CSS or component configuration language.

## Site-wide settings

| Key | Controls |
| --- | --- |
| `preset` | Coordinated starting values |
| [`palette`](/reference/configuration/palettes/) | Named light/dark color pair |
| [`appearance`](/reference/configuration/appearance/) | Initial light/dark/system choice |
| `corners` | `square` or `rounded` framed elements |
| [`layout`](/reference/configuration/layout/) | Frame, gutters, prose and structural spacing |
| [`images`](/reference/configuration/images/) | Standalone image alignment and size |
| [`blocks.cardList.width`](/reference/content/cards/#width) | Site default for card-list width |
| [`typography`](/reference/configuration/typography/) | Font and text-role styling |
| [`sections`](/reference/configuration/sections/) | H2 background sequence |

`corners: square` uses no radius. `rounded` uses coordinated small, medium and
large radii; without a preset these are 2px, 6px and 8px. The engine default
is `rounded`.

## Page themes

An optional `theme.yaml` in a non-home page or category folder overrides only
a limited part of the root theme and passes those choices to descendants:

```text title="An inherited local override"
site/theme.yaml                           # Site-wide identity
site/pages/010-guide/theme.yaml           # Guide and its descendants
site/pages/010-guide/pages/010-install/   # Inherits the Guide override
```

```yaml title="site/pages/010-guide/theme.yaml"
layout:
  textWidth: narrow
  contentSpacing: compact
images:
  presentation: prose-aligned
  width: 760px
sections:
  backgroundPattern: uniform
```

Only `layout.textWidth`, `layout.contentSpacing`, `images` fields and
`sections.backgroundPattern` are allowed. A more local theme replaces the
same fields. A supplied local file must contain at least one accepted field.

Colors, corners, fonts, page width, gutters and card-list defaults remain
site-wide. Pages cannot select another preset. Explicit non-uniform section
backgrounds remain invalid with tree navigation.

## Inspect and validate

`theme:export <preset>` creates an inactive reference YAML file with the
installed preset values. `typography:show` reports effective text styling.
See [Theme inspection](/reference/commands/theme/) for options.

Use `config:check` and `content:check` after changing themes. Reader choices
in [Display](/reference/reader/display/) adapt presentation without editing
theme files; a saved reader choice can mask a changed initial default.
