# Theme

`site/theme.md` defines optional site-wide visual defaults for a `norna` site.
It uses YAML frontmatter and does not need a Markdown body. If the file is
missing, built-in engine defaults are used.

Page-level presentation in `site/content.md` and route page files is always an
override on top of `site/theme.md`. Section-level presentation is an override
on top of the resolved page presentation.

## Minimal Theme

```yaml
---
navigation:
  brand: Example Gallery
presentation:
  backgroundColor: "#000000"
  textColor: "#f7f4ee"
  typography:
    preset: quiet-gallery
frame:
  colors: presentation
---
```

Starter sites include a marked comment block such as
`norna:start theme-help` / `norna:end theme-help`. The block is only
explorable help text; YAML comments do not affect rendering. The active
configuration is the uncommented YAML below it.

## Navigation

`navigation` is optional. It currently supports:

- `brand`: optional site-wide brand or home-link text shown in the site
  navigation.

If `navigation.brand` is omitted, Norna uses the homepage `title` from
`site/content.md`. Use `navigation.brand` when the homepage title is editorial
or route-specific, but the navigation should keep a stable site name.

Example:

```yaml
navigation:
  brand: Norna
```

## Presentation

`presentation` is optional. It can contain:

- `backgroundColor`: optional quoted hex color in `#rgb`, `#rrggbb`, or
  `#rrggbbaa` form.
- `textColor`: optional quoted hex color in `#rgb`, `#rrggbb`, or
  `#rrggbbaa` form.
- `inlineStyles`: optional named inline text styles.
- `typography`: optional typography preset and overrides. See
  [Typography](typography.md).

Example:

```yaml
presentation:
  backgroundColor: "#101418"
  textColor: "#f4f1ea"
```

## Page And Section Overrides

Site-wide presentation belongs in `site/theme.md`. Page-level presentation in a
page file is always an override on top of the theme:

```yaml
presentation:
  typography:
    overrides:
      body:
        paragraphSpacing: 1em
```

Section-specific presentation belongs under `sections[].presentation`:

```yaml
sections:
  - id: intro
    presentation:
      backgroundColor: "#161616"
      textColor: "#ffffff"
      typography:
        preset: statement
```

If a page omits `presentation`, it uses the theme presentation unchanged. If a
section omits `presentation`, it uses the resolved page presentation.

Configured section backgrounds render as full-width horizontal bands while the
section content keeps the normal page and gallery widths. The top spacing
before the first heading, the spacing between sections, and the spacing after
the final section are part of the section background.

Configured section text colors apply to section headings, Markdown text,
Markdown subheadings, and gallery captions. Links keep the global accent color.

## Frame Colors

`frame.colors` controls the sticky navigation and footer colors.

Allowed values:

- `presentation`: use the resolved presentation colors for this level.
- `theme`: use the site theme frame colors. This is useful in page-level
  frontmatter.
- explicit colors:

```yaml
frame:
  colors:
    backgroundColor: "#111111"
    textColor: "#eeeeee"
```

The sticky section navigation row and footer use the resolved frame colors, not
section-specific presentation.

## Inline Styles

`presentation.inlineStyles` defines named inline text styles that can be used
from Markdown:

```yaml
presentation:
  inlineStyles:
    highlight:
      color: "#ffd84d"
```

Inline style names must match `^[a-z][a-z0-9-]*$`. Each style currently
supports a required `color` field using the same quoted hex color format as
`textColor`.

Apply an inline style in Markdown with `[text]{.style-name}`:

```md
This sentence contains [highlighted text]{.highlight}.
```

`content:check` fails if Markdown uses an inline style that is not defined in
`site/theme.md` `presentation.inlineStyles`.
