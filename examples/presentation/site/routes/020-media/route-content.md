---
title: Media blocks
description: Compare Norna's managed image stacks, carousels and card lists.
navigation:
  label: Media blocks
---

## Image stack {#stack}

An image stack places one or more managed images in the normal Markdown flow.
Each source file belongs in the section's image folder, and Norna creates the
responsive output used by the browser.

````
```norna-image-stack
- image: stack-one.svg
  alt: A pale panel with a single large circle.
  caption: One image can introduce a visual idea.
- image: stack-two.svg
  alt: A dark panel with three aligned blocks.
  caption: A stack can contain several related images.
```
````

```norna-image-stack
- image: stack-one.svg
  alt: A pale panel with a single large circle.
  caption: One image can introduce a visual idea.
- image: stack-two.svg
  alt: A dark panel with three aligned blocks.
  caption: A stack can contain several related images.
```

## Image carousel {#carousel}

A carousel keeps a related group together while showing one image at a time.
The controls, keyboard interaction and current position are provided by Norna.

```norna-image-carousel
- image: carousel-one.svg
  alt: A green panel with a diagonal line.
  caption: First frame: a broad direction.
- image: carousel-two.svg
  alt: A blue panel with two overlapping circles.
  caption: Second frame: a closer relationship.
- image: carousel-three.svg
  alt: A red panel with a compact grid.
  caption: Third frame: a denser detail.
```

## Card list {#cards}

Cards are useful when several short items need the same visual treatment. The
block controls the layout and size without requiring a component for each card.

```norna-card-list
layout: image-top
flow: grid
size: m
width: normal

- title: Image stack
  text: A simple vertical sequence of managed images.
  image: card-stack.svg
  badge-text: Established
- title: Carousel
  text: A focused sequence with controls and captions.
  image: card-carousel.svg
  badge-text: Established
- title: Section surfaces
  text: A bounded way to create rhythm between sections.
  image: card-surfaces.svg
  badge-text: New
```

The examples above are still ordinary Markdown blocks. Their presentation is
opinionated, so the same source remains predictable on smaller screens.
