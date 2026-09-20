# BL-137: VS Code Image Usage And Removal Review

## Purpose

Show where a page image is used and let the author understand the effect of
removing it. This is step 5 of the
[VS Code Files And Images track](../vscode-authoring-track.md).

**Status: Needs decision; outline for later visual discussion.**

## Scope And Boundaries

Add usage discovery, navigation to actual content references and contextual
information to the existing image-removal action. Reuse managed-image
reference resolution, including page ownership and unsaved content. A filename
alone is not a site-wide image identity.

Automatic rewriting of referring content, bulk cleanup, general inbound-page
link analysis and a compulsory ban on deleting referenced images are not
assumed requirements. Public/external images require an explicit scope choice
instead of being silently treated as managed page images.

## Decisions Made

Discuss this after local theme creation/removal. Basic file removal remains
the earlier capability; this item adds author understanding of its effects.
Present visual proposals before deciding whether a warning, confirmation or
restriction is appropriate.

## Preliminary Proposals

- Offer an image-usage action with references that open the relevant source
  passage, distinguishing multiple uses and different owning pages.
- Show concrete consequences at removal and let the author make an informed
  choice. Recheck changed source before acting on an earlier result.
- Distinguish zero detected references from analysis that could not complete.
  Keep literal examples separate from real image-block references.

## Open Questions

Show and discuss where usage results belong, how to proceed when references
exist, and what happens when invalid/unsaved content prevents a reliable
answer. Decide whether ordinary Markdown references are included in the first
scope, and state the resulting limits precisely.

## Dependencies

- Technical: image selection/removal from
  [BL-134 VS Code Image File Operations](BL-134-vscode-image-file-operations.md)
  and existing image-reference analysis.
- Track order: after
  [BL-136 VS Code Local Theme Creation And Removal](BL-136-vscode-local-theme-creation-removal.md).
  Image usage has no technical dependency on local theme operations.

## Candidate Verification And Documentation

Cover all supported image-block references, multiple uses, identical filenames
on different pages, ambiguous/misplaced files, unsaved additions/removals,
literal examples and invalid content. Exercise source navigation and removal
after source changes, plus cancellation and recovery. Verify that displayed
counts and locations match the stated scope. Document how to interpret the
results and their limits using the verified journey.

## Ready For Implementation When

The illustrated workflow is accepted, reference scope and uncertainty handling
are explicit, and the selected removal policy has concrete tests.
