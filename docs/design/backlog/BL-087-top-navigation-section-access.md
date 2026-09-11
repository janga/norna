# BL-087: Direct Section Access From Top Navigation

## Status

Ready after
[BL-086: One consistent navigation contract in documentation](BL-086-consistent-navigation-reference.md);
fourth in the correction sequence for
[BL-083: Result-first single-page examples](BL-083-result-first-single-page-examples.md).
This is a feature addition, not an illustration correction.

## Problem

On a flat multi-page site, a reader must open a page before using its section
navigation. Top-level page links have no H2 disclosure; existing navigation
tests deliberately enforce that separation.

## Outcome And Interaction

Let readers choose a page or one of its H2 sections directly from top
navigation, using the heading data Norna already discovers.

- Keep the page name as a real page link. A separate, labelled chevron toggles
  a list of that page's H2 anchor links without loading the page.
- Give a page with one or more H2 headings a useful disclosure; omit empty
  controls for pages without H2. Do not infer children from H3 headings.
- Provide equivalent destination access in the compact menu. Preserve ordinary
  links and a usable no-JavaScript disclosure fallback.
- Define whether and when the current page also needs a separate section row;
  avoid accidental duplication while retaining clear current-position cues.
- Explicit `top` can already expose child pages. Keep those destinations
  reachable and distinguish them from local H2 links. Do not silently replace
  existing child-page menus.
- Scope the enhancement to top navigation. Preserve one-page section navigation
  and tree-navigation behavior, with no new configuration switch unless an
  unavoidable conflict is established.

## Acceptance And Verification

- Mouse, touch, and keyboard users can open a section on another page without
  first visiting its top.
- The link and disclosure have distinct accessible names and actions; expanded
  state, Escape dismissal, focus return, and anchor offsets are correct.
- Test zero, one, and several H2 headings, wrapped labels, base paths, explicit
  child-page menus, compact layouts, and no-JavaScript fallback.
- Update tests that deliberately asserted the old separation, replacing those
  assertions with tests of the new user behavior.
- Record the final separate-row and compact-menu rules, update their canonical
  documentation, and obtain human review before producing final illustrations.

## Reference And Downstream Work

Use the interaction pattern, not unreviewed sample code, from
[WAI: Disclosure navigation with top-level links](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/).

[BL-089: Navigation illustrations generated from runnable examples](BL-089-runnable-navigation-illustrations.md)
must demonstrate the resulting behavior rather than the old separate-row model.
