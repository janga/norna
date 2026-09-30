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

Page-move confirmation follows the decisions in BL-153, including its later
alias-preservation choice. Decoupled addresses remain the separate BL-139 design
topic.

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

## Implementation Evidence

2026-09-30: the engine address API accepts a boolean alias-preservation choice,
keeps its previous default, and records the choice in the reviewed plan.
All 13 focused engine address tests passed, including whole-subtree choices,
existing aliases, reclaimed addresses, updated attachment links and rejection
of a changed choice after planning.


Properties now offers the current slug, the checked alias-preservation choice
and **Change address…**, followed by an explicit final confirmation. Metadata
and slug edits apply separately. The homepage and older engines do not show
unsupported controls. The existing palette address command shares the guarded
application and updated confirmation, retaining its preserve-all default.

Further focused checks passed:

- `node --test editors/vscode/test/page-address-form-contract.mjs`: 10 cases,
  including cancellation, changed files/site, both alias policies and rollback
  after form closure.
- `node --test editors/vscode/test/page-address-form-browser.mjs`: real form
  input, checkbox values, keyboard activation, cancellation and error response
  in headless Chromium. Sandbox launch was blocked by macOS process permissions;
  the isolated test passed when run with the required process permission.
- Existing page-form, site-address-actions and site-tree adapter contracts.
- Package contract and `npm run test:documentation`. The documentation check
  exposed missing BL-155 attachment entries in the source-route index and
  `llms.txt`; those were corrected in a separate commit.

The owner handles installation and native review of **0.13.0**, including Undo
for metadata and dirty save/reopen behavior. Those manual checks have not been
performed here. No full release suite, push or publication was performed.

VSIX packaging passed for **0.13.0** at
`editors/vscode/norna-vscode.vsix`; the archived version and bundled code were
verified against the build output.

## Owner Approval

2026-09-30 at 16:30 CEST: the owner approved **BL-158 VS Code Page Slug
Editing** following evaluation build **0.13.0**. This closes the owner-review
follow-up above. Individual manual test results were not reported.
