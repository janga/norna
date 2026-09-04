---
page:
  description:
    Answers about choosing a Norna site-project structure and keeping its dependencies reproducible.
---

# Norna project setup

Here, a **project** means the technical workspace that contains a Norna site's
files, npm configuration, and version history. It does not mean the artwork,
research, commercial work, or other subject presented on the website.

## How do standalone and embedded Norna projects differ? {#add-norna-to-an-existing-project}

Use a standalone project when the website is the repository's main purpose.
Use an embedded project when the Norna site should live beside an existing
application, library, or CLI. Both models install Norna locally and use the
same site files; they differ in which project owns the top-level commands.

**Standalone project**

The normal initialization command creates a new project directory:

```sh
npx @janga/norna@latest init my-site
```

After `npm install`, the relevant structure is:

```text
my-site/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── package.json
├── package-lock.json
└── site/
    ├── config.yaml
    ├── theme.yaml
    ├── sitewide-content.yaml
    ├── pages/
    │   └── 000-home/
    │       ├── content.md
    │       └── images/
    └── public/
```

Because this repository is only a Norna site, `package.json` may provide short
aliases as well as the namespaced scripts:

```json
{
  "scripts": {
    "dev": "npm run norna:dev --",
    "norna:dev": "norna dev:local",
    "norna:check": "norna check",
    "norna:build": "norna build",
    "build": "npm run norna:build"
  }
}
```

**Embedded project**

Run embedded initialization from an existing project root:

```sh
npx @janga/norna@latest init . --type embedded --site-dir presentation
npm install
npm run norna:dev
```

The arguments differ from the standalone setup for specific reasons:

- `.` tells Norna to update the current project instead of creating a new
  project directory.
- `--type embedded` preserves the surrounding project's role and scripts.
- `--site-dir presentation` places the site source in `presentation/` instead of
  the default `site/` directory.

The existing project keeps its source, scripts, and directory structure:

```text
existing-project/
├── package.json
├── package-lock.json
├── src/
└── presentation/
    ├── config.yaml
    ├── theme.yaml
    ├── sitewide-content.yaml
    ├── pages/
    │   └── 000-home/
    │       ├── content.md
    │       └── images/
    └── public/
```

Norna preserves existing commands such as the surrounding project's `build`
and adds namespaced scripts that select `presentation/` explicitly:

```json
{
  "scripts": {
    "build": "node build-app.mjs",
    "norna:dev": "norna --site-dir presentation dev:local",
    "norna:check": "norna --site-dir presentation check",
    "norna:build": "norna --site-dir presentation build"
  }
}
```

Norna also adds `@janga/norna` as a project dependency. It refuses to overwrite
conflicting scripts or a non-empty target site directory.

The surrounding project keeps its own `build`, `test` and deployment commands.
Use the namespaced commands for its Norna site:

```sh
npm run norna:check
npm run norna:build
```

See the full references for
[commands](https://github.com/janga/norna/blob/main/docs/commands.md) and
[site files](https://github.com/janga/norna/blob/main/docs/site-files.md).

## Why should I commit package-lock.json to Git? {#why-commit-package-lock}

`package-lock.json` records the exact Norna and dependency versions installed
for a site project. Committing it gives everyone working on that site, on their
different computers, the same version record. Automated builds such as GitHub
Actions receive that record too.

Commands such as `npm ci` use the lockfile to install those recorded versions.
This makes local and automated installations reproducible and avoids a later
install unexpectedly selecting different compatible dependency versions.

Commit `package.json` and `package-lock.json` together whenever the project's
Norna version or other dependencies change.
