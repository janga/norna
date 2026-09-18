# BL-126 Resolve prototype history restoration discrepancy

## Problem and evidence

The opt-in prototype's maintained WebKit case does not restore the reading
position after returning to a page originally entered through a fragment.
At reference commit `ff1701f`, the final position assertion in
`tests/navigation-prototype.spec.ts` is an explicit expected failure.

The recorded sequence is:

1. Open `/norna/reference/site/pages/#names-and-order` at 1440×1000.
2. After arrival settles, scroll 220px further and record the document position.
3. Follow the menu link to `/norna/reference/site/urls/`.
4. Go Back and compare the restored document position with the recorded value.

Prior probes saw the saved position at `pagereveal`, then movement to the fragment
by `load` without an intervening script scroll call. Installed Safari passed its
tested cached-history sequence. This difference does not establish a browser
bug, a Norna bug, or a runner bug by itself.

See [BL-120 Smooth documentation navigation prototype](BL-120-smooth-documentation-navigation-prototype.md#2026-09-17-history-limit-and-verification-boundary)
and [BL-123 Navigation JavaScript refactoring assessment](BL-123-navigation-javascript-refactoring-assessment.md#4-resolve-the-history-discrepancy-before-changing-arrival-ownership).
This is distinct from [BL-119 Direct-hash positioning in static previews](BL-119-static-preview-hash-positioning.md),
which concerns initial arrival in the ordinary top-navigation fixture.

## Bounded investigation and correction

Reproduce only this sequence first, comparing development and built output.
Record `pagereveal`, `load`, `pageshow.persisted`, navigation type, fonts,
hash and scroll writes. Distinguish cached-page restoration from a new document.
Use installed Safari as a separate comparison rather than substituting its
result for WebKit. Inspect first-load errors as well: the Vite import warning
in the prototype logs must not be assumed to cause the history discrepancy.

Change only the identified cause. If the runner is responsible, prove it with a
minimal case and correct the runner. If Norna is responsible, keep native history
and ordinary anchors unless evidence requires a narrower intervention. Do not
relax the one-pixel position assertion, swallow errors or introduce a blanket
user-agent workaround to get a passing run.

## Completion criteria

- The maintained reproducer passes without an expected-failure marker; the
  diagnosis explains the earlier Safari/WebKit difference or states the exact
  remaining environmental boundary.
- Direct fragments, Back/Forward, interrupted initial arrival, same-page anchors,
  search return and reduced motion retain their intended reading positions.
- Visible corrections receive local human review and focused verification.
  Promote the prototype to supported behavior only after this limit is resolved.
- Record the evidence and commit the correction separately from refactoring.

Ready for diagnosis after the completed assessment. Resolve before
[BL-127 Align early and deferred navigation state interpretation](BL-127-align-navigation-state-interpretation.md),
so restoration changes have a passing history comparison.
