# BL-088: Child-Page Lists That Help Readers Choose

## Status

Ready; fifth in the correction sequence for
[BL-083: Result-first single-page examples](BL-083-result-first-single-page-examples.md).
This is an example correction using existing `page-list` behavior.

## Problem

The current screenshot mostly repeats destinations already visible in the
left navigation and includes regression-fixture prose. It demonstrates that a
list exists without showing why a reader would need it.

## Outcome And Scope

Demonstrate a meaningful choice whose alternatives need more explanation than
their navigation labels provide. A suitable example is choosing an installation
method with different prerequisites, followed by the relevant child pages.

- Use a parent introduction that helps independently of the navigation tree.
- Let each child's H1 and `page.description` explain the option and its use;
  derive membership and order with the existing empty `page-list` block.
- Show the source needed to reproduce the result, including relevant child
  metadata and structure. Avoid implying that the block itself contains manual
  labels or descriptions.
- Explain briefly that a category is preferable when the proposed page only
  repeats navigation. A list is useful when its context helps readers choose.
- Use a runnable representative example and a faithful screenshot if its
  structure cannot be demonstrated directly on the flat Examples page.
- Keep test instructions and internal fixture vocabulary out of the published
  capture; do not invent new list configuration or category rendering.

## Acceptance And Verification

- Readers can identify the decision the list supports from its content alone.
- The screenshot or live result and source agree on titles, descriptions,
  destinations, and ordering.
- The example remains useful with the left tree visible and on compact screens.
- Link directly to `docs/content.md#child-page-list`; preserve the rule that
  only listed direct child pages are included and categories are not pages.
- Validate and render the source, check its links, and request human review of
  the revised example without rerunning unrelated engine tests.

## Related Work

The existing capability is tracked in
[BL-007: Explicit child page list](BL-007-child-page-list.md).
This item changes its demonstration, not the page-graph contract.
