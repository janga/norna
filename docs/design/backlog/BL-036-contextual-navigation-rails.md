# BL-036: Contextual Navigation Rails

## Outcome

Norna keeps a stable site-wide top navigation while showing a persistent
desktop tree rail only where the active top-level branch has enough hierarchy
to require one. A deep documentation area must not force unrelated landing
pages or simple top-level pages into the same tree layout.

## Dependency

Implement after `BL-035`, which establishes the visual and geometric contract
for pages with and without a tree rail.

## Design Contract

- Keep listed top-level pages and categories in one stable top navigation.
- In `automatic` mode, resolve the desktop tree rail from the active top-level
  branch rather than from the maximum depth of the complete site.
- Show the rail on a branch landing page and its descendants when that branch
  contains listed child pages, navigation categories, or a heading hierarchy
  that cannot be represented clearly by top navigation alone.
- Omit the rail from Home and from independent top-level pages whose local
  structure can use the existing page navigation.
- Scope the desktop rail to the active branch. Do not repeat unrelated
  top-level destinations that remain available in the top navigation.
- Keep the complete site hierarchy reachable from the mobile navigation; a
  narrower desktop rail must not make destinations disappear on small screens.
- Preserve explicit `sections`, `top`, and `tree` modes as site-wide overrides.
  The contextual behavior changes only `automatic` mode.
- Resolve page presentation, section-surface compatibility, breadcrumbs, and
  section tracking against the page's effective navigation mode.
- Render all destination links and disclosure structure in HTML. JavaScript may
  enhance expansion state but must not be required to reach a page.

## Acceptance Criteria

- A site can combine Home, simple top-level pages, and a deeply nested
  documentation branch without showing the desktop tree rail everywhere.
- Entering the nested branch introduces the rail without changing the global
  top navigation; leaving the branch removes it.
- The branch landing page and every descendant expose the same local hierarchy
  and current-page context.
- The rail never contains unrelated top-level branches.
- Breadcrumbs, active states, direct URLs, keyboard navigation, mobile
  navigation, no-JavaScript navigation, and Focus reading remain coherent.
- Top, tree, mobile, Light, Dark, short-page, and long-page cases have browser
  regression coverage.
- No page-level navigation switch is added to author configuration.

## Reference

Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
separate broad Design destinations in the top navigation from the contextual
hierarchy in the left rail. Norna should apply that separation more selectively:
a deep branch may require a local rail without imposing the rail on independent
top-level pages elsewhere on the same site.
