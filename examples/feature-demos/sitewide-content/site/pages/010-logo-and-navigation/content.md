---
page:
  description: See how a convention-based logo and page-title navigation work across a Norna site.
---

# Logo and navigation
The logo is discovered from `public/logo.svg`. The homepage Markdown H1
provides its alt text, and an optional top-level `logo` setting in
`sitewide-content.yaml` can adjust its displayed height.

The logo is a separate home link without a section menu. The homepage remains
the first ordinary navigation item and exposes its sections like any page.

## Navigation context {#navigation}

The page links come from the site's page structure. The shared logo returns to
Home, while the active page is indicated in the same navigation row.
