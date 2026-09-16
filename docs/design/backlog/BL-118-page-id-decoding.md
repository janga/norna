# BL-118: Page ID decoding for valid slugs

## Outcome

Build pages with valid slugs such as `page-move`, including when an ancestor
directory contains that spelling.

## Reproducer and evidence

During [BL-117: Canonical web reference](BL-117-canonical-web-reference.md),
a page in `010-page-move/content.md` passed content validation but failed the
Astro build with "Page entry ... has no valid page directory". Both relative
and absolute site selection reproduced the failure.

`src/lib/sitePages.ts` takes the last `-page-` marker in the encoded content ID.
The same substring in the page directory is mistaken for the generated prefix
boundary. See the [reference inventory](../reference-inventory.md#reproduced-engine-defect-not-a-documentation-rule).

## Acceptance

Decode the generated prefix independently of the valid page-directory text.
Add focused regression cases for `page-move`, a child below such a directory,
and ordinary slugs. Verify a minimal fixture build. Do not add a new public
slug restriction or require users to rename valid source folders.
