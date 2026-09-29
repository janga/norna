---
page:
  description: Choose a root preset, inherit visual settings, and explicitly replace a theme for a branch or one page.
---

# Theme configuration

Every site has a required `site/root/tree-theme.yaml` with an explicit
**preset**: a coordinated set of colors, fonts, spacing and media defaults.
Start with one line:

```yaml title="site/root/tree-theme.yaml"
preset: documentation
```

Other settings in the file override that preset. Optional theme files farther
down the page tree can modify inherited settings or explicitly select a new
preset. Reader choices remain in effect over the authored theme.

## Presets and root overrides

| Preset | Intended use |
| --- | --- |
| `documentation` | Sustained reading, guides and reference; narrow serif prose |
| `project` | Product/project explanation with code, cards and supporting images |
| `portfolio` | Image-led presentation with broad media and restrained sans-serif text |
| `statement` | Short editorial presentations with stronger headings and spacious rhythm |

The preset does not create content or choose navigation. Those follow the
page tree and `site-config/settings.yaml`. [Preset values](/reference/configuration/presets/)
lists the public defaults; the [Theme explorer](https://janga.github.io/norna/examples/theme-presets/)
lets you compare the same content interactively.

Write overrides beside `preset`; nested settings merge by key:

```yaml title="site/root/tree-theme.yaml: customize the chosen preset" {2,4}
preset: documentation
palette: near-monochrome
layout:
  textWidth: normal
```

The root file must contain `preset`. Values not specified by the selected
preset or its overrides use Norna's engine defaults. Unknown fields are errors;
YAML is not an open-ended CSS or component configuration language.

## Visual settings

Both `tree-theme.yaml` and `page-theme.yaml` accept these settings:

| Key | Controls |
| --- | --- |
| `preset` | New visual base; replaces inherited settings |
| [`palette`](/reference/configuration/palettes/) | Named light/dark color pair |
| [`appearance`](/reference/configuration/appearance/) | Initial light/dark/system choice |
| `corners` | `square` or `rounded` framed elements |
| [`layout`](/reference/configuration/layout/) | Frame, gutters, prose and structural spacing |
| [`images`](/reference/configuration/images/) | Standalone image alignment and size |
| [`blocks.cardList.width`](/reference/content/cards/#width) | Default card-list width |
| [`typography`](/reference/configuration/typography/) | Font and text-role styling |
| [`sections`](/reference/configuration/sections/) | H2 background sequence |

`corners: square` uses no radius. `rounded` uses coordinated small, medium and
large radii of 2px, 6px and 8px. Technical settings, shared content and reader
control availability remain outside the theme.

## Page themes

The filename controls scope; the presence of `preset` controls inheritance:

| File | Scope |
| --- | --- |
| `site/root/tree-theme.yaml` | Initial theme for the homepage and all descendants; required, including `preset` |
| `site/root/pages/010-guide/tree-theme.yaml` | Guide and its descendants; optional |
| `page-theme.yaml` beside any `content.md` | That page only, applied after its tree theme; optional |

Without `preset`, a local file changes only its supplied values. For example,
this makes the guide and its children narrower while keeping inherited colors,
fonts and image settings:

```yaml title="site/root/pages/010-guide/tree-theme.yaml"
layout:
  textWidth: narrow
```

A more local tree file can override the same value. Later changes to an
ancestor still reach all fields the branch has not overridden. An empty
optional file makes no changes. Remove a field to resume its inherited value.

Use `page-theme.yaml` for a change that must not reach children. This example
widens only the homepage; children continue to inherit `root/tree-theme.yaml`:

```yaml title="site/root/page-theme.yaml"
layout:
  textWidth: wide
```

### Select a new base

An explicit `preset` discards all ancestor theme values and starts from the
selected preset plus engine defaults. The other fields in that same file then
modify the new base:

```yaml title="site/root/pages/010-guide/tree-theme.yaml"
preset: documentation
palette: near-monochrome
```

This guide branch keeps its own base when an ancestor theme changes. Selecting
the same preset as the ancestor also starts a new base. In `page-theme.yaml`,
the same operation replaces the base for that page alone; children retain the
tree theme. Removing `preset` resumes inheritance while retaining other fields
in the file. Removing an optional file removes its modifications and any local
preset choice. The root tree theme is required and cannot be removed.

Search and error pages use the root tree theme, without homepage-only changes.
Navigation colors and page content use the current page's theme together.

### Compatible combinations

Resolved themes must preserve Norna's presentation rules. Text-aligned images
cannot explicitly request a viewport-height limit; switching to `prose-aligned`
without such a limit removes an inherited limit. Responsive heading sizes must
keep H1 larger than H2, H2 larger than H3, and H3 larger than H4. Tree navigation
uses a uniform section background: an explicit `alternating` or `accented`
request is invalid, while a pattern supplied only by the preset adapts to
`uniform` automatically.

## Inspect and validate

`theme:export <preset>` creates an inactive reference YAML file with the
installed preset values. `typography:show` reports the root tree's text styling.
See [Theme inspection](/reference/commands/theme/) for options.

Use `config:check` for an early theme check; a normal build also validates
configuration and content. Reader choices in [Display](/reference/reader/display/)
adapt presentation without editing theme files; a saved reader choice can
mask a changed initial default. Focus reading remains a reader choice.
