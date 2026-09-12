---
page:
  description:
    Answers about YAML, Markdown frontmatter, and Norna image reports.
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

## Why does Prettier change semantic callout line breaks? {#prettier-callouts}

Norna semantic callouts keep the marker and its content on separate quoted
lines:

```md
> [!TIP]
> Preview the site before publishing it.
```

If VS Code formats Markdown with Prettier on save, the default
`prettier.proseWrap: always` can treat those lines as one paragraph. A long
callout may then be rewritten on one line, or a later save may insert an empty
quoted line. The content still looks like Markdown, but Norna can no longer
read the marker as a semantic callout.

For a Norna site, set Prettier to preserve existing Markdown wrapping in the
workspace settings. Create or open `.vscode/settings.json` in the site's
project root and add this block. The important part is to replace any existing
global `prettier.proseWrap: "always"` setting; do not leave both values in
effect:

```json
{
  "prettier.proseWrap": "preserve",
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  }
}
```

If the file already has a `[markdown]` block, add only the missing setting
inside that block. Do not create a second block with the same key. The global
setting is intentional here because it also covers formatters that do not
apply language-specific overrides consistently. It does not disable Prettier;
it tells it to keep the line wrapping that the author has written. Norna's VS
Code extension also normalizes a recognized `content.md` when it is saved. The
six standard callout types and unknown uppercase fallback types use the same
two-line syntax.
