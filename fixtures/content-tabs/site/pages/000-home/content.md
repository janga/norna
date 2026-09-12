# Installation alternatives

## Install

Choose an installation method.

:::: tabs

::: tab "macOS"

::: info
Use the package manager already installed on this computer.
:::

```sh title="Install with Homebrew"
brew install imagemagick
```

Check the version after installation.{note-ref}

{note: Restart the terminal if the new command cannot be found.}

:::

::: tab "Windows"

```powershell title="Install with WinGet"
winget install ImageMagick.ImageMagick
```

| Step | Result |
| --- | --- |
| Install | Command becomes available |
| Verify | Version is displayed |

```image-stack
- image: example.svg
  alt: An adoption illustration.
  caption: Managed images remain inside their selected alternative.
```

```image-carousel
- image: example.svg
  alt: First comparison image.
- image: example.svg
  alt: Second comparison image.
```

:::

::: tab "Linux"

Not applicable. This example assumes ImageMagick is already installed.

:::

::::

## Verify

:::: tabs

::: tab "macOS"

```sh
magick --version
```

:::

::: tab "Windows"

```powershell
magick --version
```

:::

::::
