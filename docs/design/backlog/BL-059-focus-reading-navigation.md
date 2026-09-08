# BL-059: Compact Navigation In Focus Reading

## Outcome

Focus reading removes persistent navigation rails without removing access to
the site's navigation. A compact trigger in the sticky header opens the same
complete hierarchy used by the small-screen menu as an overlay, leaving the
reading layout undisturbed.

The mode continues to reduce surrounding interface density. It does not become
an isolated state from which readers must first exit before they can find
another page.

## Interaction Contract

- Keep the site identity, when present, and the Display control available in
  the sticky header.
- Show one clearly named compact navigation trigger whenever Focus reading
  hides persistent site or page navigation.
- Reuse the existing complete navigation tree, current-page state, section
  links, filtering, and disclosure behavior. Do not create a second navigation
  model for Focus reading.
- Open the navigation as an opaque overlay or drawer above the document. It
  must not resize the content canvas or move the reader's current position.
- Close the overlay after a destination is selected and when the reader presses
  `Escape`. Return focus to the trigger when it is dismissed without
  navigation.
- Keep the trigger reachable and visibly focused with a keyboard. Give the
  trigger and navigation region localized accessible names.
- Prevent background interaction while a modal presentation is open without
  hiding the navigation itself from assistive technology.
- Preserve ordinary static navigation when JavaScript is unavailable. Focus
  reading remains an enhanced reader preference rather than a no-JavaScript
  prerequisite.

## Layout Contract

- Keep the selected prose width and prose axis stable when Focus reading is
  entered or left.
- Let wide content use space released by hidden auxiliary rails only through
  the owning component's established layout contract. `BL-055` defines the
  first such behavior for tables.
- Keep the compact menu above, rather than inside, the content layout so opening
  it cannot change table, media, section-surface, or sidenote geometry.
- Use the existing palette and navigation tokens for the trigger, panel,
  backdrop, focus indicators, and active states.

## Architecture

Generalize the existing small-screen menu into a compact-navigation
presentation that can also be activated by Focus reading on wider screens.
Render one navigation data model and equivalent semantic links in both the
persistent and compact presentations. Avoid fetching pages, rebuilding the
tree in client JavaScript, or introducing a Focus-reading-specific author
setting.

## Acceptance Criteria

- Enabling Focus reading on a tree-navigation page hides both persistent rails
  and exposes a compact navigation trigger.
- The trigger opens the complete active navigation hierarchy and identifies
  the current page and current section consistently with ordinary navigation.
- A reader can move to another page or section without first disabling Focus
  reading.
- Opening and closing the menu does not change content width, scroll position,
  or the dimensions of a visible wide table.
- Trigger, overlay, links, disclosure controls, filter, close behavior, focus
  order, `Escape`, and focus restoration work with keyboard input and
  appropriate accessible names.
- At small widths and high browser zoom, the compact presentation remains
  within the viewport and does not duplicate the existing mobile trigger.
- Without JavaScript, normal navigation remains present and every destination
  remains reachable.
- Browser coverage includes desktop, mobile, Light, Dark, Focus reading state
  persistence, long navigation trees, and transitions while scrolled within a
  page.

## Documentation Gate

This changes visible and interactive navigation. Update Focus-reading and
navigation documentation only after human review confirms the compact desktop
and mobile presentations.
