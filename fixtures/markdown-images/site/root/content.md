# Managed Markdown images

## Standalone images

A Markdown paragraph uses the same presentation as a single image stack.

![Markdown standalone](images/circle.svg "A title without a caption")

```image-stack
items:
  - image: circle.svg
    alt: Stack comparison
```

![Small standalone](images/small.svg)

## Inline and linked images

Before ![Inline](small.svg) after.

![First](images/small.svg) ![Second](./images/small.svg)

[![Linked](images/circle.svg)](#destination "Keep this destination")

## Nested images

> ![Quoted](./images/circle.svg)

- ![List](images/circle.svg)
- Before ![List inline](images/small.svg) after.
- [![List link](images/small.svg)](#destination)

<details open>
<summary>Image in a disclosure</summary>

![Details][circle]

</details>

## Destination

The authored image link arrives here.

[circle]: images/circle.svg "A reference title"
