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
