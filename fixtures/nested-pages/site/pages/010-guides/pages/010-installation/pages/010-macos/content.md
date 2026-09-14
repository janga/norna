---
page:
  description: A third-level macOS installation page.
---

# macOS

## Install

This third-level page is available at `/guides/installation/macos/`. [^margin:layout-1]

[^margin:layout-1]: Notes use the margin when the current layout leaves enough room.

Change the reading width to compare a second note against the same page layout. [^margin:layout-2]

[^margin:layout-2]: Narrow and standard text leave room for this note; wide text returns it to the reading flow.

### Prerequisites

Add details that belong under the installation step.

## Verify

Explain how the reader can verify the installation. [^margin:layout-3]

[^margin:layout-3]: This third note makes spacing and vertical order easier to inspect while scrolling.

| Check | Command | Expected result | Recovery |
| --- | --- | --- | --- |
| Runtime | `node --version` | A supported Node.js version | Install the current supported release |
| Configuration | `norna config:check` | Configuration check passed | Correct the reported file and key |
| Content | `norna content:check` | Content check passed | Correct the reported page or image reference |
