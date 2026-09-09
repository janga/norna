# BL-070: Progressive Responsive Simplification

## Outcome

Keep responsive placement predictable when the available layout becomes
narrower. Automatic layout may preserve or simplify a peripheral placement,
but it must not restore that placement at a narrower width merely because
another interface region has disappeared.

## User Problem

Norna can move navigation, side notes, and explanatory image captions between
the reading flow and auxiliary screen regions. Independent fit calculations
can produce a sequence such as `below -> beside -> below` while the reader only
makes the viewport narrower. The content remains available, but the repeated
movement makes the layout harder to follow.

## Decided Contract

Use progressive responsive simplification for automatic placement changes:

1. Use the richest placement that fits in the complete wide layout.
2. Move information to a simpler placement when its original region no longer
   fits or remains available.
3. Keep the simpler placement through subsequent narrower automatic layout
   tiers.
4. Preserve source order, semantics, keyboard access, focus, and information in
   every tier.

An explicit reader action may recalculate placement. Focus reading may restore
a side note or image caption to a newly vacant margin because the reader asked
Norna to remove persistent navigation. Expanding the viewport may also restore
a richer placement.

The contract applies to information that moves between interface regions:

- a separate Page contents rail, the combined page tree, and compact
  navigation;
- a side note in the margin or in the reading flow;
- a persistent image caption beside a tall image or below it.

It does not prevent a table from using successively wider available layout
lanes before adding horizontal scrolling. It also does not prevent ordinary
fluid resizing, card-column reduction, or media from using space released by a
hidden navigation rail. Those changes do not move explanatory information
between peripheral and in-flow presentations.

## Implementation Scope

- Retain the responsive navigation behavior from `BL-068` and the monotonic
  deep-page sidenote behavior from `BL-069`.
- Prevent a deep page from promoting a below-image caption into the vacated
  Page contents lane at the intermediate layout tier.
- Continue to allow persistent image captions on shallow pages with a vacant
  end lane.
- Continue to allow Focus reading to restore a fitting persistent caption.
- Add no public setting and do not make engine breakpoints configurable.
- Add boundary-focused browser regression coverage for the affected placement
  states.

## Acceptance Criteria

- Deep navigation progresses from separate rails to a combined tree and then
  compact navigation without restoring a removed rail.
- A deep-page side note never follows `margin -> inline -> margin` while the
  viewport becomes narrower.
- A deep-page image caption never follows `below -> beside -> below` while the
  viewport becomes narrower.
- A shallow page may keep or lose a persistent side caption according to
  available space because no navigation region disappears into its end lane.
- Focus reading may place a fitting side note or image caption in a margin that
  the reader explicitly freed.
- JavaScript-free output retains every caption below its image and all
  navigation and note content in source order.
- No tested layout introduces document-level horizontal overflow.

## Verification

Exercise representative deep and shallow pages immediately above and below
the Page contents, persistent-caption, and compact-navigation boundaries. Test
normal and Focus reading modes, and retain the existing no-JavaScript checks.

Document the general responsive rule in the presentation guarantees. Explain
the concrete side-note rule in the content reference and the persistent-caption
rule in the image reference.
