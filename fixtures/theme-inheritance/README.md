# Theme inheritance fixture

Private regression/review input for BL-150. Covers branch modifications,
explicit preset replacement (including the same preset), homepage/page-only
isolation and generated search/error pages. Root palette/width overrides make
accidental ancestor leakage visible. Navigation uses the hierarchical model.

Use a physical scratch copy for manual review:

```sh
npm run review:scratch -- prepare --from fixtures/theme-inheritance/site --replace
npm run review:start -- scratch
```
