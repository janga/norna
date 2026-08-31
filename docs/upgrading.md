# Upgrading A Site

Norna is pre-1.0 and does not preserve every earlier source format. Upgrade the
engine and site files together, keep the lockfile versioned, and validate the
complete site before publishing.

## Before Changing The Site

1. Commit the working site, including `package.json`, `package-lock.json`, page
   content, source images, and `site/.norna/generated-images.json`.
2. Confirm that the current version still builds, or record the existing error
   before changing files.
3. Read the release notes and this checklist before installing the new engine.

A committed starting point makes source changes reviewable and lets Git restore
the previous engine and file model together.

## Safest Pre-1.0 Migration

For a site using an older file model, create a temporary current site and use
its structure and scripts as the reference:

```sh
npx @janga/norna@latest init norna-current
cd norna-current
npm install
npm run norna:check
```

Move the existing editorial content, source images, public files, and relevant
settings into the generated model. Do not copy old configuration syntax into
the new YAML files. Compare each result with [Site Files](site-files.md), then
replace the old project only after the new copy checks and builds.

This route is usually clearer than preserving a sequence of obsolete formats.
Norna does not provide a compatibility layer for removed source files.

## Current Source Layout

The current minimum is:

```text
site/
|-- config.yaml
|-- theme.yaml
|-- pages/
|   `-- 000-home/
|       |-- content.md
|       `-- images/
|-- public/
`-- sitewide-content.yaml  # optional
```

Check an in-place migration against the following changes.

### Convert Root Settings To YAML

- Replace executable `site/config.mjs` or Markdown `site/config.md` with
  `site/config.yaml`. Re-enter only current fields from
  [Configuration](configuration.md); do not translate JavaScript behavior.
- Replace `site/theme.md` with `site/theme.yaml`. Start with one complete
  preset, then add only current overrides from [Theme](theme.md).
- Replace `site/sitewide-content.md` with `site/sitewide-content.yaml` when the
  site has a logo display override, banners, or footer content. See
  [Sitewide Content](sitewide-content.md).

### Move Content Into Page Directories

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
frontmatter and page-level presentation settings. Current page frontmatter may
contain only `page.description` and `navigation.listed`.

### Move Page Presentation Into Theme Files

The root `site/theme.yaml` owns preset, color modes, palette, corners,
typography, page frame, navigation presentation, and structured content-block
defaults. A limited `theme.yaml` in a page or category directory may contain
only the layout, image, and section-background fields documented under
[Page Themes](theme.md#page-themes). Descendants inherit those values.

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
| `readerControls.appearance` | `readerControls.colorMode` |
| `sections.backgroundPattern: cycling` | `sections.backgroundPattern: accented` |

`cool-green` was removed when the built-in palettes were expanded. Use
`arctic-blue` as its closest supported replacement, then review the result in
both light and dark mode.

Remove `readerControls.readingWidth` from `theme.yaml`. Reading width is now an
engine-level reader choice that is always available; `layout.textWidth` still
selects the initial Narrow, Standard, or Wide value.

### Update Project Scripts And Ignores

Compare `package.json`, `.gitignore`, and `site/.gitignore` with a newly
generated site. Keep the exact `@janga/norna` dependency and regenerated
`package-lock.json` committed.

Generated paths should be ignored:

```text
dist/
.astro/
site/.norna/.astro/
site/.norna/public/
```

Keep `site/.norna/generated-images.json` versioned because it records reusable
managed-image output. See [Generated Files](site-files.md#generated-files) for
the current boundary.

## Validate The Migration

Install the selected version and run the current project commands:

```sh
npm install
npm run norna:config:check
npm run norna:content:check
npm run norna:build
```

Then inspect Home, top-level pages, nested pages, navigation at desktop and
mobile widths, managed images, banners, footer, and any page-local themes. Run
`npm run norna:sync` only after reviewing its proposed image moves.

Commit the migrated source and lockfile together. Publish only after the build
passes and the generated site has been inspected.

## Routine Engine Updates

Once a site already uses the current model, update its exact engine version
with:

```sh
npm run norna:engine:update -- latest
```

The command updates the dependency and lockfile, checks the lockfile against
the CI environment, and runs the site checks and build. Review and commit those
changes together. See [Commands](commands.md#command-summary) for options and
the exact behavior.
