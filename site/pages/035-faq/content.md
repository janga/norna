---
page:
  description:
    Answers to common questions about setting up and maintaining a Norna site.
---

# Norna FAQ

## How do I add Norna to an existing Node project? {#add-norna-to-an-existing-project}

The normal Norna setup creates a standalone site project. When the website
should instead live beside an existing application, library or CLI, run this
from the existing project root:

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

Norna adds `@janga/norna` as a project dependency and adds namespaced `norna:*`
npm scripts. It refuses to overwrite conflicting scripts or a non-empty target
site directory.

The surrounding project keeps its own `build`, `test` and deployment commands.
Use the namespaced commands for its Norna site:

```sh
npm run norna:check
npm run norna:build
```

See the full references for
[commands](https://github.com/janga/norna/blob/main/docs/commands.md) and
[site files](https://github.com/janga/norna/blob/main/docs/site-files.md).

## How do I install ImageMagick? {#install-imagemagick}

Norna uses ImageMagick to read raster image dimensions and create responsive
image variants. Install it separately for your operating system.

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
