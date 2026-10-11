# Installation alternatives

## Install

Choose an installation method.

:::: tabs

::: tab "macOS"

> [!NOTE]
> Use the package manager already installed on this computer.

```sh title="Install with Homebrew"
brew install git
```

Check the version after installation.[^terminal]

:::

::: tab "Windows"

```powershell title="Install with WinGet"
winget install Git.Git
```

| Step | Result |
| --- | --- |
| Install | Command becomes available |
| Verify | Version is displayed |

```image-stack
items:
  - image: example.svg
    alt: An adoption illustration.
    caption: Managed images remain inside their selected alternative.
```

```image-carousel
items:
  - image: example.svg
    alt: First comparison image.
  - image: example.svg
    alt: Second comparison image.
```

:::

::: tab "Linux"

Not applicable. This example assumes Git is already installed.

:::

::::

## Verify

:::: tabs

::: tab "macOS"

```sh
git --version
```

:::

::: tab "Windows"

```powershell
git --version
```

:::

::::

[^terminal]: Restart the terminal if the new command cannot be found.
