---
page:
  description: Distinguish read-only checks, managed-image moves and generated image output.
---

# Validation and image sync

Use `check` to validate configuration and content before building:

```sh
npm exec -- norna check
```

It runs `config:check`, then `content:check`. Errors stop the command with a
nonzero status. Warnings identify review work but do not by themselves fail a
check. These checks do not repair source files.

## Configuration checks

`config:check` validates `config.yaml`, root and inherited page/category themes,
`sitewide-content.yaml`, navigation/background compatibility, and conventional
logo, icon and social-image filenames. It prints the resolved public URL and
main presentation settings. It checks more than the filename in its name
might suggest.

## Content checks

`content:check` validates page/category structure, H1 titles, heading IDs,
frontmatter, structured blocks, notes, tabs, callouts, code metadata, tables,
managed-image references and internal Markdown/card links. It reports source
locations and actionable corrections for discovered problems.

Links may target current pages, categories, aliases, headings and public files.
External URLs are not fetched. A missing local target is an error; a local
Markdown image outside the managed pipeline warns. Unreferenced source images,
missing child-list descriptions and carousel-ratio differences also merit
review. Successful validation does not establish editorial quality or visual
correctness.

## Image sync

After moving an image block between pages, use:

```sh
npm exec -- norna content:sync
```

Norna checks content and plans image moves into the referencing page's
`images/` folder. It moves only when the source and destination are unambiguous;
it does not guess between duplicate filenames or overwrite a conflicting
destination. Review the complete plan before confirming. `--yes` accepts that
plan without an interactive prompt. The generated project wrapper is
`npm run norna:sync`.

The command moves source files, then regenerates managed image output. It does
not move pages or rewrite prose. If no moves are needed, the CLI still runs
image generation.

Moves are not one atomic transaction. A failure reports completed and remaining
moves; completed moves stay in place. Correct the reported filesystem problem
and rerun. A move across filesystems must be completed manually. A generation
failure can occur after successful source moves: inspect the state and resolve
the error before publishing.

## Image generation

`images` creates responsive variants, inspection originals and generated
metadata for referenced managed images. It reuses unchanged cached output;
PNG/JPEG conversion requires ImageMagick. It does not perform source-image
relocation. See [Managed images](/reference/site/images/) for source limits,
output paths and the versioned image manifest.
