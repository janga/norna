# BL-032: Improved examples for Add nested pages

## Outcome

Replace the fictional installation, Linux, and Windows file tree in `Add nested
pages` with an example based on the documentation hierarchy the reader is
currently using. The example should connect the source files to the navigation
visible on the same page.

## Dependency

Use this page as the first verification case for
[`BL-033`](BL-033-preset-driven-image-presentation.md). Do not finalize the
illustration by changing its aspect ratio solely to fit showcase-oriented image
geometry.

## Acceptance Criteria

- The file tree shows a representative part of the actual `Getting Started`
  page hierarchy.
- The surrounding text explains how that hierarchy becomes navigation.
- Essential relationships conveyed visually are also available to screen-reader
  users.

## Verification

Completed and visually approved. The **Add nested pages** section uses the
actual Getting Started category and page hierarchy, identifies the current
`content.md`, and explains the same file-to-navigation relationship in prose
and alternative text. Content, documentation-link, image, and site-build checks
cover the maintained source and illustration.
