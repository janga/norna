# BL-036: Contextual Page And Contents Rails

## Outcome

Norna keeps a stable site-wide top navigation while separating two local
navigation questions on complex desktop pages:

- the left page rail answers where the current page belongs in the site;
- the right contents rail answers where the reader is on the current page.

These rails appear only where the active top-level branch and current page have
enough structure to benefit from them. A deep documentation area must not force
unrelated landing pages or simple top-level pages into the same layout.

## Dependency

Implement after `BL-035`, which establishes the visual and geometric contract
for pages with and without a tree rail.

## Design Contract

- Keep listed top-level pages and categories in one stable top navigation.
- In `automatic` mode, resolve the desktop tree rail from the active top-level
  branch rather than from the maximum depth of the complete site.
- Show the left page rail on a branch landing page and its descendants when
  that branch contains listed child pages or navigation categories that cannot
  be represented clearly by top navigation alone.
- Omit the rail from Home and from independent top-level pages whose local
  structure can use the existing page navigation.
- Scope the left page rail to the active branch. Do not repeat unrelated
  top-level destinations that remain available in the top navigation.
- Keep pages and categories in the left rail. Do not insert the current page's
  H2 or H3 headings into that hierarchy.
- Show a separate right contents rail when the current page has enough H2 or
  H3 headings to make persistent local orientation useful. Do not include the
  page H1 or H4-and-deeper headings by default.
- Mark the current page in the left rail and the current reading location in
  the right rail without making either visual marker the only available source
  of orientation.
- Keep the complete site hierarchy reachable from the mobile navigation; a
  narrower desktop rail must not make destinations disappear on small screens.
- On small screens and at high zoom, reflow the rails into the existing mobile
  navigation or an in-flow local outline rather than requiring horizontal page
  scrolling.
- Preserve explicit `sections`, `top`, and `tree` modes as site-wide overrides.
  The contextual behavior changes only `automatic` mode.
- Resolve page presentation, section-surface compatibility, breadcrumbs, and
  section tracking against the page's effective navigation mode.
- Treat whole-rail hiding as a reading preference, not as the mechanism that
  makes deep hierarchies usable. Use branch disclosures, an independently
  scrollable rail, and later tree filtering for depth; Focus reading hides both
  rails when the reader wants an uncluttered canvas.
- Give the page rail and contents rail distinct accessible navigation names.
  Preserve native links, meaningful DOM and focus order, visible focus,
  `aria-current="page"`, and `aria-current="location"` as applicable.
- Scroll-driven location tracking must not move keyboard focus, alter browser
  history, or announce every change through a live region.
- Render all destination links and disclosure structure in HTML. JavaScript may
  enhance expansion state but must not be required to reach a page.

## Sidenotes And Media

- Keep each sidenote next to its reference in source and reading order.
- Never overlay sidenotes and the right contents rail or let one dynamically
  displace the other while the reader scrolls.
- When a right contents rail is present and no independent note lane fits,
  render sidenotes directly after their paragraph in the normal content flow.
- Treat a separate four-column layout for page rail, content, note lane, and
  contents rail as a possible later wide-screen enhancement, not a requirement
  of the first implementation.
- Keep `prose-aligned` and `centered-fit` semantics owned by `BL-033` and
  `BL-035`. Both persistent rails and their gaps are excluded from the central
  content canvas.
- A portrait `centered-fit` image remains centered in that central canvas. The
  right rail may reduce available media width but must not shift centering to
  the browser viewport or change caption alignment.

## Acceptance Criteria

- A site can combine Home, simple top-level pages, and a deeply nested
  documentation branch without showing the desktop tree rail everywhere.
- Entering the nested branch introduces its left page rail without changing
  the global top navigation; leaving the branch removes it.
- The branch landing page and every descendant expose the same local hierarchy
  and current-page context.
- The left rail never contains unrelated top-level branches or the current
  page's heading outline.
- A qualifying page exposes H2 and H3 links in a separately named right
  contents rail, with current-location feedback when enhancement is available.
- Pages too short to benefit do not receive an empty or redundant right rail.
- Breadcrumbs, active states, direct URLs, keyboard navigation, mobile
  navigation, no-JavaScript navigation, and Focus reading remain coherent.
- At 320 CSS pixels and browser zoom up to 400 percent, prose and controls
  reflow without horizontal page scrolling or loss of destinations.
- Sidenotes remain available in source order and fall into normal flow whenever
  a separate note lane cannot coexist with the contents rail.
- Portrait and landscape media using either image presentation remain inside
  and correctly aligned to the central content canvas.
- Top, tree, mobile, Light, Dark, short-page, and long-page cases have browser
  regression coverage.
- No page-level navigation switch is added to author configuration.

## Reference

Linear's [documentation](https://linear.app/docs/account-preferences) separates
the page hierarchy in a left rail from the current page's heading outline in a
right rail. Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
separate broad Design destinations in the top navigation from a contextual
hierarchy beside the content. Norna should combine these principles
selectively: a deep branch may require local rails without imposing them on
independent top-level pages elsewhere on the same site.
