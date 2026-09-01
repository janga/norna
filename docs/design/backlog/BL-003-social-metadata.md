# BL-003: Social Sharing Metadata

## Outcome

Shared Norna page URLs expose useful engine-owned title, description, canonical
URL, and preview-image metadata without per-page presentation code.

## Dependency

Implement after `BL-001` so canonical page URLs use the shared URL contract.

## First Scope

- Use each page's H1 title, explicit optional description, and canonical URL.
- Discover one conventionally named site-wide social image under `public/`.
- Omit unavailable optional metadata rather than deriving uncontrolled prose.
- Defer page-specific social images and generated text-on-image cards.

## Acceptance Criteria

- Home, top-level, nested, and base-path pages emit correct absolute metadata.
- Missing descriptions and images have documented omission behavior.
- Image filename, allowed format, and collision rules follow existing public
  asset conventions.
- Metadata is covered by rendered-HTML tests.
