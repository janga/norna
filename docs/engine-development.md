# Engine Development

This document is for work on the reusable `norna` package itself.

## Main Areas

- `bin/norna.mjs`: public CLI launcher and local-version resolver.
- `bin/norna-cli.mjs`: public CLI command dispatcher.
- `scripts/lib/site-paths.mjs`: engine/site path resolution.
- `scripts/lib/project-config.mjs`: plain YAML `site/site-config/settings.yaml`
  validation, defaults and derived URL path.
- `scripts/sync-content-sections.mjs`: content validation and sync behavior.
- `scripts/generate-images.mjs`: managed image pipeline and manifest.
- `scripts/sync-site-public.mjs`: static public file sync.
- `scripts/deploy-site.mjs`: deploy and deploy:commit behavior.
- `scripts/watch-pages-deploy.mjs`: GitHub Pages workflow monitor.
- `src/content.config.ts`: Astro content schema.
- `src/components/` and `src/layouts/`: rendered page, navigation, image
  blocks, and layout.
- `tests/`: Playwright navigation diagnostics.
- `fixtures/basic/site/`: minimal site used for engine checks.
- `fixtures/preset-baseline/site/`: shared representative content used to
  compare every built-in preset.
- `fixtures/presentation-review/site/`: broad, non-public visual review site
  for presentation interactions that may later become browser regressions.
- `tests/preset-baselines/`: resolved preset contracts and committed desktop
  and mobile reference images.
- `starters/basic/`: copyable site starter.
- `examples/feature-demos/media-and-surfaces/site/`: broad visual example used
  by demo builds and navigation diagnostics.

The repository-local `site/` directory is reserved for a local documentation
site. It is useful for dogfooding Norna documentation. Preset regression uses
the dedicated preset-baseline fixture so changes to the documentation content
do not silently redefine the visual contract.

## Source And Review Assets

The documentation site uses `site/`. CLI discovery resolves the selected source
through `scripts/lib/site-paths.mjs`, which reads the invocation directory and
environment at module load. Editor and reusable APIs honor their explicit
`siteRoot` so selecting another site does not reuse that process-wide default.
Public sites under `examples/` must be linked from
the documentation's Examples pages. Maintained regression inputs belong under
`fixtures/`. Private research belongs in ignored `marketing/` and its separate
local repository. Use the registered scratch target for disposable physical
copies; do not symlink maintained source into it.

Keep page text, headings, managed image references, alt text and captions in the
owning `content.md`. Keep exactly one H1; prefer derived H2/H3 anchors unless an
explicit ID must preserve a public address. Managed images belong directly in
the owning page's `images/`. After intentionally moving image references,
`npm run content:sync` can move unambiguous images; inspect its source changes.
Do not commit unreferenced source images unless explicitly requested.

Source static files belong in the selected site's `public/`. `.norna/public/`
is generated preparation output, including managed images and the sitemap.
Do not author `public/sitemap.xml`; that path is reserved for the generated
page-tree sitemap. `npm run site:public` refreshes the generated static copy
without a full build.

For user-correctable content/configuration failures encountered in changed code,
replace avoidable parser stack traces with a focused Norna diagnostic and a
regression test. Record concrete unresolved cases in the backlog rather than
creating an open-ended diagnostics task.

## Common Checks

Choose checks for the changed behavior and its consumers. These are alternatives
and complements, not a checklist to run for every change:

| Changed contract | Focused check |
| --- | --- |
| Content validation or synchronization | `npm run test:content-check` |
| Static public-file synchronization | `npm run test:site-public` |
| Contributor documentation, README files or `llms.txt` | `npm run test:documentation` |
| Package/site-root behavior | `npm run test:fixture:build` and, where packaging is affected, `npm run package:check` |
| Runnable examples | `npm run test:examples` |
| Rendered content, layout, configuration or images | `npm run build` |
| Documentation Pages artifact or example deployment paths | `npm run build:pages` |
| Navigation or shared presentation | Relevant registered `review:test` suite |
| Editor APIs or extension behavior | Focused contracts and the changed workflows in the [editor test plan](design/editor-workflow-test-plan.md) |

`npm run build` already validates configuration and content. Use `config:check`
or `content:check` for early, narrow feedback; neither is an obligatory separate
step before that build. `test:editor-language` includes engine language-service
contracts and the extension's check command. Do not rerun covered child commands
on unchanged relevant sources merely to prepare a commit. After a failure,
rerun after a correction or a concrete diagnostic hypothesis, including evidence
of an infrastructure failure.

The **Engine tests** GitHub Actions workflow prepares a patch version and
regenerates schemas inside its temporary checkout, then runs the complete
`npm test` chain and the browser tests for category destinations and URL
aliases. It runs on pull requests and pushes to `main`, and can also be
started manually. Preparing the version catches checks that depend on the
new release's documentation links. The prepared package stays inside the CI
job.

The **Deploy to GitHub Pages** workflow builds the documentation and examples
separately. Check the Engine tests result for the commit being released; the
release command runs the complete chain again with the chosen release version.

Navigation continuity loads `src/lib/navigationContinuity.ts` through an
import string generated by `injectScript` in `astro.config.mjs`, for every
site. Knip cannot follow that generated import, so `knip.json` lists the module
as an explicit entry point. Keep that entry aligned with the integration.

The registered docs suite (`npm run review:test -- docs`) checks area menus,
reading continuity and history state. The navigation suite checks parent pages,
deep trees, responsive placement and outline following. Run separate browser
suites sequentially, or supply distinct Playwright `--output` directories: the
default `test-results/` directory is cleared at the start of each run.

Browser-test servers run without keyboard input in their own process groups.
The test runner stops the entire server group before returning to the terminal,
including when a test fails or is interrupted. `npm run test:browser-test-server`
checks cleanup of nested processes, an already exited launcher, and a server
that ignores termination on macOS and Linux. These checks are part of `npm test`.

`npm run test:examples` builds every complete site and feature demo under
`examples/`. `npm run test` includes those builds in the standard check
sequence. Each build uses that example's own temporary output and site-local
Astro state, so it cannot replace the documentation site's `dist/` or reload
an active documentation dev server.

`npm run test:documentation` checks local Markdown links, rejects obsolete site
paths and filenames in documentation and examples, and verifies that every
Markdown source linked from `llms.txt` exists.

`npm run build:pages` is specific to this repository. It builds the
documentation site and assembles rendered examples under `dist/examples/` for
the shared GitHub Pages artifact. It is not a generic Norna site command.

`npm run test:preset-baselines` builds the same representative site with every
built-in preset and verifies characterized values and rendered markup. The
committed screenshots are human-review references rather than pixel-perfect
test assertions. Use `npm run preset:documentation:review` for an interactive
local comparison of the `documentation` preset candidates. Use
`npm run palette:review` to render every built-in palette against the same
representative content and switch between them in one browser view. The
corresponding `*:build` commands create the review output without starting a
server. Capture new baseline images only after the intended visual change has
been reviewed:

```sh
npm run preset:baselines:capture
```

Use the named review environments for maintained manual previews. Each target
has one source directory and one fixed local URL:

| Target | Purpose | URL |
| --- | --- | --- |
| `docs` | Documentation site | `http://127.0.0.1:4321/norna/` |
| `presentation` | Presentation review path | `http://127.0.0.1:4322/` |
| `navigation` | Nested-navigation fixture | `http://127.0.0.1:4323/` |
| `presets` | Preset baseline fixture | `http://127.0.0.1:4324/` |
| `scratch` | Disposable copied site | Port `4399`, using the copied site's base path |

Start and manage a target through the same command family:

```sh
npm run review:start -- docs
npm run review:status -- docs
npm run review:logs -- docs
npm run review:stop -- docs
```

Manual review servers never choose a fallback port and never terminate an
unrelated process occupying their port. Use the low-level development commands
only for a site that is not in the registry.

After starting a target, capture a repeatable viewport image through the same
registry:

```sh
npm run review:capture -- docs getting-started/ --viewport compact --appearance light
```

The available named viewports are `desktop`, `compact`, and `mobile`. A bounded
custom value such as `1024x900` is also accepted. Add `--full-page` only when
the complete document, rather than the visible viewport, is the subject of the
review. Captures are written beneath `.local/review-captures/`; the command does
not accept external URLs or caller-selected output paths.

Keep server lifecycle and browser capture separate. If the target is stopped,
`review:capture` prints the exact `review:start` command instead of starting a
new server or selecting another port.

Inside the engine repository, use npm scripts or explicitly run
`node bin/norna.mjs ...`. Do not rely on a bare `norna ...` command there: a
globally installed launcher deliberately does not delegate to another package
whose own name is `@janga/norna`, so it may continue with the published global
implementation instead of the working tree.

The presentation target combines the visual cases that regularly need manual
review. It uses the non-public `fixtures/presentation-review/site/` fixture:

```sh
npm run review:start -- presentation
```

The separate media-and-surfaces demo remains part of the example build:

```sh
npm run demo:build
```

The demo build is written to `examples/feature-demos/media-and-surfaces/dist/`,
not to the engine repository's root `dist/`.

Registered browser regressions use an internally allocated temporary port, so
they can run concurrently without changing the fixed manual-review URLs:

```sh
npm run review:test -- navigation
npm run review:test -- presets
```

Run both registered suites concurrently when changing the review infrastructure
itself:

```sh
npm run test:review-environments:browser
```

The remaining specialized navigation diagnostics keep their existing commands:

```sh
npm run test:navigation
npm run test:navigation:stress
npm run test:navigation:preview
```

If Chromium is missing:

```sh
npx playwright install chromium
```

## Temporary Review Sites

Prepare a disposable copy when a site is needed for one investigation but does
not belong in the maintained registry:

```sh
npm run review:scratch -- prepare --from path/to/site
npm run review:start -- scratch
```

The helper validates the source, excludes generated and dependency directories,
and writes a physical copy to `.local/test-sites/scratch/site/`. It refuses to
replace existing scratch work unless `--replace` is explicit:

```sh
npm run review:scratch -- prepare --from path/to/site --replace
```

Inspect or remove the local copy with:

```sh
npm run review:scratch -- status
npm run review:scratch -- clean
```

The `.local/` directory is ignored by Git and excluded from packages. Do not
make the runnable scratch site a direct symlink to maintained source: generated
state and test edits could otherwise be written back through the link.

## Package Check

`npm run package:check` packs this repository, extracts the package, copies the
packaged starter into a temporary site project, installs dependencies, runs
`norna doctor` from a site subdirectory, runs config/content checks,
builds the installed site, and verifies selected rendered output and validation
failures.

It needs network access when npm dependencies are not already cached.
The check uses a reusable npm cache at
`node_modules/.cache/norna-package-check-npm` and runs npm with
`--prefer-offline` so repeat runs do not redownload dependencies. Set
`NORNA_PACKAGE_CHECK_CACHE=/path/to/cache` to use another cache.

## CI Lockfiles

Site repositories are developed on different operating systems but deployed on
GitHub Actions Linux. `engine:update` therefore normalizes `package-lock.json`
with npm 11.16.0 for Linux x64 glibc and verifies a clean install before it runs
the site checks. The starter workflow pins Node 24.18.0, which provides the
same npm version.

`npm run test:ci-lockfile` recreates and repairs the optional npm peer-dependency
case that previously caused GitHub Actions `npm ci` failures.

## Test The Package In A Site Repository

> **Warning:** `npm link` is not supported for `norna`. Astro resolves
> renderer modules and runtime dependencies differently when the package is a
> symlink, so a linked site can fail to start even though the published package
> works. Do not use `npm link @janga/norna` to test a site.

Use `npm run package:check` to test the package before release. To test a
specific published engine version in a real site, update it with:

```sh
npm run norna:engine:update -- <version>
```

Commit the resulting `package.json` and `package-lock.json` changes in the
site repository after the site's normal checks pass.

The installed `norna` command is created from the package `bin` field. The
launcher first looks for the nearest project `package.json`. If that project
declares `@janga/norna` and Node can resolve an installed copy from that project
root, the launcher delegates to that local entrypoint. The engine repository
itself is excluded from delegation to prevent recursion; its working tree is
selected explicitly through npm scripts or `node bin/norna.mjs`.

## npm Release

The npm package is published as `@janga/norna`. Use the release scripts for the
complete release; do not run `npm version` or `npm publish` separately during a
normal release.

### 1. Choose The Version Change

| Command | Use when |
| --- | --- |
| `npm run release:patch` | The release contains backwards-compatible fixes or maintenance changes. |
| `npm run release:minor` | The release adds backwards-compatible functionality. |
| `npm run release:major` | The release contains an incompatible product change. |

### 2. Check The Starting State

The release command requires a clean Git working tree. Before starting:

```sh
git status --short
```

Commit or remove every listed change. The command also checks npm
authentication against the same registry and cache used for publication. If
that preflight fails, run the exact login command printed by the script and
start the release again. No version file, commit, or tag has changed at this
point.

### 3. Run One Release Command

For example, to release a patch:

```sh
npm run release:patch
```

The command performs these steps in order:

1. Updates `package.json` and `package-lock.json` without creating a commit.
2. Regenerates schemas whose documentation links contain the new `v<version>`
   Git tag.
3. Runs the complete `npm test` release chain.
4. Verifies that checks changed only `package.json`, `package-lock.json`, and
   generated schemas.
5. Creates commit `Release v<version>` and annotated tag `v<version>`.
6. Publishes the public package to npm.
7. Pushes the release commit and tag.

If npm reports that the package is being processed, it has accepted the publish
request but the version may take a few minutes to become available. The final
`Released` message confirms that the publish command and Git push completed;
it does not check npm availability. Query the exact version before installing
it in a site:

```sh
npm view @janga/norna@<version> version gitHead --registry=https://registry.npmjs.org/
```

GitHub Pages deployment monitoring is deliberately separate from the npm
release.

### 4. Recover At The Reported Boundary

**Failure before the release commit:** the script restores the previous package
version, lockfile, and generated schemas automatically. Correct the reported
problem, confirm that `git status --short` is clean, and run the chosen release
command again.

**Release commit and tag remain locally, but npm publication failed:** publish
the source at that tag. The current branch may already contain later changes;
publishing its directory would give the retained version different contents
from its tag. First inspect the tag and query that exact npm version.

For example, to recover a prepared `v0.7.26` release:

```sh
git show --stat v0.7.26
npm view @janga/norna@0.7.26 version --registry=https://registry.npmjs.org/
```

An npm `E404` means that this version is not available from the registry at the
time of the query. If npm already accepted the publish request for processing,
wait and query the same version again; do not publish again or prepare another
release to bypass that wait. An authentication or network error does not tell
you whether the version exists. If the version is available, verify it and
continue with the Git push; npm versions cannot be overwritten.

After correcting the reported authentication, permission or registry problem,
clone the retained tag from this repository into a separate directory. Git
checks out the tag without creating a branch. The current checkout and its
uncommitted files stay in place:

```sh
git clone --branch v0.7.26 --single-branch . ../norna-release-0.7.26
cd ../norna-release-0.7.26
git status --short
npm whoami --registry=https://registry.npmjs.org/ --cache /private/tmp/norna-npm-cache
npm run release:publish
npm view @janga/norna@0.7.26 version dist.integrity gitHead --registry=https://registry.npmjs.org/
cd -
git push origin refs/tags/v0.7.26
```

Use the version being recovered in place of `0.7.26`. Publish only when the
release copy is clean and its HEAD is the inspected release commit. Check
that npm reports the intended version and commit before pushing. This explicit
tag push transfers the release commit and tag without advancing the remote
main branch. Push main separately when its pending commits are ready.

If `npm whoami` reports an authentication error, renew the login with
`npm login --registry=https://registry.npmjs.org/ --auth-type=web --cache /private/tmp/norna-npm-cache`
and retry publication from the same release copy. Authentication confirms
the account; the publish command can still require its own authentication step.

Do not run `release:patch`, `release:minor`, or `release:major` again merely to
retry these two steps; that would prepare a different version.

**Release commit exists but tag creation failed:** read the version from
the release commit's `package.json`, create the matching annotated tag at that
commit, then use the separate-copy recovery above:

```sh
git tag -a v<version> <release-commit> -m "Release v<version>"
```

**npm publication succeeded but Git push failed:** do not publish again. Verify
the published version with `npm view @janga/norna@<version> version gitHead`,
then push the retained tag from the original repository with
`git push origin refs/tags/v<version>`. Push main separately when its pending
commits are ready.

If it is unclear whether npm accepted a publish request, check the exact version
with `npm view` before choosing between publication and push recovery.

### 5. Verify A Real Site

After publication, update one real site repository to the exact released
version, commit its `package.json` and `package-lock.json`, and run that site's
normal checks and build. Record any friction in the release backlog before the
next engine release.

## VS Code Extension Release

The VS Code extension has its own version in `editors/vscode/package.json`.
Engine and extension releases are independent because the extension selects
and checks the editor API supplied by each project's installed Norna engine.

The optional site-tree capability is exported from
`scripts/lib/editor-site-tree.mjs` with `siteTreeApiVersion: 1`. The extension
loads it from the selected project's engine; an absent or unsupported capability
disables that site's tree actions without replacing its existing language API.
Keep this dynamic entry in `knip.json`. Structure reads accept an explicit site
root and an editor-only tolerant mode; CLI validation and mutation plans remain
strict. `scripts/lib/site-node-create.mjs` owns creation for both the CLI and
editor. Metadata edits return source ranges for the editor buffer and do not
write files or trigger saves.

`readSiteFileTree` uses one physical projection in
`scripts/lib/editor-site-editing-tree.mjs`, including incomplete and damaged
entries. There is no separate non-editing traversal. The extension still sends
the earlier `editing` capability flag to engines that need it. Theme hover and
removal help use the shared theme resolver with dirty-source overlays; keep
inheritance rules in that resolver, not in the extension.

Extension 0.5.0 also negotiates `siteRemovalApiVersion: 1` and
`siteAddressApiVersion: 1` through that entry. `editor-site-links.mjs` overlays
dirty documents on the shared link graph and records incomplete reads.
Removal plans exclude links wholly inside a deleted branch. Address changes
reuse `page-move-plan.mjs` and `page-move-apply.mjs`; the extension supplies a
VS Code directory-rename callback so open editors follow the move. Alias edits
remain source ranges in the editor buffer. Keep these file/link operations
separate from completion-provider tests.

The context-menu model negotiates `siteResourceActionsApiVersion: 1`. Physical
rows expose supported action names and missing singleton source files; the
extension maps these capabilities to one native menu hierarchy. Future
page-owned resources can add actions without pretending to be images.
`editor-resource-actions.mjs` plans public-file creation, managed-image/public
rename and move, optional-folder removal and resource references. It uses the
shared link graph, source/removal policies and the build's reserved public
paths. Plans honor explicit `siteRoot` and dirty-source overlays.

Resource rename preflights the source, destination and references. The adapter
renames through a VS Code resource edit and applies page changes as a separate,
all-or-nothing text edit. Those page buffers stay dirty. If text editing fails,
the adapter restores the old resource path or names the recovery paths.
Do not describe editor Undo as reversing the whole filesystem operation.
Folder removal composes constituent removal policies and uses Trash. Public
replacement stages the new bytes before moving the original to Trash.

Run `scripts/test-editor-resource-actions.mjs` for engine rules and
`editors/vscode/test/site-resource-actions-contract.mjs` for cancellation,
dirty buffers, stale plans and injected application/recovery failures. Native
menu, keyboard, Undo and save/reopen review remains a separate acceptance step.

### Attachments And Local Preview

The attachment capability is `siteAttachmentsApiVersion: 1`. The shared link
graph resolves page-owned downloads before rendering; the build copies bytes
unchanged and page moves update known references. `editor-attachments.mjs`
plans copies and guarded source insertions, while the extension owns the form,
Trash operations and dirty-buffer text edits. Run the attachment engine/adapter
checks for those boundaries; `test:attachment-form` in the extension checks the
actual webview HTML's focus and ordering without starting a site server.

Local preview negotiates `sitePreviewApiVersion: 1`. `editor-site-preview.mjs`
serializes requests by canonical site root and uses registered review commands
where applicable. Other sites use the selected engine's background dev manager.
The dev-only, loopback-only `/.well-known/norna-dev` endpoint supplies a fresh
startup token, PID and canonical site root. Do not substitute an HTTP 200 or a
matching port for ownership verification. Page readiness is a separate request:
an identity-verified server can still return a rendering error.

The manager records ownership before probing pages and verifies its startup
token before cleaning a failed start. The extension never passes `--kill` or
silently restarts an existing server. State and logs remain under the selected
site's `.norna/`; inherited internal state-directory settings are stripped.
`npm run test:editor-preview` covers lifecycle, collision, cancellation,
failed-render cleanup and the extension's save/browser contracts. It is included
in `test:dev-local`; do not run it again after a passing aggregate on unchanged
source. Native Default-profile menu/browser and reload checks remain separate.

### First Marketplace Release

The publisher ID in the extension manifest is `janga`. Before the first public
release, create or obtain access to that publisher in the Visual Studio
Marketplace. Follow the current
[official authentication and publisher instructions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension);
do not store Marketplace credentials in the repository.

The first public release is also a product checkpoint. Confirm the publisher
identity, extension name, icon, description, license, and support links in the
Marketplace preview before making it public.

### Prepare A Version

Start from a clean working tree. Update the extension version and its lockfile
without creating an npm tag or commit:

```sh
npm --prefix editors/vscode version patch --no-git-tag-version
```

Use `minor` or `major` instead of `patch` when the extension's own compatibility
or behavior requires it. Then run:

```sh
npm run test:editor-language
npm run test:editor-integration:minimum
npm run test:editor-integration
npm --prefix editors/vscode run audit:runtime
npm --prefix editors/vscode run package
```

These checks inspect the shipped VSIX, install it together with Red Hat YAML in
isolated VS Code instances, and exercise both VS Code 1.96 and the current
stable release. Inspect `editors/vscode/norna-vscode.vsix` through VS Code's
**Install from VSIX...** command before the first public release.

Commit the extension version and related changes. Use an extension-specific tag
so it cannot be confused with an engine npm release:

```sh
git tag -a vscode-v<version> -m "VS Code extension v<version>"
```

### Publish And Verify

After authenticating according to the current Marketplace instructions,
publish the committed version:

```sh
npm --prefix editors/vscode run publish:marketplace
git push --follow-tags
```

Do not bump the version again merely because the Git push failed after a
successful Marketplace publication. Retry the push. If publication fails,
correct the reported problem and retry the same unpublished extension version.

Finally, install **Norna** from a clean VS Code profile, open a site using a
published `@janga/norna` version, and verify the status item, YAML suggestions,
Markdown suggestions, Problems diagnostics, and versioned documentation links.

## Rendering Notes

The renderer discovers a required homepage at
`site/root/content.md` and its child entries under `site/root/pages/`. Deeper entries
live under each parent page's `pages/` directory. Every entry has `content.md`
and a routable URL. A parent with `page.listChildren: true` appends a generated
list of its direct listed children after all authored content.

Automatic navigation selects section navigation for one-page sites, top
navigation for flat multi-page sites, and tree navigation when a listed child
page exists. Explicit modes must be compatible with the listed
hierarchy. Root children remain top-level navigation choices; the homepage
retains the global navigation presentation. The internal root page-directory
identity is `.`, with depth zero and entry suffix `root`; child identities
remain relative to `site/root/pages/`. Navigation's `parentPagePath: null` projects
root children onto the top level.

Required `root/tree-theme.yaml` includes an explicit preset. Optional
`page-theme.yaml` applies only to its own page, including the homepage. Both
theme types accept all visual fields. Descendant `tree-theme.yaml` files
inherit along their ordinary page ancestry. Without `preset`, a file changes
individual inherited fields; an explicit `preset` replaces the base even when
its name matches the ancestor. Page-only settings never reach children.
Shared technical files and `public/` remain
beside `root/`, not inside it. `norna site:upgrade` validates this layout and
rejects former locations with manual conversion instructions; neither it nor
`--apply` moves sources. Builds never perform source conversion. Use
`scripts/lib/site-conventions.mjs` for physical root-page and child paths;
reusable editor APIs must calculate them from their explicit `siteRoot`.

In the editing tree, site resources use `siteRoot` as their `ownerId`; page
resources use the owning `content.md` path. The site context is not a visible
row. Creation and optional-file removal for site resources must work without a
readable homepage. File-removal calls use the site root as `sourcePath` for
site-owned files. Keep unattached structural/read errors in `snapshot.problems`
and preserve their actual paths when publishing editor diagnostics.


Tree navigation uses the shared area resolver in `src/lib/areaNavigation.ts`:

- Global menus separate parents with descendants from direct page choices.
  Flat collections stay together; a mixed collection selects a child branch
  as its local area. An authored root's own page and collections beyond the
  twelve-choice menu limit retain the full tree.
- The left tree combines pages with H2 links. H3 anchors remain in the document;
  there is no separate right contents rail. The same destinations remain in
  compact navigation. Page text opens its own URL, while a separate chevron
  toggles the branch.
- Reading pages place the area-menu control beside sticky breadcrumbs, with
  Home, Search and Display above the left menu. Home keeps global navigation.
  The filter matches navigation labels, independently of full-text Search.

Page descriptions from frontmatter appear in menus and generated child lists.
Built-in language packs provide only engine UI labels.

The parser-time navigation state and the continuity runtime prepare fresh
arrivals and restore per-entry tree and reading positions. New page choices
open the current outline; Back/Forward and reload preserve deliberate closures.
Real links, native disclosures and browser history remain the foundation.
Scripts add intent prefetch and supported native view transitions without
requiring a client-side router. No prototype environment switch is needed.

The sticky navigation measures the header and sets root `scroll-padding-top`.
Avoid section-level `scroll-margin-top` unless deliberately testing the combined
anchor offsets.
Norna coordinates initial hash placement with fonts and saved history, leaving
a reader's intervening interaction alone. Same-page anchors use browser
scrolling and the configured `scrollBehavior`; reduced motion still applies.

The shared layout selects Norna's built-in UI labels from the optional
`language` in `site/site-config/settings.yaml`. Keep editorial content in page Markdown and
non-editorial engine UI labels in the engine language packs.

Deploy monitoring belongs to site repositories. Do not run `npm run deploy:watch`
in this engine repository unless the owner explicitly requests it.
