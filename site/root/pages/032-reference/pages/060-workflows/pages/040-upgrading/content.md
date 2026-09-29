---
page:
  description: Preserve a working baseline while updating the engine, source format and lockfile together.
---

# Upgrade a site

Norna is pre-1.0: an engine update may require source changes. Keep a working
Git baseline so you can review or restore the source and dependency together.

## Establish the baseline

Commit current content, configuration, source images, package/lock files and
`.norna/generated-images.json`. Confirm that the installed version builds, or
record any existing failure before updating. Read the release changes for the
version you intend to install; a current website may describe newer behavior
than your pinned package.

```sh
npm run norna:engine:version
npm run norna:build
```

## Update and review

For a site already using the current source model:

```sh
npm run norna:engine:update -- latest
```

You may give an exact version instead of `latest`. The command installs an
exact dependency, updates and verifies the lockfile, and checks/builds with
the newly installed engine. It does not automatically restore the previous
installation after a failure. See [engine maintenance](/reference/commands/engine/)
for options and side effects.

Correct reported source problems, then inspect Home, nested pages, navigation
at desktop and mobile widths, images, banners, footer and local themes. Review
and commit the source and lockfile changes together before publishing.

## Older source models

For substantially older sites, initialize a temporary current project and use
its structure as the comparison point:

```sh
npx @janga/norna@latest init norna-current
```

Install its dependencies, then transfer editorial content, images, public
files and relevant settings. Re-enter settings using current reference rather
than copying obsolete executable configuration. Validate and preview the new
copy before replacing the working site.

[Legacy source conversion](/reference/workflows/legacy-source/) identifies
earlier filenames and terms that no longer work. The current
[site file model](/reference/site/files/) remains the authoritative destination;
Norna does not supply compatibility layers for every removed format.
