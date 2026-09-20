# BL-138 Root Page And Child Pages

## Purpose

Make the site's file structure express the homepage as its root, with ordinary
child pages beneath it. A future readable editor tree can then follow the
stored hierarchy without a separate, childless homepage construction.

## Decisions Made

On 2026-09-20 the owner selected this root model and requested immediate
implementation. The owner also confirmed that the homepage must retain its
own presentation overrides without changing descendant pages.

```text
site/
  config.yaml
  theme.yaml             shared site appearance
  page-theme.yaml        optional homepage-only presentation overrides
  sitewide-content.yaml
  content.md             homepage
  images/                homepage images
  pages/                 child pages and navigation categories
    010-guide/
      content.md
      theme.yaml         optional overrides for this page and descendants
      images/
      pages/
  public/
```

The homepage keeps the configured public URL. Existing child-page URLs,
navigation ordering, aliases and links keep their meaning. Moving an ordinary
page to the first position does not replace the homepage. The root is not a
movable child page.

## Scope And Boundaries

Update page discovery, CLI creation/moves, themes, image ownership, content
loading, editor recognition, the starter and maintained sites. Provide an
explicit conversion command with a read-only preview and an apply option.
Builds must explain the former layout without moving source files themselves.

This item does not implement BL-133 VS Code Page Files, page drag-and-drop,
homepage replacement or a new hero component. The published navigation and
layout remain unchanged by this source-model change.

## Acceptance Criteria

- The homepage is read from `content.md` in the selected site root; its managed
  images are read from the adjacent `images/` directory.
- `pages/` contains its children. Page creation works from the root and with
  `--parent /`; deeper page/category behavior is preserved.
- Root `theme.yaml` remains the shared theme. Root `page-theme.yaml` accepts
  the limited page-theme schema and affects only the homepage. Descendant
  `theme.yaml` inheritance is unchanged.
- The old `pages/000-home/` layout receives actionable conversion guidance.
  Conversion preserves content, images and homepage overrides; collisions or
  unsupported contents fail before source files change.
- Custom site roots, source links, image generation, aliases, search and the
  sitemap use the new source paths without changing published page URLs.
- VS Code recognizes root content and its local theme. Existing open/create/
  edit-information operations remain usable; the later editor design is not
  preempted.
- The documentation site, maintained fixtures/examples and packaged starter
  use the new model. Canonical reference and contributor guidance agree.

## Verification

Implemented and verified on 2026-09-20. The documentation site, maintained
examples, fixtures and starters now use the root model. The conversion command
is `norna site:upgrade`, with explicit `--apply` for the source moves.

Deterministic tests cover root identity and child URLs, creation at the root,
homepage-only themes versus descendant inheritance, managed root images,
editor recognition, and conversion preserving source bytes. Conversion tests
also cover destination collisions, extra files, symbolic links, stale plans,
custom roots and an already converted site. Invalid homepage theme settings
produce focused build guidance instead of an uncaught parser stack trace.

Checks run:

- Every command in the `npm test` chain passed. The combined run was resumed
  at its stopping points after allowing the local test server and fixing two
  remaining assumptions in the scratch-site and documentation checks; the
  unchanged earlier checks were not repeated.
- `npm run build:pages` passed, including the documentation site and all eight
  public example builds. The combined test chain also includes
  `npm run test:fixture:build`, `npm run test:examples` and
  `npm run package:check`.
- Focused follow-up checks passed after their respective final changes:
  `npm run test:site-upgrade`, `npm run test:page-content`,
  `npm run test:editor-language`, `npm run test:dead-code`,
  `npm run test:documentation` and `npm run test:schemas`.
- The packaged VSIX was installed in the owner's normal VS Code profile.
  Real suggestion-widget selection and saved-file comparisons passed for
  root `content.md`: `image-stack` on a blank line, a filename from root
  `images/`, `image-carousel` from a partial backtick prefix, `card-list` from
  a partial tilde prefix, `page-list` on a blank line, and `NOTE` with edited
  body text. A second dirty save after closing and reopening preserved the
  existing text. Prettier remained active; profile settings were unchanged.
- In root `page-theme.yaml`, the widget offered exactly `images`, `layout`
  and `sections` at the root. Selecting `layout`, completing `textW` to
  `textWidth`, and choosing `wide` produced the expected saved bytes. The
  inspected help text distinguishes homepage-only settings from inherited
  child themes.
- Inspected registered review captures of Getting Started at desktop/light
  and Site files at mobile/dark, including the revised source diagrams.

Verification limits: the complete isolated VS Code widget matrix and minimum
VS Code version were not rerun. The default-profile check does not cover every
callout type, every block/prefix combination, every YAML property/value, or the
tree's creation Quick Pick. Their existing fixtures were updated to the new
paths, and engine-level editor/create tests passed. Separate navigation browser
suites were not repeated because this change preserves rendered navigation
and scroll behavior. No release or deployment was performed.
