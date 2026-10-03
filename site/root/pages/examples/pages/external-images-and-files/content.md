---
page:
  description: Choose between external resources, shared public files and files that belong to a page.
navigation:
  order: 2000
---

# External images and files

Ordinary Markdown can refer to images and files hosted elsewhere or kept in
`site/public/`. These have useful roles, but they do not receive the same
processing and page ownership as files in a page's `images/` or `downloads/`.

## External images and files

```md
![A diagram hosted elsewhere](https://example.com/diagram.png)
[Download an external report](https://example.com/report.pdf)
```

These are illustrative URLs. The external host controls whether the files
remain available. Norna does not import or resize the image, move these files
with a page, or check the external site's availability.

## Shared files in public/

[Open this site's robots.txt](/robots.txt).

```md
[Open this site's robots.txt](/robots.txt).
```

The file lives in `site/public/robots.txt`. Public files keep a site-wide
address and suit logos, icons, crawler instructions and other shared files.
Ordinary Markdown images can also refer to public image files; those images
stay outside managed image processing. See [public files](/reference/site/public-files/).

## Why page-owned images and attachments are preferred

For an image that belongs to an article, put its source in the page's
`images/` directory and use a [Norna image block](/examples/norna-extensions/#image-stacks). Norna can
validate it, generate responsive output and move it with the page.

For a downloadable file that belongs to a page, use its `downloads/` directory
and an [ordinary attachment link](/examples/building-a-site/#page-attachments). Norna publishes the file
unchanged and keeps it with its page. This relative Markdown image bypasses
the managed image pipeline and produces a warning:

```md
![Portrait](portrait.jpg)
```

Use an image block for this local image instead.
