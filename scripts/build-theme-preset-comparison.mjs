import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getThemePresetMetadata, themePresetNames } from './lib/theme-presets.mjs';

const escapeHtml = (value) => String(value)
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;');

const presetEntries = themePresetNames.map((name) => ({
	...getThemePresetMetadata(name),
	href: `../feature-demos/theme-preset-${name}/`,
	source: `https://github.com/janga/norna/tree/main/examples/feature-demos/theme-preset-${name}`,
}));

export const renderThemePresetComparison = () => {
	const initial = presetEntries[0];
	const options = presetEntries.map(({ name, title }) => (
		`<option value="${escapeHtml(name)}">${escapeHtml(title)}</option>`
	)).join('');
	const fallbackLinks = presetEntries.map(({ href, title }) => (
		`<li><a href="${escapeHtml(href)}">Open the ${escapeHtml(title)} preset example</a></li>`
	)).join('');
	const data = Object.fromEntries(presetEntries.map(({ name, title, description, href, source }) => [
		name,
		{ title, description, href, source },
	]));

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="color-scheme" content="light dark">
	<title>Compare Norna theme presets</title>
	<style>
		* { box-sizing: border-box; }
		html, body { min-height: 100%; margin: 0; }
		body {
			display: grid;
			grid-template-rows: auto minmax(38rem, 1fr);
			min-height: 100svh;
			background: Canvas;
			color: CanvasText;
			font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		}
		a { color: LinkText; }
		.comparison-toolbar {
			display: grid;
			grid-template-columns: minmax(12rem, auto) minmax(13rem, 18rem) minmax(16rem, 1fr) auto;
			align-items: center;
			gap: 0.75rem 1.25rem;
			padding: 0.75rem clamp(1rem, 3vw, 2rem);
			border-bottom: 1px solid color-mix(in srgb, CanvasText 22%, Canvas);
			background: Canvas;
		}
		.comparison-heading { min-width: 0; }
		.comparison-heading a { display: inline-block; margin-bottom: 0.2rem; font-size: 0.78rem; }
		.comparison-heading h1 { margin: 0; font-size: 1rem; line-height: 1.25; }
		.comparison-control { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 0.6rem; }
		.comparison-control span { font-size: 0.8rem; font-weight: 700; }
		.comparison-control select {
			width: 100%;
			min-height: 2.65rem;
			border: 1px solid color-mix(in srgb, CanvasText 45%, Canvas);
			border-radius: 4px;
			padding: 0.45rem 2rem 0.45rem 0.65rem;
			background: Canvas;
			color: CanvasText;
			font: inherit;
		}
		.comparison-description { max-width: 56rem; margin: 0; color: color-mix(in srgb, CanvasText 72%, Canvas); font-size: 0.82rem; }
		.comparison-links { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.5rem 0.9rem; white-space: nowrap; }
		.comparison-frame { width: 100%; height: 100%; min-height: 38rem; border: 0; background: #fff; }
		.comparison-fallback { padding: 1rem clamp(1rem, 3vw, 2rem); }
		:focus-visible { outline: 3px solid #0b6e4f; outline-offset: 3px; }
		@media (max-width: 940px) {
			.comparison-toolbar { grid-template-columns: minmax(12rem, 1fr) minmax(13rem, 18rem); }
			.comparison-description { grid-column: 1 / -1; }
			.comparison-links { grid-column: 1 / -1; justify-content: flex-start; }
		}
		@media (max-width: 560px) {
			body { grid-template-rows: auto minmax(34rem, 1fr); }
			.comparison-toolbar { grid-template-columns: 1fr; }
			.comparison-description, .comparison-links { grid-column: auto; }
			.comparison-frame { min-height: 34rem; }
		}
	</style>
</head>
<body>
	<header class="comparison-toolbar">
		<div class="comparison-heading">
			<a href="../">Examples</a>
			<h1>Compare theme presets</h1>
		</div>
		<label class="comparison-control">
			<span>Preset</span>
			<select data-preset-select>${options}</select>
		</label>
		<p class="comparison-description" data-preset-description aria-live="polite">${escapeHtml(initial.description)}</p>
		<nav class="comparison-links" aria-label="Selected preset links">
			<a data-preset-open href="${escapeHtml(initial.href)}">Open full site</a>
			<a data-preset-source href="${escapeHtml(initial.source)}">View source</a>
		</nav>
	</header>
	<main>
		<iframe class="comparison-frame" data-preset-frame title="${escapeHtml(initial.title)} preset example" src="${escapeHtml(initial.href)}"></iframe>
	</main>
	<noscript>
		<div class="comparison-fallback">
			<p>JavaScript is only needed for switching the embedded example. Each preset remains available as a normal static site:</p>
			<ul>${fallbackLinks}</ul>
		</div>
	</noscript>
	<script>
		const presets = ${JSON.stringify(data)};
		const names = Object.keys(presets);
		const select = document.querySelector('[data-preset-select]');
		const description = document.querySelector('[data-preset-description]');
		const frame = document.querySelector('[data-preset-frame]');
		const openLink = document.querySelector('[data-preset-open]');
		const sourceLink = document.querySelector('[data-preset-source]');
		const applyPreset = (requestedName) => {
			const name = names.includes(requestedName) ? requestedName : names[0];
			const preset = presets[name];
			select.value = name;
			description.textContent = preset.description;
			openLink.href = preset.href;
			sourceLink.href = preset.source;
			if (frame.getAttribute('src') !== preset.href) frame.setAttribute('src', preset.href);
			frame.title = preset.title + ' preset example';
			history.replaceState(null, '', '#' + name);
		};
		select.addEventListener('change', () => applyPreset(select.value));
		window.addEventListener('hashchange', () => applyPreset(location.hash.slice(1)));
		applyPreset(location.hash.slice(1));
	</script>
</body>
</html>`;
};

export const writeThemePresetComparison = async (outputDirectory) => {
	await mkdir(outputDirectory, { recursive: true });
	await writeFile(path.join(outputDirectory, 'index.html'), renderThemePresetComparison(), 'utf8');
};
