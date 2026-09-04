# BL-037: Refine Left-Navigation Visual Hierarchy

## Outcome

Improve the hierarchy, density, active state, and overall visual coherence of
Norna's existing left page rail. Use Linear Docs as a quality reference while
preserving Norna's current navigation model, palette ownership, responsive
behavior, and accessibility contract.

## First Scope

- Refine indentation, disclosure controls, branch relationships, and active-page
  emphasis without changing which destinations the rail contains.
- Keep page and category labels readable at every supported nesting depth.
- Preserve stable horizontal and vertical layout while branches open, close, or
  become current.
- Derive every color, border, focus state, and hover state from the active
  palette rather than adding component-specific colors.
- Keep links and disclosures distinct for pointer, keyboard, and screen-reader
  users.
- Preserve the existing mobile hierarchy; this item concerns the persistent
  desktop page rail rather than a new navigation model.

## Acceptance Criteria

- Parent-child relationships and the current page can be identified without
  relying on color alone.
- Focus indicators meet the existing palette contrast contract and are not
  clipped by the independently scrolling rail.
- Opening or closing one branch does not unexpectedly close another branch or
  move the document column.
- Long labels wrap without colliding with disclosure controls or adjacent
  hierarchy levels.
- The rail remains independently scrollable on short and long pages.
- The no-JavaScript hierarchy remains complete and usable.
- Existing tree-navigation behavior and accessibility tests pass unchanged;
  desktop Light and Dark appearances receive human visual review before the
  item is completed.
