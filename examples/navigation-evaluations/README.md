# Navigation Evaluation Sites

These local-only comparison sites exercise Norna's navigation with page
structures derived from open-source sites built with competing documentation
generators. They are intentionally excluded from the canonical example-site
build and publication flow. Each directory records its source commit, license,
and adaptation boundary.

| Evaluation site | Hierarchy | Expected desktop page contents |
| --- | --- | --- |
| `vitepress-guide` | Shallow, two levels | Integrated below the current page in the left tree |
| `mkdocs-material-setup` | Mixed, up to three levels | Separate rail to the right of the page |
| `docusaurus-docs-guide` | Deep, up to four levels | Separate rail to the right of the page |

Start each site from its own directory by following its `README.md`. The sites
use ports 4350, 4351, and 4352, so they can run at the same time. Every page
provides a new-tab link to the corresponding live source page for direct
comparison.
