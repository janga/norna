---
page:
  description: Select the Norna installation and site directory, and find commands by their effects.
---

# Command invocation

Run Norna from a project with an installed `@janga/norna` dependency:

```sh
npm exec -- norna check
```

This uses the project's installed executable. A generated project also supplies
`norna:*` npm scripts, such as `npm run norna:check`. Those scripts are useful
for embedded sites because they retain the selected source directory.

## Executable selection

The optional global launcher, installed with
`npm install --global @janga/norna@latest`, allows `norna check` directly in a
shell. Inside a project that declares and has installed its own Norna
dependency, the launcher delegates to that local version. Otherwise the
invoked installation continues running. Use `engine:version` to see which
version is active.

`norna --help`, `norna -h` and `norna help` show the command list. Errors
produce a nonzero exit status. Individual commands differ in supported flags;
a command's reference defines its options.

## Site selection

The **project directory** contains package files; the **site directory** holds
Markdown, configuration and images. The latter normally is `site/`:

```sh
npm exec -- norna --site-dir presentation check
```

`--site-dir <path>` or `--site-dir=<path>` overrides `NORNA_SITE_DIR`.
Without either, Norna uses `site`. An empty environment value is an error.
The global option can occur before or after the command.

For a relative site path, Norna searches upward from the invocation directory
for a project containing that path and recognizable site files. If none is
found, it resolves the path from the invocation directory. With no explicit
selection, invoking directly inside a recognizable site selects that folder.
An absolute path selects that site directly and uses its parent as the project
directory. Use `doctor` to inspect the resolved paths before changing files.

`init` is different: its site path is relative to the **new target project**
and must not be absolute or contain `..`.

## Command map

| Task | Commands | Reference |
| --- | --- | --- |
| Create a project | `init` | [Project creation](/reference/commands/init/) |
| Add a page or group | `page:add`, `category:add` | [Page creation](/reference/commands/create/) |
| Move existing content | `page:move` | [Move a page](/reference/commands/move/) |
| Check and prepare images | `check`, `config:check`, `content:check`, `content:sync`, `images` | [Validation and image sync](/reference/commands/validate/) |
| Inspect structure | `navigation:review` | [Navigation review](/reference/commands/navigation/) |
| Manage local development | `dev`, `dev:local`, `dev:lan`, `dev:restart`, `dev:status`, `dev:logs`, `dev:stop`, `preview` | [Development and preview](/reference/commands/development/) |
| Prepare static output | `build`, `build:local`, `site:public`, `astro` | [Build and public output](/reference/commands/build/) |
| Inspect presentation | `theme:presets`, `theme:export`, `typography profiles`, `typography show` | [Theme inspection](/reference/commands/theme/) |
| Inspect or update installation | `doctor`, `engine:version`, `engine:update` | [Engine maintenance](/reference/commands/engine/) |
| Publish and monitor | `deploy`, `deploy:commit`, `deploy:watch` | [Publishing commands](/reference/commands/publishing/) |
| Audit an external source | `migrate:check` | [Experimental migration audit](/reference/commands/migration-audit/) |

`dev` aliases `dev:local`. `typography:profiles` and `typography:show` alias
their two-word forms.

## Project npm scripts

The starter prefixes Norna operations with `norna:` to avoid collisions with
the surrounding project's scripts. Most suffixes match the command. The
exceptions are `norna:sync` for `content:sync`, `norna:public` for `site:public`,
and `norna:dev` for `dev:local`. Typography scripts use the colon aliases.

Pass arguments after `--`, as in
`npm run norna:navigation:review -- --format json`. `init`, `page:add`,
`page:move`, `category:add`, `migrate:check` and `astro` have no generated npm
wrapper; invoke them through `npm exec -- norna`.

The standalone starter also supplies `dev` and `build` aliases. Embedded
initialization preserves existing project scripts: its `build` may produce a
larger combined artifact. Release, package, test and registered review scripts
in the Norna engine repository are contributor operations, not site CLI
commands.
