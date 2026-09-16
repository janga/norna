---
page:
  description: Add a page or category with predictable parent selection, folder naming and preview controls.
---

# Page and category creation

`page:add` creates `content.md` and an empty `images/` folder. `category:add`
creates `category.yaml` and an empty `pages/` folder. Both **write immediately**;
add `--dry-run` to inspect the destination first.

```sh
npm exec -- norna page:add "About" --parent / --dry-run
npm exec -- norna page:add "About" --parent /
```

## Choose the parent

`--parent /` chooses the top level. A logical page or category path, such as
`--parent /guides/`, chooses an existing node. These are site paths without
the deployment prefix, numeric folder prefixes, queries or fragments.

Without `--parent`, the invocation directory must be exactly the selected
site's `pages/` directory or an existing page/category directory. Norna refuses
to guess from the project root or a page's `images/` folder. Home cannot have
children.

```sh
npm exec -- norna category:add "Guides" --parent /
npm exec -- norna page:add "Installation" --parent /guides/
```

Add listed content to a new category before building. Its generated URL
destination follows the [category rule](/reference/site/pages/#opening-a-category-url).

## Names and order

```text
norna page:add <title> [--parent <path>] [--slug <slug>] [--order <NNN>] [--dry-run]
norna category:add <label> [--parent <path>] [--slug <slug>] [--order <NNN>] [--dry-run]
```

Titles and labels must be nonempty single-line text. Quote multiword names in
the shell. The generated slug lowercases and transliterates text to ASCII,
removes apostrophes and separates other runs with hyphens. Use `--slug` when
the automatic result is empty or unsuitable. Explicit slugs contain lowercase
ASCII letters/digits separated by single hyphens.

Automatic order is the next higher multiple of ten after existing siblings.
`--order` accepts an integer from 1 through 999, written with up to three
digits; the folder prefix is padded to three digits. A used sibling slug or
order is an error. Automatic order beyond 999 requires reorganizing siblings
or choosing a free explicit order.

Options accept separated or `=` values and may occur only once. Unknown
options are rejected; `-h` and `--help` show usage.

## Generated content and recovery

A page starts with the escaped title as its H1, an Introduction H2 and short
placeholder prose. A category stores its label in YAML. Existing siblings are
not renumbered or edited. New content is prepared in a temporary directory
under `.norna/create/` before moving to its destination.

Review generated files in Git before committing. To relocate an existing page
and repair links, use [page:move](/reference/commands/move/).
