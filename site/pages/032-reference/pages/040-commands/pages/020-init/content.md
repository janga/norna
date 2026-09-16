---
page:
  description: Know what init creates in standalone and embedded projects and which existing files it refuses to replace.
---

# Project creation

`init` copies Norna's starter sources. It does not install dependencies, create
a Git repository or publish a site.

```sh
npx @janga/norna@latest init my-site
```

Run `npm install` inside the resulting project before using its scripts.
The [installation tutorial](/getting-started/install-norna/) walks through a
first edit and preview.

## Options

```text
norna init <target-dir> [--type standalone|embedded] [--site-dir <path>]
```

| Argument | Meaning | Default |
| --- | --- | --- |
| `<target-dir>` | Project path relative to the invocation directory, or an absolute path | Required |
| `--type` | Create a complete project or add a site to an existing project | `standalone` |
| `--site-dir` | Source path inside the target project | `site`, or `NORNA_SITE_DIR` |

The source path must be nonempty and relative, without `..` components.
Both `--name value` and `--name=value` forms are accepted for these options.

## Standalone project

The target must be absent or empty. Norna creates starter source, package
files, ignore rules and `.github/workflows/deploy.yml`. It pins its own running
version as the new `@janga/norna` dependency and supplies the `norna:*` scripts
plus `dev` and `build` aliases.

If the target already has `package.json`, use embedded initialization rather
than trying to replace that project.

## Embedded site

```sh
npx @janga/norna@latest init . --type embedded --site-dir presentation
```

The target must already contain `package.json`; the chosen source directory
must be absent or empty. Norna adds the starter site, a site-local `.gitignore`
and namespaced npm scripts. It adds a Norna dependency when one is not already
declared in `dependencies`. It refuses to overwrite a conflicting npm script.

Existing `dev`, `build` and deployment arrangements stay owned by the project.
No standalone Pages workflow is added. Run `npm install` to update the
installation and lockfile, then use the generated `norna:*` scripts, which
include the selected source path.

See [embedded publishing](/reference/workflows/embedded-publishing/) when the
site and another static build must share one deployment artifact.

Initialization writes several files; it is not a multi-file transaction. If
an I/O failure interrupts it, inspect the reported target before retrying.
