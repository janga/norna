---
page:
  description:
    Answers to common questions about setting up and maintaining a Norna site.
---

# FAQ

## How do standalone and embedded projects differ? {#add-norna-to-an-existing-project}

Use a standalone project when the website is the repository's main purpose.
Use an embedded project when the Norna site should live beside an existing
application, library, or CLI. Both models install Norna locally and use the
same site files; they differ in which project owns the top-level commands.

### Standalone project

The normal initialization command creates a new project directory:

```sh
npx @janga/norna@latest init my-site
```

After `npm install`, the relevant structure is:

```text
my-site/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── package.json
├── package-lock.json
└── site/
    ├── config.yaml
    ├── theme.yaml
    ├── sitewide-content.yaml
    ├── pages/
    │   └── 000-home/
    │       ├── content.md
    │       └── images/
    └── public/
```

Because this repository is only a Norna site, `package.json` may provide short
aliases as well as the namespaced scripts:

```json
{
  "scripts": {
    "dev": "npm run norna:dev --",
    "norna:dev": "norna dev:local",
    "norna:check": "norna check",
    "norna:build": "norna build",
    "build": "npm run norna:build"
  }
}
```

### Embedded project

Run embedded initialization from an existing project root:

```sh
npx @janga/norna@latest init . --type embedded --site-dir presentation
npm install
npm run norna:dev
```

The arguments differ from the standalone setup for specific reasons:

- `.` tells Norna to update the current project instead of creating a new
  project directory.
- `--type embedded` preserves the surrounding project's role and scripts.
- `--site-dir presentation` places the site source in `presentation/` instead of
  the default `site/` directory.

The existing project keeps its source, scripts, and directory structure:

```text
existing-project/
├── package.json
├── package-lock.json
├── src/
└── presentation/
    ├── config.yaml
    ├── theme.yaml
    ├── sitewide-content.yaml
    ├── pages/
    │   └── 000-home/
    │       ├── content.md
    │       └── images/
    └── public/
```

Norna preserves existing commands such as the surrounding project's `build`
and adds namespaced scripts that select `presentation/` explicitly:

```json
{
  "scripts": {
    "build": "node build-app.mjs",
    "norna:dev": "norna --site-dir presentation dev:local",
    "norna:check": "norna --site-dir presentation check",
    "norna:build": "norna --site-dir presentation build"
  }
}
```

Norna also adds `@janga/norna` as a project dependency. It refuses to overwrite
conflicting scripts or a non-empty target site directory.

The surrounding project keeps its own `build`, `test` and deployment commands.
Use the namespaced commands for its Norna site:

```sh
npm run norna:check
npm run norna:build
```

See the full references for
[commands](https://github.com/janga/norna/blob/main/docs/commands.md) and
[site files](https://github.com/janga/norna/blob/main/docs/site-files.md).

## Why does npm say package.json is missing? {#initialize-before-install}

`npm install` needs an existing Node project with `package.json`. For a new
standalone site, run initialization from the directory that should contain the
new project, then enter the created directory before installing:

```sh
npx @janga/norna@latest init my-site
cd my-site
npm install
```

If the site belongs inside an existing Node project, initialize it in embedded
mode before running `npm install`. Do not create an empty `package.json` merely
to silence the error; let Norna create a standalone project or update the real
existing project.

## How do I correct YAML or frontmatter indentation? {#yaml-indentation}

YAML uses spaces to express structure. Use two ordinary spaces for each nested
level, never tabs or non-breaking spaces:

```yaml
page:
  description: A short page description.
```

Run the complete check after editing `config.yaml`, `theme.yaml`,
`sitewide-content.yaml`, or Markdown frontmatter:

```sh
npm run norna:check
```

Norna reports the file and line, explains the detected indentation pattern,
and usually describes the expected sibling or parent level. Correct the source
instead of changing generated files. See [Content validation](https://github.com/janga/norna/blob/main/docs/content.md#validation-and-sync)
for allowed frontmatter and the focused content check.

## How do I refresh a stale local preview? {#stale-preview}

First save the source file and check that the tracked server is still running:

```sh
npm run norna:dev:status
```

If content or generated images still look stale, run the complete local rebuild:

```sh
npm run norna:build:local
```

This checks and builds the site, then restarts its development server. Use
`npm run norna:dev:logs` when the restart reports an error. The
[local-development reference](https://github.com/janga/norna/blob/main/docs/local-development.md)
documents server status, logs, LAN testing, and cleanup.

## What do missing, misplaced, and unreferenced image reports mean? {#image-reports}

- **Missing** means a Norna image block names a file that cannot be found in
  the current page's `images/` directory or elsewhere as an unambiguous move.
- **Misplaced** means the named file exists, but another page currently owns
  its physical location.
- **Unreferenced** means an image file is present in a page's `images/`
  directory but no Norna image block on that page uses it.

Inspect all reports without changing files:

```sh
npm run norna:content:check
```

After confirming that a Markdown reference intentionally moved between pages,
apply an unambiguous relocation with `npm run norna:sync`. Sync reports its
plan and refuses to guess between duplicate filenames. It does not delete an
unreferenced image. See [Images and metadata](https://github.com/janga/norna/blob/main/docs/images-and-metadata.md)
for placement and processing rules.

## Why does npm authentication fail while publishing Norna? {#npm-publish-authentication}

Publishing an ordinary Norna site to GitHub Pages does not run `npm publish`
and does not require npm publishing permission. It uses the public Norna
package already recorded by the site.

`npm publish` is used only when a Norna maintainer releases a new engine
version. Run the exact `npm login` command printed by the release script so the
login uses the same registry and cache as publication. The npm account must
also have permission to publish `@janga/norna` and satisfy npm's current
two-factor authentication requirements. Do not use `sudo` to bypass a package
or cache permission problem.

See the [engine release instructions](https://github.com/janga/norna/blob/main/docs/engine-development.md#npm-release)
for the maintained command sequence and recovery boundary.

## How do I install ImageMagick? {#install-imagemagick}

When a JPEG or PNG file is referenced from a Norna image stack, carousel, or
card list, Norna uses ImageMagick to read its dimensions and create responsive
variants. Install ImageMagick separately before using those raster formats.
SVG images in the same blocks do not require it.

### macOS

Install ImageMagick with [Homebrew](https://brew.sh/):

```sh
brew install imagemagick
```

### Windows

Install the official Windows package from PowerShell or Windows Terminal:

```powershell
winget install ImageMagick.Q16
```

You can instead use the installer from the
[official ImageMagick download page](https://imagemagick.org/download/). Open a
new terminal after installation so the `magick` command is available.

### Debian and Ubuntu

```sh
sudo apt update
sudo apt install imagemagick
```

### Fedora

```sh
sudo dnf install ImageMagick
```

### Verify the installation

Current ImageMagick installations provide this command:

```sh
magick -version
```

Some Linux distributions install an older ImageMagick version instead. Norna
also accepts that version when both of these commands work:

```sh
identify -version
convert -version
```

See [ImageMagick's official download page](https://imagemagick.org/download/)
for other operating systems and installation methods.

## Why should I commit package-lock.json to Git? {#why-commit-package-lock}

`package-lock.json` records the exact Norna and dependency versions installed
for a site project. Committing it gives everyone working on that site, on their
different computers, the same version record. Automated builds such as GitHub
Actions receive that record too.

Commands such as `npm ci` use the lockfile to install those recorded versions.
This makes local and automated installations reproducible and avoids a later
install unexpectedly selecting different compatible dependency versions.

Commit `package.json` and `package-lock.json` together whenever the project's
Norna version or other dependencies change.
