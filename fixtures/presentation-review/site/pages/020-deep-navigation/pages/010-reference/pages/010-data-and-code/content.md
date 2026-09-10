---
page:
  description: Manual checks for adaptive tables, sticky code context, and reading-position markers.
---

# Data and Code

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed posuere consectetur
est at lobortis. This deepest page should show the page hierarchy on the left
and its H2 and H3 outline on the right at a wide desktop size.{note-ref}

{note: With the right contents rail visible, this note stays in the reading flow. Focus reading may move it into newly available margin space.}

## Adaptive Table {#adaptive-table}

Begin with Standard reading width. The table should use only as much horizontal
space as it needs: first the prose lane, then available space toward the right,
and finally the broader page canvas. If even that is insufficient, a visible
horizontal overflow cue and keyboard-reachable scroll area should appear.

Switch to Focus reading and Wide. More of the table should become visible, but
it must never disappear under navigation or create horizontal page overflow.
When the complete table fits, scroll down its rows and verify that the column
headings remain below the sticky site header until the table ends.

| Check {row-header} | Viewport | Reading width | Navigation state | Expected lane | Overflow cue | Keyboard scroll | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A01 | 1440 x 900 | Standard | Both rails visible | Prose then right | Only if needed | Available when clipped | Review |
| A02 | 1440 x 900 | Wide | Both rails visible | Prose then right | Only if needed | Available when clipped | Review |
| A03 | 1440 x 900 | Wide | Focus reading | Full safe canvas | Only if needed | Available when clipped | Review |
| A04 | 1100 x 800 | Standard | Responsive rails | Available canvas | Visible when clipped | Tab reaches scroller | Review |
| A05 | 768 x 900 | Standard | Compact navigation | Content width | Visible when clipped | Arrow keys scroll | Review |
| A06 | 390 x 844 | Narrow | Mobile menu closed | Viewport content | Visible when clipped | Swipe or keyboard | Review |
| A07 | 390 x 844 | Wide | Mobile menu open | Viewport content | Visible when clipped | No page overflow | Review |
| A08 | 1440 x 700 | Narrow | Both rails visible | Smallest useful lane | Only if needed | Header remains legible | Review |
| A09 | 1680 x 1050 | Wide | Both rails visible | Natural table width | Absent when all fits | Not required | Review |
| A10 | 1280 x 800 | Standard | Focus reading | Expanded canvas | Only if needed | Focus stays visible | Review |
| A11 | 1024 x 768 | Narrow | Responsive layout | Available canvas | Visible when clipped | Scroll reaches last column | Review |
| A12 | 1440 x 900 | Standard | Both rails visible | Stable after resize | Recomputed correctly | No focus loss | Review |

## Sticky Code Context {#sticky-code-context}

The titled example is intentionally taller than a laptop viewport. As it moves
behind the sticky site header, `deployment-plan.yaml` should remain visible as
context. The title must stop sticking when the code example ends. The copy
button should remain usable and copy only the code.

```yaml title="deployment-plan.yaml" {5,18,31}
project:
  name: generic-documentation
  owner: editorial-team
  status: review
environments:
  - name: preview
    branch: feature
    checks:
      - links
      - accessibility
      - content
  - name: staging
    branch: main
    checks:
      - links
      - accessibility
      - performance
      - metadata
  - name: production
    branch: release
    checks:
      - links
      - accessibility
      - performance
      - metadata
      - redirects
publishing:
  provider: generic-host
  output: dist
  immutableAssets: true
  cacheControl:
    html: no-cache
    images: public-max-age
    styles: public-max-age
review:
  required:
    - content-owner
    - technical-owner
  evidence:
    - desktop-screenshot
    - mobile-screenshot
    - keyboard-pass
    - no-script-pass
  completion:
    build: passed
    links: passed
    visual: pending
```

## Navigation Markers {#navigation-markers}

Use Dark appearance for this section. The current page marker and the current
H2 or H3 marker should be lighter than their surroundings, visually distinct
from each other, and quieter than the document itself.

### First Position {#first-position}

Aliquam porta felis non nibh feugiat, vitae facilisis mauris gravida. Integer
non sem at urna fermentum tristique. Scroll until this heading becomes current
in the contents rail.

### Middle Position {#middle-position}

Curabitur blandit tempus porttitor. Aenean lacinia bibendum nulla sed
consectetur. The marker should move here without changing the URL, focus, or
document position.

### Final Position {#final-position}

Donec ullamcorper nulla non metus auctor fringilla. Etiam porta sem malesuada
magna mollis euismod. Continue to the bottom: the marker must be able to reach
this final heading even after the document can no longer scroll further.
