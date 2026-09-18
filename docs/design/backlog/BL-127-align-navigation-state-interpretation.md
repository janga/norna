# BL-127 Align early and deferred navigation state interpretation

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
