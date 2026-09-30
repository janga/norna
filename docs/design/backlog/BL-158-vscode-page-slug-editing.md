# BL-158: VS Code Page Slug Editing

## Purpose

Let authors change a page's slug through Properties and understand the effect
on its descendants, links and previous addresses before applying it.

## Decisions Made

Approved by the owner on 2026-09-30:

- Add slug editing to Properties, with a separate **Change address…** action
  and a preview before final confirmation. The homepage has no editable slug.
- **Preserve old addresses as aliases** starts checked. It applies to the
  selected page and every descendant whose URL changes.
- When unchecked, create no aliases for the old addresses of that whole
  subtree. Preserve existing aliases in either case. An existing alias that
  becomes its page's primary address is reclaimed, as in current moves.
- Authors may edit each page's alias list afterwards. There is no per-address
  selection list in this change.
- Preserve page titles and ordering. Update supported authored links using
  the shared engine transaction. Page-owned images and attachments move with
  their page; this does not add redirects for old resource URLs.

## Scope And Dependencies

Build on the implemented address planner, BL-153 Page Placement And Previous
Addresses, BL-154 Site Tree Context Actions and BL-157 Site Tree Addresses And
Paths. Keep the chosen project's engine authoritative. Expose the optional
alias choice only when that engine supports it.

Slug changes rename a directory and write affected files; metadata edits in
Properties remain normal buffer edits. Require separate application of those
operations so a slug change cannot discard unsaved form fields. Save affected
source edits before changing the address. Ordinary editor Undo does not
reverse the filesystem operation.

Existing move commands retain their current alias policy. Decoupled addresses
remain the separate BL-139 design topic.

## Acceptance And Verification

- Properties presents the current slug, new address preview and checked alias
  choice for a non-home page with a compatible engine.
- Both alias choices cover a parent with descendants and existing aliases;
  application honors the reviewed choice, updates links and preserves ordering.
- Cancellation, stale previews, invalid/conflicting slugs, a changed active
  site and unsaved edits produce no partial operation.
- Returning to a page's own previous address remains supported. Another page's
  address or alias stays reserved.
- Use focused engine address, form and adapter tests. The owner installs the
  VSIX and reviews the interface, including cancellation, dirty buffers and
  save/reopen behavior. Record manual checks as outstanding until reported.
