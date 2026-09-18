# BL-124 Share navigation visibility semantics

## Purpose and evidence

Keep automatic menu following and prototype markers/disclosures consistent about
whether an element is displayed. The assessment at `ff1701f` found identical
predicates named `isDisplayed` in `src/lib/navigationFollowing.ts` and `visible`
in `src/lib/navigationPrototype.ts`. Both account for native details whose closed
content can retain geometry.

See [BL-123 Navigation JavaScript refactoring assessment](BL-123-navigation-javascript-refactoring-assessment.md#1-share-the-existing-visibility-predicate).
This is a low-risk, behavior-preserving extraction; no smoother animation or
performance improvement is claimed.

## Bounded change

Extract that exact predicate into one internal helper with a name that describes
being displayed, such as `isNavigationElementDisplayed`. Import it at the current
runtime call sites. Preserve setup timing, requestAnimationFrame scheduling,
ancestor traversal and native-details summary handling.

Do not redefine it as viewport intersection, pointer hit testing or keyboard
focusability. Do not replace all other visibility checks across the application,
change early inline restoration, or introduce a generic DOM utility framework.

## Behavior and verification

- Open content and a closed disclosure's own summary remain displayed.
- Content inside any closed ancestor disclosure remains excluded, including
  when layout rectangles are still reported.
- CSS-hidden and geometry-free elements remain excluded.
- An element outside the viewport can still be displayed; following needs that
  distinction to reveal it.
- Automatic following still leaves focus, document position and URL unchanged;
  prototype markers and disclosure reversal retain their behavior.

Use relevant cases from `tests/navigation-following.spec.ts` and
`tests/navigation-prototype.spec.ts`, adding only missing contract cases with
real browser geometry. Follow the registered navigation review command for the
normal suite. Verify the opt-in build resolves the shared helper; do not run the
complete release chain solely for this extraction.

The user has approved the existing visual behavior. This item preserves that
baseline; a changed visual result requires local review under the normal rules.
Complete and commit this item separately before starting the next backlog item.
