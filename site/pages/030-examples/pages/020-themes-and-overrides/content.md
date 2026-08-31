---
page:
  description: Compare Norna themes and understand the scope of presets, overrides and reader choices.
---

# Themes and overrides

Norna separates the site's authored presentation from temporary choices made
by an individual reader. Start with one coordinated preset, add only the root
or page overrides the site actually needs, and leave reader preferences to the
Display panel.

## Start with a preset {#presets}

A preset supplies a complete visual starting point rather than one isolated
color or font. Compare the presets with identical text, code, notes, images,
captions, a carousel and cards:

```norna-card-list
flow: grid
size: m

- title: Portfolio
  text: Broad image and content areas with restrained typography.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-portfolio/
- title: Documentation
  text: Reading-focused typography, compact rhythm and a narrow prose column.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-documentation/
- title: Project
  text: A balanced treatment for project sites, code, cards and supporting media.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-project/
- title: Statement
  text: Spacious rhythm, stronger headings and prominent media.
  link: https://janga.github.io/norna/examples/feature-demos/theme-preset-statement/
```

[Switch between all four presets without changing the comparison content](https://janga.github.io/norna/examples/theme-presets/).

The selected preset is root configuration in `site/theme.yaml`:

```yaml
preset: documentation
```

## Root theme overrides {#root-overrides}

Values beside the preset override that part of the preset for the complete
site. Unmentioned values continue to come from the preset:

```yaml
preset: documentation
layout:
  textWidth: normal
blocks:
  cardList:
    width: text
```

Colors, corners, typography, navigation presentation and structured-block
defaults belong to the root theme. Keeping them site-wide gives the pages a
shared visual identity.

## Page theme overrides {#page-overrides}

An optional `theme.yaml` beside a page or navigation category has a deliberately
smaller scope. It may adjust layout, content spacing, managed-image sizing and
the section background pattern for that page subtree:

```yaml
layout:
  textWidth: wide
  contentSpacing: normal
images:
  width: 1000px
```

A page theme cannot select another preset or replace the site's colors,
corners, typography, navigation treatment or content-block defaults.

## Reader choices {#reader-choices}

Narrow, Standard and Wide reading widths are always available in the Display
panel. The root theme chooses the initial width; a reader's selection is stored
in that browser and does not modify `theme.yaml`.

The site owner may also offer color-mode and focus-reading choices:

```yaml
readerControls:
  colorMode: true
  focusReading: true
```

These settings expose bounded reader controls. They do not let a reader edit
the theme or change the published source.

See the complete [Theme reference](https://github.com/janga/norna/blob/main/docs/theme.md)
for accepted values, preset defaults and the exact page-theme boundary.
