---
page:
  description: Recognize obsolete source filenames and settings when bringing an older site to the current file model.
---

# Convert legacy site sources

The following names belong to earlier Norna releases. Use this checklist
only when those files or terms exist in an older site; new projects should
start from the current starter. Preserve a working copy before converting.

## Convert root settings to YAML


- Replace executable `site/config.mjs` or Markdown `site/config.md` with
  `site/config.yaml`. Re-enter only current fields from
  [Configuration](/reference/configuration/site/); do not translate JavaScript behavior.
- Replace `site/theme.md` with `site/theme.yaml`. Start with one complete
  preset, then add only current overrides from [Theme](/reference/configuration/theme/).
- Replace `site/sitewide-content.md` with `site/sitewide-content.yaml` when the
  site has a logo display override, banners, or footer content. See
  [Sitewide Content](/reference/configuration/shared-content/).

## Move Content Into Page Directories

- Move the former homepage `site/content.md` to
  `site/pages/000-home/content.md`.
- Move homepage source images into `site/pages/000-home/images/`.
- Replace `site/routes/` with `site/pages/`.
- In each old route directory, rename `route-content.md` to `content.md`.
- Keep the three-digit sibling order prefix. A directory such as
  `010-guide/` still produces `/guide/`; the prefix is not part of the URL.
- Put child entries under the nearest non-home page or category's `pages/`
  directory. Use `content.md` when the parent needs its own page; use
  `category.yaml` when it is only a navigation label. Home is the front door
  and cannot have children.

Every page must contain exactly one H1. H2 headings define sections. Norna now
derives heading ids when they are omitted; keep an explicit `{#stable-id}` only
when a public anchor must survive a heading-text change. Remove old `sections`
frontmatter and page-level presentation settings. Current page frontmatter supports `page.description`, `page.aliases` and
`navigation.listed`; presentation belongs in theme files.

## Rename Content Blocks

Replace previous content-block fence names throughout page Markdown:

| Previous name | Current name |
| --- | --- |
| `norna-image-stack` | `image-stack` |
| `norna-image-carousel` | `image-carousel` |
| `norna-carousel` | `image-carousel` |
| `carousel` | `image-carousel` |
| `norna-card-list` | `card-list` |
| `norna-page-list` | `page-list` |

Rename the fence, then compare its fields with the current content reference.
Recent syntax uses structured YAML; older field formats may also need conversion. `content:check` reports a focused migration error if it encounters
one of the previous names.

## Move Page Presentation Into Theme Files

The root `site/theme.yaml` owns the preset, Appearance, palette, corners,
typography, page frame, navigation presentation, and structured content-block
defaults. A limited `theme.yaml` in a page or category directory may contain
only the layout, image, and section-background fields documented under
[Page Themes](/reference/configuration/theme/#page-themes). Descendants inherit those values.

Do not carry route-specific presets, fonts, colors, or navigation settings into
page themes.

Replace superseded root-theme terms when upgrading:

| Previous term | Current term |
| --- | --- |
| `palette: dark` | `palette: near-monochrome` |
| `palette: light` | `palette: arctic-blue` |
| `palette: paper` | `palette: warm-paper` |
| `palette: cool-green` | `palette: arctic-blue` |
| `shape: square` | `corners: square` |
| `shape: soft` | `corners: rounded` |
| `colorMode` | `appearance` |
| `sections.backgroundPattern: cycling` | `sections.backgroundPattern: accented` |

The corresponding reader cookie is now named `norna-appearance`. Existing
`norna-color-mode` cookies are not migrated, so a returning visitor sees the
configured appearance once before making a new Display choice.

`cool-green` was removed when the built-in palettes were expanded. Use
`arctic-blue` as its closest supported replacement, then review the result in
both Light and Dark appearances.

Remove `readerControls` from `theme.yaml`. Appearance and reading width are
always available in the Display panel. Focus reading is offered automatically
when navigation resolves to `tree`. Use `appearance.default` to select the
initial Appearance and `layout.textWidth` to select the initial reading width.

## Update Project Scripts And Ignores

Compare `package.json`, `.gitignore`, and `site/.gitignore` with a newly
generated site. Keep the exact `@janga/norna` dependency and regenerated
`package-lock.json` committed.

Generated paths should be ignored:

```text
dist/
.astro/
site/.norna/.astro/
site/.norna/dev/
site/.norna/public/
```

Keep `site/.norna/generated-images.json` versioned because it records reusable
managed-image output. See [Generated Files](/reference/site/files/#generated-files) for
the current boundary.


Return to the [upgrade workflow](/reference/workflows/upgrading/) to validate,
inspect and commit the converted site.
