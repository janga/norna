---
page:
  description: Keep files with their owning page, link to them and share them from other pages.
---

# Page attachments

Keep a page's PDFs, archives, spreadsheets and other linked files in a
`downloads/` folder beside its `content.md`. Norna publishes these files
unchanged and moves them with the page.

```text title="A page and its attachment"
site/root/pages/010-guide/
|-- content.md
`-- downloads/
    `-- checklist.pdf
```

In that page, link using the filename:

```md title="Guide's content.md"
[Download the checklist](checklist.pdf)
```

This link refers only to Guide's `downloads/`. Another page may have its own
`checklist.pdf`; Norna never substitutes that file if Guide's copy is missing.
The same shorthand works in a [card's `link` field](/reference/content/cards/).

## Share an attachment

From another page, use the owning page's URL followed by `downloads/` and the
filename:

```md title="A link from another page"
[Download Guide's checklist](/guide/downloads/checklist.pdf)
```

Do not include a deployment prefix such as `/norna/`. Norna adds it to the
rendered link. Home's attachments live in `site/root/downloads/` and use
`/downloads/filename` when linked from other pages. Sharing does not copy a file.

Spaces and Unicode are supported. Enclose a Markdown destination containing
spaces in angle brackets, for example `[Report](<annual report.pdf>)`.
Queries and fragments, such as `checklist.pdf#page=2`, are retained.

## Move or replace files

[Moving a page](/reference/commands/move/) carries its `downloads/` folder and
updates known internal links. The attachment's public address changes with
the page. Old external attachment links are not redirected.

Replacing a file under the same name preserves its address. In the
[VS Code attachment workflow](/reference/workflows/editor/#add-and-use-page-attachments),
Rename updates known page-content references and Replace sends the previous
file to Trash. Save edited references before publishing. Moving Markdown text
alone does not move an attachment or preserve its former owner.

## Supported files

All file types are accepted, including HTML and SVG. The browser and hosting
headers determine whether a file opens or downloads; Norna does not force a
download. Publish only files you intend to make available: HTML and SVG can
contain active content, and attachments have no access control.

Keep files directly in `downloads/`, without subfolders or symbolic links.
Names must be unique within the folder, including differences only in case or
Unicode normalization. Filename validation and output-collision checks prevent
ambiguous addresses and overwriting generated pages or public files.

An image imported as an attachment remains a linked file. To display an image
and generate its variants, use [page images](/reference/site/images/) instead.
Use [public files](/reference/site/public-files/) for shared site files such as
logos, icons, `robots.txt` and verification files. Existing public download
links continue to work.
