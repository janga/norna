---
title: Project Name
description: A concise project site for an open source tool, library, or CLI.
navigation:
  label: Home
  order: 0
sections:
  - id: intro
    presentation:
      typography:
        preset: statement
  - id: links
  - id: install
  - id: example
  - id: features
  - id: when-to-use
  - id: next
---

## Project Name keeps project workflows predictable {#intro}

Project Name is a small open source tool for teams that want repeatable
results without adding a large platform. It provides one focused command-line
workflow and a compact JavaScript API for automation.

## Links {#links}

- [GitHub repository](https://github.com/owner/project-name)
- [Documentation](https://example.com/docs/)
- [Package](https://www.npmjs.com/package/project-name)
- [Issue tracker](https://github.com/owner/project-name/issues)

## Install {#install}

```sh
npm install project-name
```

Project Name supports current Node.js releases and works in local development,
CI jobs, and small publishing workflows.

## Example {#example}

```sh
project-name check ./src --format summary
```

```js
import { checkProject } from 'project-name';

const report = await checkProject({
	input: './src',
	format: 'summary',
});

console.log(report.status);
```

Use the CLI for everyday checks and the API when the same behavior belongs
inside a larger build script.

## Features {#features}

### Simple inputs

The project works with ordinary files and predictable commands.

### Scriptable results

The CLI prints human-readable summaries while the API returns structured data
for automation.

### Small surface area

There are only a few concepts to learn, so the project stays easy to adopt and
easy to replace.

## When to use it {#when-to-use}

- Validate repository conventions before a pull request is reviewed.
- Reuse the same checks locally and in CI.
- Add a focused command to an existing project without introducing a service.
- Expose a small API for downstream tooling.

## Next steps {#next}

Read the [guide](/guide/) for configuration options and a longer example, or
open the repository to inspect the implementation.
