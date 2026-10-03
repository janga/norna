---
page:
  description: Move a page with its files and child pages, update internal links, and retain old addresses.
navigation:
  order: 4000
---

# page:move

`page:move` moves a page folder, including its images and child pages, and
updates internal links. **It changes no source files unless you add `--write`.**

By default, the old page addresses still lead to the moved pages. Norna
records them as *aliases*: additional addresses for the same page.

## Preview and apply

Run these commands from your Norna project. This example renames `install`
to `installation` under the existing Guides group:

```sh title="Preview the rename"
npm exec -- norna page:move /guides/install/ /guides/installation/
```

The output lists the folders, links and aliases that would change. To apply
the move, add `--write`:

```sh title="Apply the rename" {1}
npm exec -- norna page:move /guides/install/ /guides/installation/ --write
```

```text title="Folder change"
site/root/pages/guides/pages/install/
                            becomes
site/root/pages/guides/pages/installation/
```

The files inside the folder keep their names. The page's H1 stays unchanged,
and its frontmatter order is retained because the parent did not change. Rebuild and
publish the site to make the change available to readers.

`npm exec -- norna` uses Norna installed in the project. With the optional
global launcher, the same command can start with `norna page:move`.

## Addresses and options

```sh title="Command syntax"
npm exec -- norna page:move <old-url> <new-url> [--order <integer>] [--no-aliases] [--write]
```

Replace `<old-url>` and `<new-url>` with the current and wanted page paths.
Square brackets mark optional arguments; do not type the brackets.

Use paths beginning and ending with `/`, such as `/guides/install/`, without
the domain, query or `#heading`. If the site is published below `/norna/`, omit
that prefix too. Path segments use lowercase ASCII letters, digits and single
hyphens, matching Norna's page-folder slugs.

| Option | Effect |
| --- | --- |
| `--write` | Apply the move. Without it, print a preview only. |
| `--no-aliases` | Skip adding old addresses. Internal links are still updated. Existing aliases remain, except an alias that becomes the page's current address. |
| `--order <integer>` | Set `navigation.order` explicitly to a positive safe integer. Duplicate values warn and sort by slug. |
| `--allow-renumber` | Permit the displayed changes to other siblings without an interactive confirmation. |
| `--dry-run` | Explicitly request the default preview; cannot accompany `--write`. |
| `--help`, `-h` | Show command help. |

Without `--order`, a URL rename under the same parent keeps its order. Moving
to another parent appends the page. You can also choose placement directly:

```sh
norna page:move /guides/install/ --after /guides/overview/
norna page:move /guides/install/ --before /guides/reference/
norna page:move /guides/install/ --parent /reference/ --first
norna page:move /guides/install/ --parent /reference/ --last --write
```

Use one selector and one source URL for these forms. Before/after infer the
parent; `--parent` defaults to last child. Do not combine relative placement
with `--order`. Reordering siblings updates frontmatter while keeping directory
names, URLs and aliases stable.

If an insertion needs more space between values, Norna lists the additional
sibling files and their old/new values. Interactive use asks for approval;
unattended use needs `--allow-renumber`. Cancellation leaves files unchanged.
Only the destination sibling group is renumbered, and descendants retain their
own order values. See [Names and order](/reference/site/pages/#names-and-order).

To select a site source folder other than the project's default, use the
global option `--site-dir <path>` before `page:move`.

## What changes

The whole folder moves, including `content.md`, `images/`, any `tree-theme.yaml`
and nested pages. Norna adds each moved content page's old URL to
`page.aliases`, the list of additional addresses in that page's metadata.
When a page returns to one of its own previous addresses, that alias becomes
its current address and is removed from the list. The same rule applies to
descendants; aliases owned by other pages still block the move.

Norna updates Markdown links, reference-style links and card links in page
content across the site. It keeps query strings and heading anchors. Relative
links remain relative when they still reach the same target; otherwise Norna
rewrites them as paths beginning with `/`.

Links to parent pages inside the moved folder are also updated. Every moved
page receives an alias for its old URL. You can move the last child out of a
parent that uses `page.listChildren: true`; `content:check` and `build` then
warn about its empty generated list without stopping the move or build.

This is not a search-and-replace across the repository. Links in README files,
arbitrary HTML or JavaScript, and other websites are not repaired. Referenced
headings must still exist at the destination.

## After a manual folder move

If you already moved the folder, use the same command with its old and new
paths. When the old page is absent and the new page exists, Norna updates links
and aliases without moving the folder again. Preview first, then add `--write`.

If both pages exist, Norna refuses to overwrite the destination. If neither
exists, there is no page to move or repair. `--order` is not available after
a manual move; edit the destination page's frontmatter or use a placement command.

A relative link may point to different existing files from the old and new
locations. Norna refuses to guess which was intended. Change the reported
link to a path beginning with `/` that identifies the intended target, then
run the command again.

## Limits and recovery

You cannot move Home. The
destination parent must already exist, and the destination cannot be inside
the folder being moved. The destination path must be available. An old address owned by another page also blocks the move.

Before writing, Norna validates the planned site and links, checks relevant
permissions, and checks that page source has not changed since planning.
Each `--write` invocation makes a fresh plan; it does not apply a saved preview.
The result is validated again after writing.

The folder rename must stay within one filesystem. Norna refuses a move
between filesystems instead of copying the tree. Each file update uses a
temporary file and rename, but **the complete operation is not one atomic
transaction**.

On a handled failure, Norna attempts to restore the original folder and file
contents. If restoration fails, it reports paths to inspect. Recovery is not
guaranteed after power loss, process termination or simultaneous editor writes.
Commit or back up your work before moving pages. A clean Git working tree is
not required.

## When alias insertion is refused

The command adds the old address to `page.aliases` whether the existing YAML
list uses separate lines or square brackets. Each entry is a complete path
relative to the site's root, such as `/guide/`. A page can keep several such
addresses. The command also accepts one-line `page` settings.

If the alias field uses YAML anchors, tags or other constructs the source
editor cannot safely change, the command stops before moving the page. Edit
that field in `content.md`, then retry. Alternatively, use `--no-aliases` if
you do not need to keep the old address. The command still checks and updates
internal links.

## Related tasks

- [URLs and links](/reference/site/urls/#keep-an-old-url) explains the
  `page.aliases` syntax and when to add an alias by hand instead of moving a
  page.
