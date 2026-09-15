---
page:
  description: Move a page with its files and child pages, update internal links, and retain old addresses.
---

# page:move

`page:move` moves a page folder, including its images and child pages, and
updates internal links. **It changes no source files unless you add `--write`.**

By default, the old page addresses still lead to the moved pages. Norna
records them as *aliases*: additional addresses for the same page.

## Preview and apply {#example}

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
site/pages/010-guides/pages/010-install/
                            becomes
site/pages/010-guides/pages/010-installation/
```

The files inside the folder keep their names. The page's H1 stays unchanged,
and its order remains `010` because the parent did not change. Rebuild and
publish the site to make the change available to readers.

`npm exec -- norna` uses Norna installed in the project. With the optional
global launcher, the same command can start with `norna page:move`.

## Addresses and options {#options}

```sh title="Command syntax"
npm exec -- norna page:move <old-url> <new-url> [--order <NNN>] [--no-aliases] [--write]
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
| `--no-aliases` | Skip adding old addresses. Internal links are still updated, and existing aliases are kept. |
| `--order NNN` | Set the destination's folder-order number, from 1 to 999. The number must be unused among its siblings. |
| `--help`, `-h` | Show command help. |

Without `--order`, Norna keeps the order within the same parent. When moving
to a different parent, it uses the next higher multiple of ten after that
parent's existing children. If no such number remains below 1000, choose an
unused number explicitly or reorder the children first. `--order=NNN` is also
accepted.

To select a site source folder other than the project's default, use the
global option `--site-dir <path>` before `page:move`.

## What changes {#effects}

The whole folder moves, including `content.md`, `images/`, any `theme.yaml`
and nested pages. Norna adds each moved content page's old URL to
`page.aliases`, the list of additional addresses in that page's metadata.

Norna updates Markdown links, reference-style links and card links in page
content across the site. It keeps query strings and heading anchors. Relative
links remain relative when they still reach the same target; otherwise Norna
rewrites them as paths beginning with `/`.

Links to groups inside the moved folder are also updated. Such navigation
categories have `category.yaml` instead of `content.md`; they do not receive
aliases.

This is not a search-and-replace across the repository. Links in README files,
arbitrary HTML or JavaScript, and other websites are not repaired. Referenced
headings must still exist at the destination.

## After a manual folder move {#reconcile}

If you already moved the folder, use the same command with its old and new
paths. When the old page is absent and the new page exists, Norna updates links
and aliases without moving the folder again. Preview first, then add `--write`.

If both pages exist, Norna refuses to overwrite the destination. If neither
exists, there is no page to move or repair. `--order` is not available after
a manual move because the destination folder already has its name and number.

A relative link may point to different existing files from the old and new
locations. Norna refuses to guess which was intended. Change the reported
link to a path beginning with `/` that identifies the intended target, then
run the command again.

## Limits and recovery {#recovery}

You cannot move Home or use a navigation category as the source page. The
destination parent must already exist, and the destination cannot be inside
the folder being moved. Page paths, order numbers and aliases must not collide
with existing ones.

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

## When alias insertion is refused {#errors}

The command preserves existing metadata rather than rewriting it wholesale.
It can therefore refuse to add aliases when the `page` settings at the top of
`content.md` are written on one line, such as `page: {description: Setup}`.
Write those settings on separate lines instead:

```yaml title="Metadata inside the opening --- markers of content.md" {1,2}
page:
  description: Setup
```

If `page.aliases` already exists, its addresses also need separate list lines
beginning with `-`, not a list inside square brackets. Alternatively, use
`--no-aliases` if you do not need to add old addresses. The command still
checks and updates internal links.
