---
page:
  description: Link to resources hosted elsewhere and choose the right location for local files.
navigation:
  order: 2000
---

# External images and files

Ordinary Markdown can refer to images and files hosted elsewhere. For local
content, use the page's `images/` and `downloads/` folders so Norna can manage
the files with their page.

## External images and files

```md
![A diagram hosted elsewhere](https://example.com/diagram.png)
[Download an external report](https://example.com/report.pdf)
```

These are illustrative URLs. The external host controls whether the files
remain available. Norna does not import or resize the image, move these files
with a page, or check the external site's availability.

## Technical files in public/ {#shared-files-in-public}

Technical files such as `robots.txt` belong in `site/public/`. You can link to
them using ordinary Markdown:

[Open this site's robots.txt](/robots.txt).

```md
[Open this site's robots.txt](/robots.txt).
```

Write the path without the deployment prefix; Norna adds it. On this site the
file is published at `/norna/robots.txt`. A crawler looking for the domain's
`/robots.txt` needs that file deployed separately at the domain root.

The site's named logo, icons and sharing image also belong in `public/`; see
the [working branding example](/examples/building-a-site/#branding).
Keep ordinary content images in their page's `images/` folder. See
[public files](/reference/site/public-files/) for accepted filenames and hosting
requirements.

## Local images and attachments

For an image that belongs to an article, put its source in the page's
`images/` directory and use a [Markdown image](/examples/standard-markdown/#images-and-tables)
or a [Norna image block](/examples/norna-extensions/#image-stacks). Norna can
validate it, generate responsive output and move it with the page.

For a downloadable file, use its owning page's `downloads/` directory
and an [ordinary attachment link](/examples/building-a-site/#page-attachments). Norna publishes the file
unchanged and keeps it with its page. Other pages can link to that attachment's
published address. For an image needed on several pages, place a copy in each
owning page's `images/`; each copy is managed independently.
