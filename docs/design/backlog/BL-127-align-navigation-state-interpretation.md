# BL-127 Align early and deferred navigation state interpretation

Completed on 2026-09-18. Shared interpretation preserves the approved navigation
behavior and aligns the three previously recorded abnormal-input differences.

## Purpose and evidence

Make the parser-time and later menu runtime interpret stored navigation state
consistently while retaining restoration before the first visible frame.
At `ff1701f`, the source-derived probes in
[BL-123 Navigation JavaScript refactoring assessment](BL-123-navigation-javascript-refactoring-assessment.md#3-early-and-deferred-state-decoding-already-differ)
found agreement for valid records and disagreement for malformed local JSON,
a JSON-null shared record, and a numeric string scroll position.

The probes establish inconsistent interpretation, not a reproduced visual flash
or proof that normal writes create these values. Aligning the abnormal-input
handling is a correction; it must not be hidden in cosmetic cleanup.

## Dependency

Complete [BL-126 Resolve prototype history restoration discrepancy](BL-126-prototype-history-restoration.md)
before changing restoration ownership. Preserve the approved prototype commit
as a reference and keep this work separate from the preceding small helpers.

## Bounded change

Characterize the existing deferred decoder in `TreeNavigationScript.astro` as
the reference behavior, including its numeric coercion, invalid-record handling
and distinction between an absent and an existing shared record. Apply the same
interpretation during early restoration. A different final-state fallback policy
would be another behavior change, outside this item.

Share key construction, normalization and explicit disclosure decisions through
source that can serve both execution phases. Generate or embed the early code
from that source; do not replace it with a deferred import. Keep the early
parser-time call, initialized-branch guard, child-list observation through
DOMContentLoaded and `pagereveal` refresh. Keep later state persistence,
desktop/mobile synchronization and temporary filter snapshots in the runtime.

Early and later scrollport measurements remain separate calls. The early call
must establish the scroll limit before restoring scrollTop; later observers
handle notices, fonts, viewport changes and restored pages. Sharing the formula
is optional. Do not start resizing the menu on document scroll.

## Behavior and verification

- Characterize valid, absent, malformed and JSON-null records, numeric/string
  scroll values, non-boolean section values and unavailable storage.
- Compare the actual emitted early code with the shared runtime interpretation;
  testing a second handwritten model would not prove parity.
- Preserve current ancestors, explicit current-page/outline choices, separately
  scoped scroll positions and the existing serialized storage format.
- Verify initial frames and the first menu clicks after global navigation,
  deep menu scroll, the reachable menu end, desktop/mobile synchronization,
  filtering, interrupted motion, history and reduced motion.
- Use local human inspection for first-frame continuity, especially Safari,
  then the relevant focused browser checks and build verification.

Risk is medium to high because execution timing is observable even if the
decoded state is unchanged. Commit independently. Do not add a client router,
unify all scrolling responsibilities or change the default prototype gate.

## Implementation on 2026-09-18

`src/lib/navigationState.mjs` now owns storage keys, record normalization,
local/shared selection and the decisions to open page branches and page
outlines. The deferred runtime imports its self-contained factory. The early
script embeds that same factory through `navigationStateScript.mjs`, so it
still executes while the HTML parser constructs the tree. The factory and
early entry point must not capture module-scope values: their emitted source
runs without imports.

The parser observer, initialized-branch guard, `DOMContentLoaded` disconnect,
`pagereveal` refresh and early scroll-limit measurement retain their previous
order. Persistence, cross-menu events and filter snapshots stay in
`TreeNavigationScript.astro`. Later scrollport measurements stay in
`navigationPrototype.ts`.

The deferred behavior was characterized before extraction. Normal records keep
their existing meaning. These abnormal inputs now have the same interpretation
in both phases:

| Stored input | Shared interpretation |
| --- | --- |
| Malformed local JSON with a valid shared record | Apply the shared disclosures; use no local scroll offset. |
| An existing shared record containing JSON `null` or malformed JSON | Use empty shared disclosures instead of falling back to local disclosures. Current ancestors and default current-page outlines still apply. |
| A finite numeric scroll string, such as `"240"` | Decode it as a number; restore it only when positive. |

The existing numeric coercion and boolean-only outline values are preserved.
The ordinary navigation still opens the current page and outline on arrival.
The opt-in prototype retains explicit current-page and outline choices.
Desktop and mobile keep separate scroll positions and share disclosures under
the existing storage keys and serialized shape.

## Verification checkpoint

- Before extraction, 19 characterization cases passed against the actual
  deferred component, executed with minimal DOM/storage stubs.
- After extraction, `npm exec -- playwright test tests/navigation-state.spec.ts`
  passed all 21 interpretation and lifecycle cases then present. They compare
  the generated early script with the actual deferred component, including
  unavailable storage, current ancestors, explicit choices and scoped writes.
- The opt-in build using
  `NORNA_NAVIGATION_PROTOTYPE=1` and
  `NORNA_INTERNAL_STATE_DIR="$PWD/.local/navigation-prototype/state-aligned-build/.norna"`
  with `npm run build` passed: 78 pages and 68 indexed pages.
- `NORNA_NAVIGATION_STATE_PAGE=.local/navigation-prototype/state-aligned-build/.norna/dist/reference/site/pages/index.html npm exec -- playwright test tests/navigation-state.spec.ts --grep 'built inline scripts'`
  passed. This additional case executes both scripts extracted from the actual
  built HTML against the characterized inputs, checking the serialization
  boundary after bundling rather than rechecking only the module source.
- The three opt-in prototype cases selected with `--grep 'before deferred scripts'`
  passed. They hold external scripts, assert the early restored state, release
  the scripts and assert the final state. They cover the three differences above.
  An initial 1200px test also triggered the existing section-following behavior,
  which reveals an off-screen current row. These interpretation checks now use
  1440px so the right rail owns section following. Position assertions were not
  relaxed, and no runtime change was made to section following.
- `NORNA_NAVIGATION_PROTOTYPE=1 node scripts/test-navigation.mjs --site-dir site tests/navigation-prototype.spec.ts --grep-invert 'before deferred scripts'`:
  18 passed; one history case timed out during a documented system sleep.
  The focused repeat with `--grep 'Back and Forward with no-preference'` passed
  without changing implementation or assertions. Together with the three
  delivery cases, all 22 prototype cases passed. Coverage includes first
  arrival frames and clicks after global navigation, deep scroll, the menu end,
  desktop/mobile sharing, filter snapshots, interrupted motion, history and
  reduced motion.
- `npm run review:test -- navigation`: 61 passed; two cases timed out during
  another documented system sleep. The focused repeat,
  `node scripts/test-navigation.mjs --site-dir fixtures/nested-pages/site tests/navigation-tree.spec.ts tests/navigation-following.spec.ts --grep 'aligns breadcrumbs|shallow left outline.*follows forward and backward'`,
  passed both cases without changes. All 63 cases are therefore verified,
  although the original aggregate command did not exit successfully. The
  registered review wrapper does not accept `--grep`; the focused repeat used
  its underlying test runner.

The timeouts coincided with macOS power-log entries: clamshell sleep at
16:58:07 CEST for 52 seconds, then maintenance sleep at 16:59:44 for 72 seconds.
The two simultaneous Chromium traces show roughly 70-second gaps during page
arrival, matching the second sleep. These are recorded as interrupted test
runs, not passing aggregate runs or reasons to relax timeouts.

The accepted local prototype and the separately approved history correction
provide the behavior baseline for this extraction. Registered scratch captures
at desktop/dark and mobile/light were inspected after the change; their layout
is unchanged. First-frame and interaction regressions are measured separately
from those static captures. No new native Safari measurement is claimed.
The existing initial Vite module-import warning remains a separate known
development-server observation; the emitted build checks passed. A release-wide
`npm test`, fresh native-browser matrix and prototype promotion were intentionally
not performed for this bounded extraction.
