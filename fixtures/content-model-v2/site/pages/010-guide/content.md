---
page:
  description: Internal page fixture for content model v2.
---

# Guide


## Intro {#intro}

Pages may use the same section id and image filename as other pages without
making the site invalid.

```norna-image-stack
- image: duplicate.jpg
  alt: A page-local duplicated filename.
  caption: This file is resolved in the page image root.
```
