# BL-119 Direct-hash positioning in static previews

## Problem

Opening `/media/#image-stacks` directly in the built top-navigation fixture
does not reliably position the target heading at the sticky-header boundary.
The direct-hash test in
[`tests/navigation-preview.spec.ts`](../../../tests/navigation-preview.spec.ts)
fails, while the four tests that click section links pass.

## Reproduce

From the engine repository root, use an isolated build directory:

```sh
NORNA_SITE_DIR=fixtures/top-navigation/site \
NORNA_INTERNAL_STATE_DIR="$PWD/.local/hash-position-review/.norna" \
NAVIGATION_PREVIEW_ROUNDS=1 \
npm run test:navigation:preview
```

The runner builds the fixture and starts the static preview on port `4322`;
stop any existing review server using that port first.

## Evidence and scope

The failure was reproduced on 2026-09-16 with Node `26.7.0` and the dependencies
locked for Norna `0.7.27`. It also occurred with the original preview runner
from release commit `f4aa03c`, before the browser-server cleanup correction.

Observed measurements include a mobile heading `8.09px` behind the header,
against a `4px` tolerance, and a desktop heading `8.06px` below the header when
the page still had room to scroll. Determine whether initial layout, scroll
restoration, or test synchronization causes the differing results before
changing the layout or assertions. The preview suite is separate from the
`npm test` release chain.

## Completion criteria

- Direct hash loads and section-link clicks reliably leave the target heading
  visible at the intended header boundary on the four supported viewports.
- Preserve the heading-visibility assertions and real anchor links.
- If the correction changes visible navigation behavior, follow the normal
  local visual review workflow before committing it.
