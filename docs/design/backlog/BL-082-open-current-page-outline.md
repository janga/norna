# BL-082: Open The Current Page Outline On Arrival

## Status

Ready and prioritized in `Now`.

## Problem

Norna renders the current page's section outline open, but client-side
navigation state can immediately restore a previously closed value from
`sessionStorage`. A reader arriving at a page can therefore see its active page
entry closed even though the page contains several sections. This weakens the
navigation's orientation signal and can make the page appear to have no
contents.

The issue is visible on the public **What Norna Does** page after its section
outline has previously been collapsed.

## Outcome

The current page's section outline is open whenever the reader enters that
page. The reader may collapse it during the current view, but that collapsed
state does not override the default the next time the page is entered.

Expansion choices for other pages and categories remain available across page
navigation. A page without H2 sections has no section disclosure or chevron.

## Interaction Contract

- Initial HTML keeps the current page outline open as a usable no-JavaScript
  default.
- Client-side state restoration cannot close the current page outline during
  page initialization.
- Collapsing the current page outline still works until the reader leaves or
  reloads the page.
- Entering another page opens that page's outline.
- Previously expanded or collapsed non-current page and category branches keep
  their existing persistence behavior.
- Desktop and compact navigation follow the same rule.
- Filtering, **Expand all**, **Collapse all**, and **Locate current page** remain
  predictable. **Collapse all** may close the current outline for the current
  view, while **Locate current page** opens it again.

## Acceptance Criteria

- A fresh visit to a page with H2 sections shows the current page outline open.
- Collapsing that outline and reloading or revisiting the page opens it again.
- Navigating to a different page opens the newly current page outline.
- Non-current page and category expansion state remains unchanged across the
  same navigation sequence.
- Pages without H2 sections render no empty disclosure.
- The behavior is covered for persistent desktop navigation and the compact
  mobile menu.
- The no-JavaScript navigation remains open for the current page and fully
  usable.
