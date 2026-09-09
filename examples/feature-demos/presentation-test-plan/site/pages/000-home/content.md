---
page:
  description: A manual review plan for Norna presentation behavior.
---

# Presentation Test Plan

Lorem ipsum dolor sit amet, consectetur adipiscing elit. This deliberately
plain opening establishes the normal reading rhythm before the test cases add
wider and more interactive material.{note-ref}

{note: At a wide desktop size, this note should use a margin when that space is not occupied by page navigation.}

## Run the plan

Start at a desktop viewport near 1440 by 900 pixels. Use the **Display** menu to
repeat the checks with Narrow, Standard, and Wide reading widths, then compare
Light and Dark appearances. Repeat the essential checks near 390 by 844 pixels.

Follow these pages in order:

1. **Reading and Images** checks sidenotes, a tall explanatory image, its
   caption, and progressive image inspection.
2. **Deep Navigation** introduces a deliberately nested branch.
3. **Data and Code** checks adaptive table width, a long code example, and
   reading-position markers with both navigation rails present.

## What should remain stable

Changing a reader setting must not hide content, create horizontal page
overflow, or move keyboard focus unexpectedly. Without JavaScript, the prose,
images, captions, tables, and code must remain readable even when an enhancement
is absent.

## Small-screen pass

On a narrow screen, margins become part of the normal flow. Notes and captions
should therefore appear below their references, wide tables should expose a
horizontal scroll cue, and image inspection should stay within the dialog.
