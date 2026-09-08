---
page:
  description: Open complete Norna sites and compare simple single-page and multi-page navigation.
---

# Complete sites

The dog-shelter examples are complete, independently built Norna sites rather
than fragments embedded in the documentation. Both keep navigation in the top
area because their structures are simple enough not to need a hierarchical
navigation tree. This documentation site provides the contrasting example of a
deeper page hierarchy with navigation rails.

The single-page site lists its sections. The multi-page site lists its pages.
Open the rendered sites to inspect their responsive navigation, then browse the
source to see the complete file structure.

## Single-page dog shelter {#single-page}

One page contains the complete presentation. Its H2 sections become local
navigation destinations, while the content and images remain together in the
homepage directory.

```image-stack
- image: single-page-dog-shelter.png
  alt: The complete single-page dog shelter example shown in a desktop browser.
  caption: One page with section links in the top navigation.
```

[Open the single-page site](https://janga.github.io/norna/examples/complete-sites/dog-shelter-single-page/)
or [browse its source files](https://github.com/janga/norna/tree/main/examples/complete-sites/dog-shelter-single-page).

## Multi-page dog shelter {#multi-page}

The same subject is divided into Home, Dogs and Adopt. The pages appear in top
navigation, and each page keeps its own content and images without introducing
a deeper hierarchy.

```image-stack
- image: multi-page-dog-shelter.png
  alt: The complete multi-page dog shelter example shown in a desktop browser.
  caption: Several top-level pages without a hierarchical navigation tree.
```

[Open the multi-page site](https://janga.github.io/norna/examples/complete-sites/dog-shelter-multi-page/)
or [browse its source files](https://github.com/janga/norna/tree/main/examples/complete-sites/dog-shelter-multi-page).

## Hierarchical documentation {#hierarchical-documentation}

The site you are reading uses categories, nested pages, a persistent page tree,
and a separate contents rail for headings on the current page. It is a real
Norna site rather than a special documentation frontend.

[Browse the documentation-site source](https://github.com/janga/norna/tree/main/site)
or read [Grow Your Site](/getting-started/grow-your-site/) for the shorter
illustrated progression from one page to this structure.
