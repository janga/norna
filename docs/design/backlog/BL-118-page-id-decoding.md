# BL-118: Page ID decoding for valid slugs

## Status

Complete. Implemented and verified on 2026-09-16.

## Outcome

Build pages with valid slugs such as `page-move`, including when an ancestor
directory contains that spelling.

## Reproducer and evidence

During [BL-117: Canonical web reference](BL-117-canonical-web-reference.md),
a page in `010-page-move/content.md` passed content validation but failed the
Astro build with "Page entry ... has no valid page directory". Both relative
and absolute site selection reproduced the failure.

`src/lib/sitePages.ts` took the last `-page-` marker in the encoded content ID.
The same substring in the page directory was mistaken for the generated prefix
boundary. See the [reference inventory](../reference-inventory.md#reproduced-engine-defect-not-a-documentation-rule).

## Acceptance

Decode the generated prefix independently of the valid page-directory text.
Add focused regression cases for `page-move`, a child below such a directory,
and ordinary slugs. Verify a minimal fixture build. Do not add a new public
slug restriction or require users to rename valid source folders.

## Resolution and verification

Content-ID generation and decoding now share the selected site's exact prefix
through `scripts/lib/page-model.mjs`. Decoding removes that prefix before
validating the complete page-directory path. Existing generated IDs and public
URLs stay unchanged.

- `npm run test:page-model` covers ordinary and nested paths, repeated `-page-`
  text in site and page names, numeric suffixes that resemble valid page
  directories or Home, and rejection of malformed or foreign-site IDs.
- `npm run test:fixture:build` validates and builds a copied minimal fixture
  with relative and absolute site selection. It checks page titles and sitemap
  URLs for affected pages, page/category descendants and the actual homepage.

The [page naming reference](../../../site/pages/032-reference/pages/010-site/pages/020-pages/content.md#names-and-order)
already describes the supported names. This fix restores that contract without
adding a new syntax rule.
