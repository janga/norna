# Category Destination Fixture

Non-public review and regression source for BL-112: Category Destinations.

- `/getting-started/` redirects to its first direct content page.
- `/guides/` lists direct children without jumping through Installation.
- `/guides/installation/` redirects to Requirements after that branch is chosen.

Prepare with `npm run review:scratch -- prepare --from fixtures/category-destinations/site --replace`,
then `npm run review:start -- scratch`. The URL prefix is `/category-review/`.
Keep the category-page model out of the editorial page collection and preserve
tree and compact-menu disclosure behavior.

Run the focused browser checks with:

```sh
node scripts/test-navigation.mjs --site-dir fixtures/category-destinations/site tests/category-destinations.spec.ts
```

These verify redirects, direct-child links, and tree disclosure with and
without JavaScript. Unit and static-build coverage lives in
`scripts/test-site-link-graph.mjs` and `scripts/test-nested-pages.mjs`.
