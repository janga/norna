# Add Norna To An Existing Project

Use embedded setup when the website should live inside an existing Node
project rather than in its own repository.

From the existing project root, run:

```sh
npx @janga/norna@latest init . --type embedded --site-dir presentation
npm install
npm run norna:dev
```

The arguments are intentionally different from standalone setup:

- `.` means that Norna should update the current project instead of creating a
  new project directory.
- `--type embedded` preserves the surrounding project's role and scripts.
- `--site-dir presentation` puts the site source in `presentation/` instead of
  the default `site/` directory.

Embedded setup adds `@janga/norna` as a project dependency and adds namespaced
`norna:*` npm scripts. It refuses to overwrite conflicting scripts or a
non-empty target site directory.

The surrounding project keeps its normal `build`, `test`, and deploy commands.
Use the added commands for the embedded site:

```sh
npm run norna:check
npm run norna:build
```

See [Commands](../commands.md) for the complete script list and
[Site Structure](../site-structure.md) for source and generated files.
