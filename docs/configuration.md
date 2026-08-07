# Configuration

Technical site configuration lives in the selected site's `config.mjs`; by
default that is `site/config.mjs`. The file must default-export an object.

This document describes the generic configuration interface. It does not list
the current values for any one site.

## Site

### `site.url`

- Purpose: canonical public URL used in the page `<link rel="canonical">`,
  deploy monitoring output, and site-specific documentation.
- Type: string.
- Required: yes.
- Default: none.
- Validation: non-empty absolute URL accepted by `new URL()`.
- Consequence: wrong values render a wrong canonical URL and make deploy
  output point at the wrong site. For GitHub Pages project sites, include the
  repository path in the URL, for example `https://owner.github.io/repo-name/`.

Example:

```js
site: {
	url: 'https://example.com/',
}
```

### `site.basePath`

- Purpose: URL path prefix used for generated internal page links, favicons,
  generated image URLs, and root-relative links or images written in Markdown.
- Type: string URL path.
- Required: no.
- Default: `/`.
- Validation: must start and end with `/` and must not contain whitespace,
  `?`, `#`, or `//`.
- Consequence: use `/` for a root site or custom domain. Use
  `/repository-name/` for a GitHub Pages project site without a custom domain.
  Source Markdown can still use root-relative paths such as `/workflow.svg` or
  `/getting-started/`; Norna prefixes them during rendering.

Examples:

```js
site: {
	url: 'https://example.com/',
	basePath: '/',
}
```

```js
site: {
	url: 'https://janga.github.io/norna/',
	basePath: '/norna/',
}
```

## Layout

### `layout.pageWidth`

- Purpose: maximum width of the main page content area, including section
  headings, section text, galleries, sticky-navigation alignment, and footer.
- Type: string containing a simple positive CSS length.
- Required: no.
- Default: `1180px`.
- Validation: if set, it must be a positive number followed by one of `px`,
  `rem`, `em`, `vw`, `vh`, `vmin`, `vmax`, `ch`, or `%`.
- Consequence: the value overrides the global `--page-width` CSS variable.
  It is the outer width limit for content that is centered on the page.
  `gallery.width` cannot render wider than this page width or the available
  viewport width after responsive gutters.

Example:

```js
layout: {
	pageWidth: '1180px',
}
```

### `layout.gutter`

- Purpose: side margin removed from the viewport before the available content
  width is calculated.
- Type: either a CSS length string used on all viewports, or an object with
  `desktop` and `mobile` CSS length strings.
- Required: no.
- Default: desktop `clamp(1.25rem, 4vw, 3rem)`, mobile `1rem`.
- Validation: if set, each value must be a positive CSS length such as `16px`,
  `3rem`, or `4vw`. `clamp()` with those simple lengths is also accepted.
- Consequence: wider gutters leave more side margin and reduce the maximum
  available width for galleries and aligned text.

Example:

```js
layout: {
	gutter: {
		desktop: '48px',
		mobile: '16px',
	},
}
```

## Gallery

### `gallery.width`

- Purpose: maximum rendered width for gallery images, gallery captions, and
  left- or right-aligned section text that is intended to line up with gallery
  edges.
- Type: string containing a simple positive CSS length.
- Required: no.
- Default: `900px`.
- Validation: if set, it must be a positive number followed by one of `px`,
  `rem`, `em`, `vw`, `vh`, `vmin`, `vmax`, `ch`, or `%`.
- Consequence: the value overrides the global `--gallery-width` CSS variable.
  Images and aligned text cannot render wider than this value, but the
  effective width is also limited by `layout.pageWidth`, `layout.gutter`, and
  `gallery.maxAvailableWidthPercent`.

Example:

```js
gallery: {
	width: '900px',
}
```

### `gallery.maxAvailableWidthPercent`

- Purpose: maximum share of the available width, after gutters, that gallery
  images, gallery captions, and aligned section text may use.
- Type: either a number used on all viewports, or an object with `desktop` and
  `mobile` numbers.
- Required: no.
- Default: desktop `100`, mobile `100`.
- Validation: each value must be greater than `0` and less than or equal to
  `100`.
- Consequence: `100` allows the gallery to use the full available width. A
  smaller value keeps galleries narrower without changing the page width or
  gutters.

Example:

```js
gallery: {
	maxAvailableWidthPercent: {
		desktop: 100,
		mobile: 100,
	},
}
```

### `gallery.maxAvailableHeightPercent`

- Purpose: maximum share of viewport height that gallery images may use.
- Type: either a number used on all viewports, or an object with `desktop` and
  `mobile` numbers.
- Required: no.
- Default: desktop `74`, mobile `68`.
- Validation: each value must be greater than `0` and less than or equal to
  `100`.
- Consequence: images keep their proportions and are scaled down when filling
  the available width would make them taller than this limit. This applies to
  both landscape and portrait images.

Example:

```js
gallery: {
	maxAvailableHeightPercent: {
		desktop: 74,
		mobile: 68,
	},
}
```

## Typography

### `typography.fontFamily`

- Purpose: global CSS `font-family` stack used by site text and sticky
  navigation.
- Type: string containing a CSS font-family value.
- Required: no.
- Default: `Arial, 'Helvetica Neue', Helvetica, sans-serif`, matching the
  engine's existing sticky-navigation font stack.
- Validation: if set, it must be a non-empty string and must not contain
  semicolons, braces, or line breaks.
- Consequence: the value overrides the global `--font-sans` CSS variable for
  the whole page. Section headings, body text, gallery captions, footer text,
  and sticky navigation all inherit from that variable unless engine CSS gives a
  more specific rule.

Example:

```js
typography: {
	fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
}
```

## Navigation

### `navigation.smoothScroll`

- Purpose: controls enhanced same-page anchor navigation and native
  `scroll-behavior`.
- Type: object.
- Required: no; omitted fields use defaults.

Fields:

- `navigation.smoothScroll.enabled`: boolean, default `true`.
- `navigation.smoothScroll.minimumDurationMs`: positive integer, default
  `2000`.
- `navigation.smoothScroll.maximumDurationMs`: positive integer, default
  `4000`; must be greater than or equal to `minimumDurationMs`.
- `navigation.smoothScroll.durationPerPixelMs`: positive number, default
  `0.22`.

When `enabled` is `false`, section links jump directly to anchors without the
controlled animation. The no-JavaScript fallback keeps real `href="#section-id"`
links.

Example:

```js
navigation: {
	smoothScroll: {
		enabled: true,
		minimumDurationMs: 600,
		maximumDurationMs: 1_200,
		durationPerPixelMs: 0.2,
	},
}
```

## Locale And UI Labels

### `locale.lang`

- Purpose: language tag rendered on the root `<html lang="...">` element.
- Type: string language tag such as `en` or `sv`.
- Required: no.
- Default: `en`.
- Validation: two or three letters, optionally followed by `-` separated
  subtags.
- Consequence: screen readers, browsers, and search engines use this to
  interpret the page language.

### `locale.labels`

- Purpose: site-wide UI labels rendered by the engine for non-editorial
  interface text.
- Type: object.
- Required: no; omitted labels use English defaults.

Fields:

- `locale.labels.skipToContent`: skip-link text, default `Skip to content`.
- `locale.labels.siteNavigation`: site-level navigation ARIA label and mobile
  menu group heading, default `Pages`.
- `locale.labels.pageNavigation`: current-page section navigation ARIA label and
  mobile menu group heading, default `On this page`.
- `locale.labels.sectionNavigation`: legacy section navigation label, default
  `Sections`.
- `locale.labels.menu`: mobile menu summary text, default `Menu`.
- `locale.labels.closeMenu`: reserved close-menu label, default `Close menu`.
- `locale.labels.gallery`: gallery ARIA label prefix, default `Gallery`.

Example:

```js
locale: {
	lang: 'sv',
	labels: {
		skipToContent: 'Hoppa till innehåll',
		siteNavigation: 'Sidor',
		pageNavigation: 'På denna sida',
		sectionNavigation: 'Sektioner',
		menu: 'Meny',
		gallery: 'Galleri',
	},
}
```

## Footer

### `footer.copyrightMessage`

- Purpose: optional footer sentence.
- Type: string.
- Required: no.
- Default: hidden.
- Validation: if set, it must be a non-empty string. `undefined`, `null`, and
  `''` are treated as absent.
- Consequence: footer rendering is enabled when this or enabled build info is
  present.

### `footer.buildInfo`

- Purpose: optional footer build timestamp.
- Type: object, `false`, `null`, or omitted.
- Required: no.
- Default: hidden.
- Validation: object fields are validated when the object is present. `false`,
  `null`, or omission hides build info.

Fields:

- `footer.buildInfo.enabled`: boolean, default `true`.
- `footer.buildInfo.text`: required non-empty string.
- `footer.buildInfo.dateTimeFormat`: required object.
- `footer.buildInfo.dateTimeFormat.locale`: required string.
- `footer.buildInfo.dateTimeFormat.timeZone`: required string.
- `footer.buildInfo.dateTimeFormat.dateStyle`: required string.
- `footer.buildInfo.dateTimeFormat.timeStyle`: required string.

The date/time object must be accepted by `Intl.DateTimeFormat`.

Example:

```js
footer: {
	copyrightMessage: '(c) Example Artist.',
	buildInfo: {
		enabled: true,
		text: 'Built',
		dateTimeFormat: {
			locale: 'en-GB',
			timeZone: 'UTC',
			dateStyle: 'short',
			timeStyle: 'short',
		},
	},
}
```

If both `footer.copyrightMessage` and enabled `footer.buildInfo` are absent, the
footer is not rendered.

## GitHub

### `github.repo`

- Purpose: repository used by deploy checks and deploy monitoring.
- Type: string in `owner/name` form.
- Required: yes.
- Default: none.
- Validation: non-empty string.

### `github.branch`

- Purpose: deploy branch required by `norna deploy` and monitored by
  `deploy:watch`.
- Type: string.
- Required: yes.
- Default: none.
- Validation: non-empty string.

### `github.pagesWorkflow`

- Purpose: GitHub Actions workflow name used by deploy checks and
  `deploy:watch`.
- Type: string.
- Required: yes.
- Default: none.
- Validation: non-empty string.

## Deploy Watch

### `deploy.watch`

- Purpose: defaults for `norna deploy:watch`.
- Type: object.
- Required: no; omitted fields use defaults.

Fields:

- `deploy.watch.intervalMs`: positive integer, default `10000`.
- `deploy.watch.timeoutMs`: positive integer, default `900000`.
- `deploy.watch.runLimit`: positive integer, default `10`.

Command-line options such as `--interval`, `--timeout`, and `--limit` can
override these values for one run.

## Site Directory Selection

The site directory is not configured in `config.mjs`.

Use one of:

```sh
NORNA_SITE_DIR=my-site npm run norna:build
norna --site-dir my-site build
```

If `NORNA_SITE_DIR` is set to an empty value, commands fail. Relative site
directories are resolved by walking upward from the invocation root until the
selected directory contains `config.mjs` and `content.md`. Absolute site
directories are accepted and make their parent the site project root.

When no site directory is explicitly selected, the current directory itself can
be the site directory if it contains `config.mjs` and `content.md`. If not,
Norna walks upward looking for a default `site/` directory with those files.
