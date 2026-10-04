# BL-167: Keyboard Keys

## Purpose

Make keys and keyboard shortcuts easy to recognize in instructions, for
example Ctrl + C or Command + Shift + P.

**Status: Needs decision.** Separate design item requested on 2026-10-04.

## Scope And Boundaries

Cover individual keys, simultaneous combinations and sequences of keypresses.
The existing renderer passes `<kbd>` through; determine what presentation and
documentation Norna should guarantee. Operating-system shortcut translation
and interactive keyboard handling are outside this item.

## Decisions Made

The owner approved a separate brief under common HTML constructs. Syntax and
appearance remain open. Simple existing syntax may be sufficient.

## Preliminary Proposals

Start by evaluating `<kbd>` with consistent styling, then compare an
established Markdown shorthand only if it makes shortcuts easier to author.
Show key names, symbols and a multi-key shortcut under Examples.

## Open Questions

1. What distinguishes keys pressed together from keys pressed in sequence?
2. Should authors write platform-specific names themselves, including Ctrl,
   Command and Option, and how should these be read aloud?
3. How should long shortcuts wrap within prose, lists and tables?

## Dependencies

Use the existing `<kbd>` observations in the
[BL-161 audit](../common-html-authoring-audit.md). No new HTML policy is needed
if the work only documents and styles the existing element.

## Ready For Implementation When

The authoring form, combination/sequence rules and presentation are agreed,
with representative source/result examples and a focused rendering check.
