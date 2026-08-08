---
title: Guide
description: Learn the basic Project Name workflow.
navigation:
  label: Guide
  order: 10
sections:
  - id: quickstart
  - id: configuration
  - id: api
---

## Quickstart {#quickstart}

Install the package and run the default check against a source directory:

```sh
npm install project-name
npx project-name check ./src
```

The command exits with a non-zero status when it finds an issue, so it can run
unchanged in local scripts and CI jobs.

## Configuration {#configuration}

Project Name looks for a project config file at the repository root:

```js
export default {
	include: ['src', 'scripts'],
	reporter: 'summary',
};
```

Keep configuration small and explicit. Defaults should be good enough for a new
project, while advanced projects can opt into stricter behavior one setting at a
time.

## API {#api}

Use the API when checks need to be part of another tool:

```js
import { checkProject } from 'project-name';

const report = await checkProject({
	input: './src',
	reporter: 'json',
});

if (!report.ok) {
	process.exitCode = 1;
}
```

The API returns structured results so callers can decide whether to print a
summary, write a report file, or fail a build.
