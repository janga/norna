# Backlog Process

`BACKLOG.md` is the prioritized index of unfinished Norna work. This directory
contains detail only for items that need a durable scope, dependency record, or
acceptance criteria before implementation.

## Queue Structure

- `Now` contains at most three implementation-ready items in exact order.
- `Next` is an exact technical implementation sequence, not a value ranking.
- `Documentation Follow-ups` tracks documentation debt for implemented
  behavior.
- `Needs Decision Or Evidence` contains ideas that must not enter the ordered
  queue until a concrete need or missing design decision is resolved.
- `Explicitly Deferred` records deliberate product boundaries.

## Status Terms

- **Ready:** The first scope and its dependencies are sufficiently defined.
- **Ready after `BL-NNN`:** The item is defined but must follow the named work.
- **Needs decision:** A product or architecture choice blocks implementation.
- **Needs evidence:** Real usage must demonstrate that the added model is worth
  its permanent cost.
- **Deferred:** Do not schedule without a separate product decision.

## Item Rules

Every item has a stable `BL-NNN` identifier. Never reuse an identifier after an
item is completed or removed. Keep the index entry to one outcome-focused
sentence. Put substantial rationale and acceptance criteria in a matching file
in this directory.

Before adding an item, check for an existing item with the same user outcome.
State dependencies explicitly and place the item after them. Do not put routine
quality expectations, current limitations, architecture contracts, or release
checklists in the queue; those belong in agent instructions or canonical
maintainer documentation.

When an item is complete, remove it from `BACKLOG.md` in the implementation
commit. Preserve the identifier in the commit message or pull request. Git
history is the completion log; do not maintain a growing `Done` section.
