---
page:
  description: Explore complete single-page, multi-page and documentation sites and their source files.
navigation:
  order: 6000
---

# Complete sites

These complete Norna projects show how content, files and configuration work
together. The small shelter sites illustrate sections and top-level pages;
this documentation site demonstrates a deeper hierarchy.

## Single-page site

```image-stack
items:
  - image: single-page-dog-shelter.png
    alt: The complete single-page dog shelter example shown in a desktop browser.
    caption: One page whose H2 sections become its navigation destinations.
```

[Open the single-page site](https://janga.github.io/norna/examples/complete-sites/dog-shelter-single-page/)
or [browse its source](https://github.com/janga/norna/tree/main/examples/complete-sites/dog-shelter-single-page).

## Multi-page site

```image-stack
items:
  - image: multi-page-dog-shelter.png
    alt: The complete multi-page dog shelter example shown in a desktop browser.
    caption: Several top-level pages sharing one responsive top navigation.
```

[Open the multi-page site](https://janga.github.io/norna/examples/complete-sites/dog-shelter-multi-page/)
or [browse its source](https://github.com/janga/norna/tree/main/examples/complete-sites/dog-shelter-multi-page).

## Documentation site

This documentation site demonstrates nested pages, area menus and section
links in a local tree. [Browse its source](https://github.com/janga/norna/tree/main/site)
and compare it with the [navigation examples](/examples/building-a-site/#automatic-navigation).
The [navigation reference](/reference/configuration/navigation/) explains
the rules behind these layouts.

Norna generates semantic HTML, responsive layout, keyboard behavior, focus
handling, and accessible labels for its own controls. Authors remain responsible
for meaningful headings, links, captions, language, and alternative text. The
engine can preserve those decisions across screen sizes; it cannot make
inaccessible editorial content accessible automatically.
