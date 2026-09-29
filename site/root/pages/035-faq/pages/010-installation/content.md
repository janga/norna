---
page:
  description:
    Answers about installing Norna and the software used to process raster images.
---

# Installation

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

## How do I install ImageMagick? {#install-imagemagick}

When a JPEG or PNG file is referenced from a Norna image stack, carousel, or
card list, Norna uses ImageMagick to read its dimensions and create responsive
variants. Install ImageMagick separately before using those raster formats.
SVG images in the same blocks do not require it.

**macOS**

Install ImageMagick with [Homebrew](https://brew.sh/):

```sh
brew install imagemagick
```

**Windows**

Install the official Windows package from PowerShell or Windows Terminal:

```powershell
winget install ImageMagick.Q16
```

You can instead use the installer from the
[official ImageMagick download page](https://imagemagick.org/download/). Open a
new terminal after installation so the `magick` command is available.

**Debian and Ubuntu**

```sh
sudo apt update
sudo apt install imagemagick
```

**Fedora**

```sh
sudo dnf install ImageMagick
```

**Verify the installation**

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
