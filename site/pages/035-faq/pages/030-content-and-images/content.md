---
page:
  description:
    Answers about YAML, Markdown, IntelliSense, and Norna image reports.
---

# Content and images

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

## Why is Norna IntelliSense missing? {#missing-intellisense}

Norna help depends on the file's location and the project's Norna installation,
not just its filename or the text you type. An unrelated file named
`theme.yaml` does not automatically become a Norna configuration file.

The editor extension is experimental and is not published in the Visual
Studio Marketplace. To evaluate it, obtain a VSIX build and follow
[Install the extension](https://github.com/janga/norna/blob/main/docs/editor-support.md#install-the-extension).
You do not need the extension to write or build a Norna site.

After installing the VSIX, open your site's `pages/000-home/content.md`.
Run **Norna: Show IntelliSense
Status** from the Command Palette. The report identifies a missing project
dependency or incompatible editor support.

If the file is not recognized, check that the site has both `config.yaml` and
`pages/000-home/content.md` saved on disk. If the project dependency is missing,
run this in the folder containing the site's `package.json`:

```sh
npm install
```

Run **Norna: Refresh IntelliSense**, then place the cursor on an unindented
blank body line in `content.md`, outside frontmatter and code examples. Press
`Ctrl+Space` or run **Trigger Suggest**. You should see entries such as
`image-stack`, `image-carousel`, and `card-list`. The page does not need to be
error-free for suggestions to work.

See [Recognized files](https://github.com/janga/norna/blob/main/docs/editor-support.md#recognized-files)
for supported locations and
[editor troubleshooting](https://github.com/janga/norna/blob/main/docs/editor-support.md#troubleshooting)
for workspace trust, language mode, and extension checks.

## Why does Prettier change semantic callout line breaks? {#prettier-callouts}

Norna semantic callouts keep the marker and its content on separate quoted
lines:

```md
> [!TIP]
> Preview the site before publishing it.
```

Markdown formatters can join these lines or insert a blank line between the
marker and its body. That changes the callout syntax. Norna does not repair
Markdown during saves or register a Markdown formatter.

The supported setup uses VS Code and Red Hat YAML without a Markdown formatter.
If Prettier or another extension formats Markdown automatically, disable
formatting on save for Markdown in the site's `.vscode/settings.json`:

```json
{
  "[markdown]": {
    "editor.formatOnSave": false
  }
}
```

If the file already has a `[markdown]` block, set `editor.formatOnSave` to
`false` inside that block rather than adding a duplicate. This is a
Markdown-only setting; standalone YAML formatting and other languages keep
their existing settings.

Explicit Markdown formatting with Prettier or another extension is outside
the verified setup. Norna does not guarantee compatibility with arbitrary
formatter settings. It reports invalid content but does not undo another
formatter's changes. Restore changed callouts to the two-line form above and
run `npm run norna:content:check`.

See [Markdown and image help](https://github.com/janga/norna/blob/main/docs/editor-support.md#markdown-and-image-help)
for the editor's responsibilities and supported setup.
