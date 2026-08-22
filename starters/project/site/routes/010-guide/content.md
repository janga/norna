---
title: Guide
description: Adapt this compact guide for normal project use.
navigation:
  label: Guide
---

## Quickstart {#quickstart}

Show the shortest path from installation to a useful result.

```sh
<install command>
<first useful command>
```

Briefly explain what happens and what the user should expect.

> Example:
>
> ```sh
> npm install checkline
> npx checkline
> ```
>
> The command runs the default project check and prints a short result in the
> terminal.

## Configuration {#configuration}

Include this section only if configuration is relevant. Explain when
configuration is needed and show the smallest realistic example.

```js
export default {
	// project-specific options
};
```

If the project works well without configuration, say so.

> Example: Checkline can run without configuration. Add a config file only when
> the default paths or command behavior need to change.

## Using `<Your project>` {#usage}

Show one slightly more complete example of the normal workflow. The purpose is
to demonstrate typical use, not every available command or option.

> Example: A project might keep the command in `package.json`:

```json
{
  "scripts": {
    "check": "checkline"
  }
}
```

```sh
npm run check
```

## `<API / Commands / Integration / Deployment>` {#topic}

Choose the topic that best fits the project. For a library this may be `API`;
for a CLI it may be `Commands`; other projects may need `Integration`,
`Deployment`, or something else.

For example, if a JavaScript API is relevant:

```js
import { check } from 'checkline';

const result = await check();
```

Keep the example deliberately small. Detailed reference documentation can live
elsewhere as the project grows.
