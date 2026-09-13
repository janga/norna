# BL-103: Private Marketing Workspace With Named Norna Sites

## Status And Boundary

**Implemented on 2026-09-12.** The initial reorganization of the private
`marketing/` workspace is complete. The future migration-analysis site remains
conditional on a concrete report and its provenance boundary.

This is private maintainer material. Nothing in this item may make marketing
research, competitor source material, migration trials, or their generated
sites part of the public Norna documentation or npm package.

## Problem

`marketing/` currently contains one broad Norna research site and several kinds
of supporting material. The current `site/` name does not tell a maintainer
which site it represents, and a future migration report would have no clear
place of its own. The directory should become a small local collection of
named Norna sites without losing Git history, source provenance, or the ability
to run the existing evaluations.

## Findings From The Repository

- `marketing/` is a separate Git repository with its own history, a clean
  working tree, and no configured remote. The parent Norna repository ignores
  the directory, so ordinary Norna commits and pushes do not publish it.
- The current `marketing/site/` is one coherent research and product-planning
  site. Its pages cover the Norna baseline, market landscape, migration
  compatibility, feature status, opportunities, and recommendations.
- `marketing/source-material/` is not a site. It is a shared evidence archive
  containing pinned snapshots, dated web captures, navigation evaluations, and
  content-focused migration trials with their own generated Norna sites.
- The migration-trial runner writes each trial's `site/` below its own product
  directory and uses paths relative to the engine repository. Moving the
  research site must not rewrite those trial layouts or make the trials depend
  on the research site's location.
- Marketing's local ignore file correctly excludes generic `dist/`, `.norna/`,
  and Astro cache output. The reorganization must verify these rules after the
  move and must not add a broad rule that hides source material or site files.

## Target Structure

Use a `sites/` directory for browsable Norna sites and retain a sibling
`source-material/` directory for shared evidence and evaluation tooling:

```text
marketing/
|-- README.md
|-- sites/
|   |-- README.md
|   |-- norna-product-research/
|   |   |-- README.md
|   |   |-- config.yaml
|   |   |-- theme.yaml
|   |   |-- sitewide-content.yaml
|   |   |-- pages/
|   |   `-- public/
|   `-- docusaurus-migration-analysis/
|       |-- README.md
|       |-- config.yaml
|       |-- theme.yaml
|       |-- sitewide-content.yaml
|       |-- pages/
|       `-- public/
`-- source-material/
    |-- README.md
    |-- manifest.yaml
    |-- snapshots/
    |-- web-captures/
    |-- navigation-evaluations/
    `-- migration-trials/
```

`norna-product-research/` is the Git-preserving relocation of the current
`site/`. `docusaurus-migration-analysis/` is a reserved, separately named site
for the read-only Docusaurus audit from `BL-052`; create it only when that
report exists or when a concrete analysis needs a separate site. Do not create
an empty placeholder merely to make the tree look complete.

The site directory itself remains the Norna site root. Do not add an extra
`site/` level below each name unless a tool later requires that convention.

## Implemented Actions And Remaining Boundary

1. Confirmed that the nested `marketing/` repository was clean and that its
   current commit is recoverable before any move. Do not stage or overwrite
   unrelated maintainer changes.
2. Created `sites/` and its registry README. The registry records each site's
   name, purpose, audience, status, local start command, and port.
3. Moved the current `marketing/site/` to
   `marketing/sites/norna-product-research/` with `git mv` so its history is
   retained.
4. Added a short README inside the relocated site and updated the root marketing
   README with the new command, for example:

   ```sh
   NORNA_DEV_PORT=4340 node ../bin/norna.mjs \
     --site-dir sites/norna-product-research dev:local --kill
   ```

5. Updated `source-material/README.md` and the source manifest. Verified that
   no research-site instruction refers to the old `../site/` location. Trial-
   local `site/` paths remain relative to the marketing repository root.
6. A named migration-analysis site will be added only when its report has a
   defined source, revision, analysis date, Norna version, and
   license/provenance boundary. Link it from the registry rather than copying
   its pages into the product-research site.
7. Ran ignore, path, validation, and local-start checks. Generated `dist/`,
   `.norna/`, and Astro cache output remain untracked.

## Naming And Navigation Rules

- Directory names are stable machine identifiers: lowercase ASCII with hyphens
  and no dates unless a site is intentionally an immutable snapshot.
- README headings and each site's H1 are human-readable names, for example
  `Norna Product Research` and `Docusaurus Migration Analysis`.
- The registry is the maintainer's overview. A site's Norna navigation explains
  that site's material; do not duplicate the complete registry in every site.
- A migration analysis site describes the source system and the Norna result,
  but it must not be confused with the source product's official site.
- Shared source material stays in `source-material/`. Per-site conclusions may
  link to it, but must not silently copy or modify the archived evidence.

## Commit And Recovery Plan

- Make the relocation in a dedicated commit containing only directory moves,
  README updates, and required path fixes.
- Make creation of a future migration-analysis site a separate commit from the
  structural move.
- After each commit, `git -C marketing status`, `git -C marketing diff --check`,
  and the relevant local build/start command must establish that the site and
  source archive remain usable.
- If a path audit finds an unresolved command or source-provenance issue, stop
  before moving that material and record the issue in the BL rather than
  guessing.

## Acceptance Criteria

- The current research site has a descriptive, stable directory name under
  `marketing/sites/` and retains its content and Git history.
- A maintainer can discover every named site from `marketing/README.md` and
  `marketing/sites/README.md` without inspecting hidden directories.
- The current research site starts with one documented command and retains its
  fixed local port unless a separate site needs another port.
- The future Docusaurus analysis has a distinct site boundary and provenance;
  it is not mixed into the general research site's navigation by accident.
- Existing source snapshots, web captures, navigation evaluations, and
  migration-trial commands remain in their current evidence/tooling boundary.
- No public Norna build, package file, or parent-repository commit discovers or
  publishes the private marketing sites.
- No generated output, dependency tree, nested evaluation repository, or cache
  is added to the source set.
- Re-running the relevant checks after the move produces the same site content,
  local links, and migration-trial paths, apart from the intentional directory
  name change.

## Non-Goals

- Do not split the existing research pages into several sites merely because
  their topics differ.
- Do not move `source-material/` into `sites/`.
- Do not build the Docusaurus audit, add automatic migration writes, or change
  Norna's public site model as part of this workspace reorganization.
- Do not add a marketing remote or publish the nested repository.
