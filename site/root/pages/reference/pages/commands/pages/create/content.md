---
page:
  description: Add a page with predictable parent selection, folder naming and preview controls.
navigation:
  order: 3000
---

# Page creation

`page:add` creates `content.md` and an empty `images/` folder. It **writes
immediately** unless other pages need new order values, which requires
confirmation. Add `--dry-run` to inspect the complete plan first.

```sh
npm exec -- norna page:add "About" --parent / --dry-run
npm exec -- norna page:add "About" --parent /
```

## Choose the parent

`--parent /` creates a child of the homepage in `root/pages/`. A page path, such as
`--parent /guides/`, chooses an existing page. These are site paths without
the deployment prefix, queries or fragments.

Without `--parent`, the invocation directory must be exactly the selected
site container, `root/`, `root/pages/` or an existing page directory. Norna
refuses to guess from the project root or a page's `images/` folder.

```sh
npm exec -- norna page:add "Guides" --parent /
npm exec -- norna page:add "Installation" --parent /guides/
```

To make an overview, set `page.listChildren: true` in the parent page's
`content.md`. See [List child pages](/reference/site/pages/#list-child-pages).

## Names and order

```text
norna page:add <title> [--parent <path>] [--slug <slug>] [--order <integer>] [--dry-run]
```

Titles must be nonempty single-line text. Quote multiword names in
the shell. The generated slug lowercases and transliterates text to ASCII,
removes apostrophes and separates other runs with hyphens. Use `--slug` when
the automatic result is empty or unsuitable. Explicit slugs contain lowercase
ASCII letters/digits separated by single hyphens.

By default the page is added last. Choose a position directly:

```sh
norna page:add "Installation" --after /guides/overview/
norna page:add "Installation" --before /guides/reference/
norna page:add "Installation" --parent /guides/ --first
norna page:add "Installation" --parent /guides/ --last
```

Before/after infer the parent. Use only one position selector. The page's
frontmatter receives `navigation.order`; the directory uses only its slug.
Norna uses an available integer gap or proposes renumbering that sibling group
with spaces between values. The preview lists affected files and old/new values.

`--order` sets a positive safe integer explicitly (at most 9007199254740991).
It cannot accompany before/after/first/last. Duplicate values warn and sort by
slug. A used sibling slug is an error.

When existing siblings need new values, the CLI asks for confirmation. Scripts
must supply `--allow-renumber`; without it a noninteractive command stops before
writing. `--dry-run` always shows the changes without applying them.

Options accept separated or `=` values and may occur only once. Unknown
options are rejected; `-h` and `--help` show usage.

## Generated content and recovery

A page starts with the escaped title as its H1, an Introduction H2 and short
placeholder prose and its navigation order. Only the siblings listed in the
confirmed renumbering plan receive additional edits. The destination is reserved exclusively; creation
refuses an existing folder. If writing fails, Norna removes only the entries
created by that operation and attempts to restore any changed sibling files.

Review generated files in Git before committing. To relocate an existing page
and repair links, use [page:move](/reference/commands/move/).
