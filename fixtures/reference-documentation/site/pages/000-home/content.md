---
page:
  description: Three reference pilots for reviewing Norna's documentation structure and writing.
---

# Reference review

## Scope of this draft

These pages describe the local Norna 0.7.26 implementation. On 15 September
2026, npm still reported 0.7.25 as its latest release. The draft is not yet a
replacement for the published reference.

The proposed Reference section has five branches: Site model, Configuration,
Content syntax, Commands, and Reader behavior. This small review site keeps
four pilots at its top level so they are easy to find. The final site would
keep Getting Started, Examples and FAQ alongside Reference rather than mixing
their different purposes into each entry.

## Review four kinds of answer

| Page | Question to answer from the reference |
| --- | --- |
| [Appearance](/appearance/) | Why does a reader still see Light after the site owner chooses dark? |
| [Sidenotes](/sidenotes/) | Can one paragraph have two notes, and where will they appear? |
| [page:move](/move/) | What changes, what remains untouched, and when will the command refuse a move? |
| [URLs and links](/urls-and-links/) | How do I link to a page and retain an old URL without moving it? |

These links select review tasks, not a proposed overview page for the final
reference. The complete structure and coverage assessment remain maintainer
documents until approved.

## What this review decides

Assess whether each page can be used as an independent lookup: terminology
introduced before use, exact syntax, understandable defaults, and constraints
close to the example. The examples use existing Norna rendering, not new UI.

Approval of these pilots establishes a writing and organization pattern. It
does not certify coverage of the remaining reference, which will be verified
area by area during the full rewrite.
