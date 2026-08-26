---
page:
  description: Internal fixture for Markdown-authoritative Norna content.
---

# Content Model v2 Fixture


## Intro {#intro}

This fixture validates that Markdown defines sections. It also checks **inline
emphasis**.

```norna-image-stack
- image: hero.jpg
  alt: A black Labrador-type dog sitting on grass.
  caption: Dog portrait one: a black Labrador-type dog.
```

### Subhead, but not a new section

Text can continue after a Norna-managed image.

```norna-image-stack
- image: detail.jpg
  alt: A small tan terrier-type dog standing in grass.
  caption: Dog portrait two: a small tan terrier-type dog.
- image: duplicate.jpg
  alt: A white and brown border collie-type dog sitting outdoors.
  caption: Dog portrait three: a white and brown border collie-type dog.
```

## Carousel section {#timed}

This section demonstrates an image carousel without duplicating section order
in frontmatter.

```norna-image-carousel
- image: slide-one.jpg
  alt: A russet-brown dog beginning a gallop in a grassy field.
  caption: Gallop phase one: push-off.
- image: slide-two.jpg
  alt: The same russet-brown dog fully extended in mid-gallop.
  caption: Gallop phase two: suspension.
- image: slide-three.jpg
  alt: The same russet-brown dog landing during a gallop.
  caption: Gallop phase three: landing.
```

## Plain section {#plain}

This section is defined entirely by Markdown.

```norna-image-stack
- image: image.jpg
  caption: a dog
```

## Card section {#card-section}

Cards are very limited but may be developed in the future.

```norna-card-list
layout: image-right
flow: stack
size: s
width: narrow

- title: Adopt
  text: A card can combine a short label, supporting text, a managed SVG image and an optional link.
  image: adopt.svg
  link: /guide/
  badge-text: Recommended
- title: Foster
  text: Cards without links use the same visual structure.
  image: foster.svg
- title: Donate
  text: Cards may also be text-only when no image is needed.
```
