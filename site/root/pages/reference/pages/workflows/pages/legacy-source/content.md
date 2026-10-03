---
page:
  description: Recognize obsolete source filenames and settings when bringing an older site to the current file model.
navigation:
  order: 6000
---

# Convert legacy site sources

The following names belong to earlier Norna releases. Use this checklist
only when those files or terms exist in an older site; new projects should
start from the current starter. Preserve a working copy before converting.

## Convert numbered page directories

Convert one site in a separate, reviewable change before upgrading its engine:

1. Stop that site's preview and commit or back up its source. Record its page
   URLs and sibling order.
2. For each sibling group, put `navigation.order` in each child's frontmatter,
   using 1000, 2000 and 3000 in the old order. Leave the homepage without order.
3. Rename page directories from `NNN-slug` to `slug`, working from descendants
   outward. Keep `content.md`, images, downloads and themes with their page.
4. Update source links and configuration that mention physical paths. Public
   URLs and aliases stay the same. A source-format conversion needs no new aliases.
5. Set `sourceFormat: 2` in `site-config/settings.yaml`, then run `norna check`
   and `norna build` with the new engine. Inspect navigation, URLs and file links.
   Refresh generated output and review the complete diff before committing.

Norna does not convert sites during build or preview. There is no general
conversion command; a small script may help with repetitive edits in your
selected site. Keep an unconverted site on its previous engine. Do not merely
add the format marker while leaving ordering prefixes in place: format 2
interprets the entire directory name as a slug, including an intentional
numeric slug such as `2026-news`.

## Convert root settings to YAML


- Replace executable `site/config.mjs` or Markdown `site/config.md` with
  `site/site-config/settings.yaml`. Re-enter only current fields from
  [Configuration](/reference/configuration/site/); do not translate JavaScript behavior.
- Replace `site/theme.md` with `site/root/tree-theme.yaml`. Start with one complete
  preset, then add only current overrides from [Theme](/reference/configuration/theme/).
- Replace `site/sitewide-content.md` with `site/site-config/shared-content.yaml` when the
  site has a logo display override, banners, or footer content. See
  [Sitewide Content](/reference/configuration/shared-content/).

## Move Content Into Page Directories

- Keep homepage text in `site/root/content.md`. If it is in `site/root/pages/home/`,
  use the [homepage conversion](/reference/site/files/#convert-the-former-homepage-folder).
- Move homepage source images into `site/root/images/`.
- Replace `site/routes/` with `site/root/pages/`.
- In each old route directory, rename `route-content.md` to `content.md`.
- Move each numeric directory prefix into `navigation.order` frontmatter and
  remove the prefix from the directory name. `010-guide/` becomes `guide/`;
  both represent `/guide/` in their respective source formats.
- Put child entries under the nearest parent page's `pages/` directory.
  Every parent uses `content.md`; add `page.listChildren: true` if it should
  append a generated list of its direct children. Home is the front door
  and has its children under `site/root/pages/`.

Every page must contain exactly one H1. H2 headings define sections. Norna now
derives heading ids when they are omitted; keep an explicit `{#stable-id}` only
when a public anchor must survive a heading-text change. Remove old `sections`
frontmatter and page-level presentation settings. Current page frontmatter supports `page.description`, `page.aliases` and
`page.listChildren`, `navigation.order` and `navigation.listed`; presentation belongs in theme files.

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

`site/root/tree-theme.yaml` requires the site's initial preset. Both tree and
page-only themes support the full visual vocabulary. A local file without
preset modifies inherited values; an explicit preset replaces the base.
`tree-theme.yaml` affects a branch, while `page-theme.yaml` affects one page.
See [Theme inheritance](/reference/configuration/theme/#page-themes).

Navigation mode remains technical configuration in site-config/settings.yaml;
it does not belong in a theme file. Convert old theme locations using the
[source-layout reference](/reference/site/files/#convert-the-former-homepage-folder).

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

Remove `readerControls` from `tree-theme.yaml`. Appearance and reading width are
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
