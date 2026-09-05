# Getting Started

<p data-source-comparison><a href="https://vitepress.dev/guide/getting-started" target="_blank" rel="noopener noreferrer">Compare with the original VitePress page (opens in a new tab)</a>.</p>

## Try It Online {#try-it-online}

You can try VitePress directly in your browser on [StackBlitz](https://vitepress.new).

## Installation {#installation}

### Prerequisites {#prerequisites}

- [Node.js](https://nodejs.org/) version 22 or higher.
- Terminal for accessing VitePress via its command line interface (CLI).
- Text Editor with [Markdown](https://en.wikipedia.org/wiki/Markdown) syntax support.
  - [VSCode](https://code.visualstudio.com/) is recommended, along with the [official Vue extension](https://marketplace.visualstudio.com/items?itemName=Vue.volar).

VitePress can be used on its own, or be installed into an existing project. In both cases, you can install it with:

```sh
$ npm add -D vitepress@next
```

```sh
$ pnpm add -D vitepress@next
```

```sh
$ yarn add -D vitepress@next vue
```

```sh
$ bun add -D vitepress@next
```

```sh
$ deno add -D vitepress@next
```

VitePress is an ESM-only package. Don't use `require()` to import it, and make sure your nearest `package.json` contains `"type": "module"`, or change the file extension of your relevant files like `.vitepress/config.js` to `.mjs`/`.mts`. Refer to [Vite's troubleshooting guide](http://vite.dev/guide/troubleshooting.html#this-package-is-esm-only) for more details. Also, inside async CJS contexts, you can use `await import('vitepress')` instead.

### Setup Wizard {#setup-wizard}

VitePress ships with a command line setup wizard that will help you scaffold a basic project. After installation, start the wizard by running:

```sh
$ npx vitepress init
```

```sh
$ pnpm vitepress init
```

```sh
$ yarn vitepress init
```

```sh
$ bun vitepress init
```

You will be greeted with a few simple questions:

```
.
├─ docs
│  ├─ .vitepress
│  │  └─ config.js
│  ├─ api-examples.md
│  ├─ markdown-examples.md
│  └─ index.md
└─ package.json
```
```js
export default {
  // site-level options
  title: 'VitePress',
  description: 'Just playing around.',

  themeConfig: {
    // theme-level options
  }
}
```
```json
{
  ...
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs"
  },
  ...
}
```
```sh
$ npm run docs:dev
```
```sh
$ pnpm run docs:dev
```
```sh
$ yarn docs:dev
```
```sh
$ bun run docs:dev
```
```sh
$ npx vitepress dev docs
```
```sh
$ pnpm vitepress dev docs
```
```sh
$ yarn vitepress dev docs
```
```sh
$ bun vitepress dev docs
```
