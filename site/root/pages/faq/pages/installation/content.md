---
page:
  description:
    Answers about installing Norna and the software used to process raster images.
navigation:
  order: 1000
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

## Do I need ImageMagick? {#install-imagemagick}

No. Norna includes Sharp for JPEG and PNG processing through npm. Earlier
Norna releases required a separate ImageMagick installation. Existing deployment
workflows can remove that installation step after updating Norna.

## Why can't Norna load image processing? {#image-processing}

Sharp needs native components for the computer running the build. If Norna
reports that Sharp cannot load, run this from the site project:

```sh
npm install --include=optional
```

Install dependencies on the computer that runs Norna; copying `node_modules/`
from a different operating system or processor can leave the wrong binaries.
In CI, use `npm ci` with optional dependencies enabled and a current lockfile.
If installation still fails, check Sharp's
[supported platforms and installation guidance](https://sharp.pixelplumbing.com/install/).
