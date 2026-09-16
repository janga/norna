---
page:
  description: Inspect the selected installation and paths, or update the exact project dependency and lockfile.
---

# Engine maintenance

Use `engine:version` to distinguish the engine actually running from the
version requested by a project or currently published on npm:

```sh
npm exec -- norna engine:version
npm exec -- norna engine:version --latest
```

The command reports engine/Astro installation details. `--latest` additionally
queries npm; it does not install the result. A local version declaration alone
does not prove that version has been published.

## Update a site

```sh
npm exec -- norna engine:update latest
```

`engine:update [version|latest] [--skip-checks]` defaults to `latest`. It requires
a site project's `package.json` declaring `@janga/norna` and refuses to run
against the engine repository itself.

It installs the requested package with an exact dependency version, updates
the lockfile, normalizes the lockfile for the GitHub Actions Linux npm
environment and verifies a clean CI installation. It then runs the newly
installed engine's configuration check, content check and build.

`--skip-checks` skips those three site checks; lockfile normalization and CI
verification still run. Package files and the installation have already
changed if a later check fails. There is no automatic rollback. Keep a Git
baseline and review package, lockfile and generated-manifest changes together;
the [upgrade workflow](/reference/workflows/upgrading/) covers that task.

The npm cache defaults to `node_modules/.cache/norna-npm` in the project.
An explicit `npm_config_cache` or `NPM_CONFIG_CACHE` overrides it.

## Inspect resolved paths

```sh
npm exec -- norna doctor
```

`doctor` prints invocation, project and engine roots; selected site, page,
config, theme, image and public paths; generated image manifest; and Astro
public, build and cache paths. It does not install or repair anything, and
successful path reporting is not a substitute for `check`.
