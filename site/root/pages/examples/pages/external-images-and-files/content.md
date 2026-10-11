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

## Shared files in public/ {#shared-files-in-public}

Use a shared image when several pages need the same asset. This example and
[Building a site with Norna](/examples/building-a-site/#branding) both use one file:

```text
site/public/images/shared-frame.svg
```

![The Shared Frame example logo: overlapping frames and a wordmark.](/_norna/shared/images/shared-frame.svg)

```md
![The Shared Frame example logo: overlapping frames and a wordmark.](/_norna/shared/images/shared-frame.svg)
```

Write the link as shown, without the site's deployment prefix. Norna adds it
automatically: this site's published image is at
`/norna/_norna/shared/images/shared-frame.svg`. The file keeps its original bytes and filename,
without the responsive variants or hashed filenames of page-owned images.
Ordinary Markdown references participate in Norna's rename and move updates.

Technical files have a different location. For example:

[Open this site's robots.txt](/robots.txt).

```md
[Open this site's robots.txt](/robots.txt).
```

The file lives in `site/public/robots.txt` and is published at the site's root.
Put downloadable documents in a page's `downloads/`, including documents linked
from several pages. See [public files](/reference/site/public-files/) for the
allowed technical files and shared images.

## Why page-owned images and attachments are preferred

For an image that belongs to an article, put its source in the page's
`images/` directory and use a [Markdown image](/examples/standard-markdown/#images-and-tables)
or a [Norna image block](/examples/norna-extensions/#image-stacks). Norna can
validate it, generate responsive output and move it with the page.

For a downloadable file that belongs to a page, use its `downloads/` directory
and an [ordinary attachment link](/examples/building-a-site/#page-attachments). Norna publishes the file
unchanged and keeps it with its page.
