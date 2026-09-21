# BL-143: Site Configuration Directory And Page Files

## Purpose

Help authors distinguish the homepage's content and appearance from settings
shared by the complete site, in both the filesystem and the VS Code extension.

**Status: Implemented and verified on 2026-09-21.**

## Decisions Made

The owner approved this physical source layout:

```text
site/
|-- content.md
|-- theme.yaml                  # Optional homepage-only presentation
|-- site-config/
|   |-- settings.yaml           # URL, language and technical settings
|   |-- site-theme.yaml         # Shared visual identity and defaults
|   `-- shared-content.yaml     # Optional shared notices, footer and logo settings
|-- images/
|-- public/
`-- pages/
    `-- 010-guide/
        |-- content.md
        |-- theme.yaml          # Optional presentation inherited by this branch
        `-- pages/
```

- Move root `config.yaml` to `site-config/settings.yaml`, root `theme.yaml`
  to `site-config/site-theme.yaml`, and root `sitewide-content.yaml` to
  `site-config/shared-content.yaml`.
- Rename root `page-theme.yaml` to `theme.yaml`. Preserve homepage-only
  behavior; descendant themes continue inheriting along their own branches.
- Show the actual `content.md` first under each page in Site Tree, followed
  immediately by its optional `theme.yaml`. Categories show `category.yaml`
  first. Show the real `site-config/` directory and its files under the homepage.
- Keep readable page labels, source opening through the page row, and real
  directory ownership. Do not add a virtual grouping that differs from disk.
- Leave `public/` at the site root. Attachment directories and behavior are
  explicitly excluded.

## Scope And Boundaries

Update engine paths, discovery, validation, development watching, starters,
maintained sites, schemas/editor file recognition, Site Tree and reference
documentation together. Keep public URLs, configuration keys, and rendered
presentation unchanged.

Extend `site:upgrade` with a read-only preview and explicit `--apply` conversion.
Support both the immediately previous layout and the older `pages/000-home/`
layout. Refuse conflicting destinations, ambiguous mixtures and symbolic links;
never overwrite or silently migrate sources during a build. Adjust relative
YAML schema directives to preserve their target, retain all other source bytes,
and recover the original layout and bytes if applying a conversion fails.

The VS Code extension must distinguish the new homepage theme from the global
theme and retain compatibility with projects using an earlier engine. Do not
change the user's profile or include unrelated tree error-marker work.

## Verification

- Exercise conversion previews, both old layouts, no homepage override,
  destination conflicts, symbolic links, repeated runs, and interrupted apply.
- Validate custom site roots and CLI invocation from within a site, along with
  startup, watching and builds using the new paths.
- Verify homepage theme isolation and inherited child themes.
- Verify Site Tree order and ownership, source opening, configuration-file
  recognition and updates after external file changes.
- Accept representative settings, global-theme, homepage-theme and shared-content
  suggestions through VS Code's real suggestion widget; assert inserted text
  and reject global-theme suggestions in the homepage theme.
- Convert the local exercise site and inspect the native Site Tree in the
  user's normal VS Code profile. Keep the active-site selection behavior.
- Run packaging, fixture/example and documentation checks covering this source
  format change. Avoid duplicate aggregate and child checks for unchanged code.

## Documentation Plan

The reader needs to find the file for a page's content, that page's appearance,
or a site-wide setting. Introduce those scopes before inheritance exceptions;
show exact paths early. Update source layout, configuration reference, starter
instructions, editor help and the upgrade procedure. Keep the one-page upgrade
flow with explicit conflict handling and verification commands.

## Implementation And Verification Record

The engine, 26 maintained source sites, starters, reference documentation and
VS Code extension now use the agreed paths. The four local review/exercise
sites were converted as well. Extension 0.3.2 was packaged and installed in the
owner's Default profile. Source conversion preserves page URLs, theme scope,
source bytes and relative schema targets; injected filesystem failures verify
rollback, including both themes changing ownership of the root filename.

A broad regression pass was justified because source discovery affects builds,
CLI commands, packaging, images, themes and editor services. The initial
`npm test` run passed its early checks, then exposed an old Astro glob base.
After fixing it, the remaining commands were run sequentially rather than
repeating the complete chain. Old fixture directories and message expectations
were corrected as encountered. Server recovery commands now read recorded
server state without depending on a valid source configuration.

Passed script contracts (each name below is an exact `npm run` script;
interrupted aggregates were completed as explained below):

- `schemas:check`, `test:dead-code`, `test:schemas`, `test:page-model`, `test:site-upgrade`.
- `test:page-markdown`, `test:migration-check`, `test:site-links`, `test:page-aliases`, `test:sitemap`.
- `test:not-found-page`, `test:site-node-commands`, `test:page-move`, `test:navigation-review`, `test:nested-pages`.
- `test:heading-ids`, `test:navigation-model`, `test:project-config`, `test:locales`, `test:edit-source-link`.
- `test:static-search`, `test:editor-language`, `test:content-check`, `test:content-sync-plan`, `test:content-model`.
- `test:theme-presets`, `test:presentation-contract`, `test:presentation-review`, `test:preset-baselines`, `test:documentation-preset-review`.
- `test:site-public`, `test:cli-discovery`, `test:dev-local`, `test:review-environments`, `test:engine-commands`.
- `test:documentation`, `test:ci-lockfile`, `test:banner-visibility`, `test:client-javascript`, `test:browser-test-server`.
- `test:table-sorting`, `test:fixture:build`, `test:examples`, `package:check`.

The `test:page-markdown` and `test:content-model` aggregates were completed
through their child commands after their first failed run. Only the repaired
individual cases were repeated: `invalid homepage overrides` in
`test-page-content.mjs` and `named sidenotes render` in
`test-markdown-constructs.mjs`. The other cases had already passed. The
configuration, theme-presets, dev-local and client-JavaScript retries passed.
Also passed: `npm run config:check`, `npm run content:check`,
`npm run build`, `node scripts/test-editor-site-tree.mjs`, and
`npm --prefix editors/vscode run package`. Schema generation/checking and
`test:documentation` were repeated only for subsequent help-text changes.

### Native VS Code Verification

VS Code 1.138.0, Norna extension 0.3.2, the owner's Default profile, with the
existing Red Hat YAML, Prettier and other extensions/settings preserved:

- Site Tree shows a single "Övningssajten — Homepage" root. Its children start
  with content.md, theme.yaml and the real site-config directory, followed by
  images, public and pages. The three shared configuration files are in the
  agreed order. A screenshot of this native dark view was inspected.
- Both the homepage row and its content.md file open the actual root source.
  All four configuration files open at their correct physical paths and show
  the correct schema. Existing active-site selection survives window reload.
- The real suggestion widget accepted navigation.mode=tree, palette=warm-paper,
  layout.textWidth=narrow and footer.buildInfo=true, each from a blank value and
  a partial prefix (tr, wa, na, tr). All eight cases were saved through VS Code
  and compared against exact expected source text on disk.
- An empty homepage theme offered exactly images, layout and sections. Global
  appearance fields and the whole-site theme template were absent after
  switching from the global theme file. Invalid partial values produced errors
  which cleared after acceptance.
- All four exercise files were restored byte for byte after testing. No user
  profile settings or unrelated documents were edited.

The added isolated `configuration` harness scenario was not run; the eight
cases above were exercised in the requested Default profile instead. This
change does not alter save/formatting behavior or completion vocabulary. The
full construction matrix, minimum VS Code version, separate formatter suite,
and light/compact visual variants were not repeated. Run the compatibility
matrix before distributing the extension. No release, push or Marketplace
publication is included.

The scratch review target responded successfully at
http://127.0.0.1:4399/vscode-test/ with updated checklist IDs VSC-03 and VSC-06.
Port 4321 was already serving the owner’s separate testplan source; it was
left running. The documentation site was verified through its static build.
Syntax checks for the modified editor test harness files also passed.
