---
page:
  description: Read the derived page-tree report and distinguish content errors from editorial recommendations.
---

# Navigation review

`navigation:review` reports the hierarchy derived from source files. It never
rewrites pages, headings, categories, links or configuration.

```sh
npm exec -- norna navigation:review
npm exec -- norna navigation:review --format json
```

`--format text|json` selects output; text is the default. The JSON report has
`schemaVersion: 1`, includes its thresholds, and has no timestamp, so unchanged
inputs yield stable output for comparison.

## Report contents

The report counts pages, categories, top-level branches, visible levels and the
widest sibling group. It gives branch counts, each page's H2/H3 counts,
resolved incoming/outgoing page links and effective navigation mode, and each
category's total/listed direct children.

A top-level branch is Home or a listed root entry together with its listed
descendants. An unlisted page excludes its descendant subtree from navigation
measurements but remains in the page inventory. Resolved page links reach a
current page directly or through an alias; checked internal references also
include headings, category destinations and public files.

## Errors and recommendations

Shared link/navigation errors produce a nonzero exit status. Observations and
recommendations are advisory and leave the command successful. Review is
suggested for:

- a category with exactly one listed direct child;
- a branch with four or more visible levels;
- a sibling group with ten or more listed entries;
- a page with eight or more H2 sections.

These thresholds do not require splitting pages or flattening the hierarchy.
Use them to find places where the organization may deserve a reader's review.
[Navigation configuration](/reference/configuration/navigation/) defines how
the site actually renders the tree and page contents.
