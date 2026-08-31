import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	getPresentationCssVariables,
	getPresentationPalette,
} from './lib/presentation.mjs';
import {
	getPresentationPaletteMetadata,
	presentationPaletteNames,
} from './lib/presentation-palette-metadata.mjs';
import {
	getThemePreset,
	getThemePresetMetadata,
	themePresetNames,
} from './lib/theme-presets.mjs';

const escapeHtml = (value) => String(value)
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;');

const presetEntries = themePresetNames.map((name) => {
	const theme = getThemePreset(name);
	return {
		...getThemePresetMetadata(name),
		defaultPalette: theme.palette,
		defaultColorMode: theme.colorMode.default,
		href: `../feature-demos/theme-preset-${name}/`,
		source: `https://github.com/janga/norna/tree/main/examples/feature-demos/theme-preset-${name}`,
	};
});

const paletteEntries = presentationPaletteNames.map((name) => {
	const palette = getPresentationPalette(name);
	return {
		name,
		...getPresentationPaletteMetadata(name),
		cssVariables: getPresentationCssVariables({ paletteModes: palette.modes }),
	};
});

export const renderThemePresetComparison = () => {
	const initial = presetEntries[0];
	const presetOptions = presetEntries.map(({ name, title }) => (
		`<option value="${escapeHtml(name)}">${escapeHtml(title)}</option>`
	)).join('');
	const paletteOptions = [
		'<option value="">Preset default</option>',
		...paletteEntries.map(({ name, title }) => (
			`<option value="${escapeHtml(name)}">${escapeHtml(title)}</option>`
		)),
	].join('');
	const colorModeOptions = [
		['', 'Preset default'],
		['system', 'System'],
		['light', 'Light'],
		['dark', 'Dark'],
	].map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
	const fallbackLinks = presetEntries.map(({ href, title }) => (
		`<li><a href="${escapeHtml(href)}">Open the ${escapeHtml(title)} preset example</a></li>`
	)).join('');
	const presets = Object.fromEntries(presetEntries.map(({
		name,
		title,
		description,
		defaultPalette,
		defaultColorMode,
		href,
		source,
	}) => [
		name,
		{ title, description, defaultPalette, defaultColorMode, href, source },
	]));
	const palettes = Object.fromEntries(paletteEntries.map(({
		name,
		title,
		description,
		cssVariables,
	}) => [
		name,
		{ title, description, cssVariables },
	]));

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="color-scheme" content="light dark">
	<title>Explore Norna themes</title>
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
			grid-template-columns: minmax(12rem, auto) minmax(0, 1fr) auto;
			align-items: center;
			gap: 0.7rem 1.25rem;
			padding: 0.75rem clamp(1rem, 3vw, 2rem);
			border-bottom: 1px solid color-mix(in srgb, CanvasText 22%, Canvas);
			background: Canvas;
		}
		.comparison-heading { min-width: 0; }
		.comparison-heading a { display: inline-block; margin-bottom: 0.2rem; font-size: 0.78rem; }
		.comparison-heading h1 { margin: 0; font-size: 1rem; line-height: 1.25; }
		.comparison-controls { display: flex; flex-wrap: wrap; gap: 0.65rem 1rem; }
		.comparison-control { display: grid; grid-template-columns: auto minmax(8rem, 12rem); align-items: center; gap: 0.5rem; }
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
		.comparison-links { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.5rem 0.9rem; white-space: nowrap; }
		.comparison-description { min-width: 0; margin: 0; color: color-mix(in srgb, CanvasText 72%, Canvas); font-size: 0.82rem; }
		.comparison-config {
			display: flex;
			align-items: baseline;
			justify-content: flex-end;
			gap: 0.65rem;
			min-width: 0;
		}
		.comparison-config > span { flex: 0 0 auto; color: color-mix(in srgb, CanvasText 68%, Canvas); font-size: 0.75rem; font-weight: 700; }
		.comparison-config pre {
			min-width: 0;
			margin: 0;
			padding: 0.45rem 0.65rem;
			overflow-x: auto;
			border: 1px solid color-mix(in srgb, CanvasText 18%, Canvas);
			border-radius: 4px;
			background: color-mix(in srgb, CanvasText 5%, Canvas);
			font: 0.76rem/1.35 ui-monospace, SFMono-Regular, Consolas, monospace;
			white-space: pre;
		}
		.comparison-frame { width: 100%; height: 100%; min-height: 38rem; border: 0; background: #fff; }
		.comparison-fallback { padding: 1rem clamp(1rem, 3vw, 2rem); }
		:focus-visible { outline: 3px solid #0b6e4f; outline-offset: 3px; }
		@media (min-width: 941px) {
			.comparison-description { grid-column: 1 / 3; }
			.comparison-config { grid-column: 3; }
		}
		@media (max-width: 940px) {
			.comparison-toolbar { grid-template-columns: minmax(12rem, 1fr) auto; }
			.comparison-controls { grid-column: 1 / -1; }
			.comparison-description, .comparison-config { grid-column: 1 / -1; }
			.comparison-config { justify-content: flex-start; }
		}
		@media (max-width: 560px) {
			body { grid-template-rows: auto minmax(34rem, 1fr); }
			.comparison-toolbar { grid-template-columns: 1fr; }
			.comparison-controls, .comparison-description, .comparison-config, .comparison-links { grid-column: auto; }
			.comparison-control { grid-template-columns: 5.5rem minmax(0, 1fr); width: 100%; }
			.comparison-links, .comparison-config { justify-content: flex-start; }
			.comparison-frame { min-height: 34rem; }
		}
	</style>
</head>
<body>
	<header class="comparison-toolbar">
		<div class="comparison-heading">
			<a href="../">Examples</a>
			<h1>Explore themes</h1>
		</div>
		<div class="comparison-controls" role="group" aria-label="Theme preview settings">
			<label class="comparison-control">
				<span>Preset</span>
				<select data-preset-select>${presetOptions}</select>
			</label>
			<label class="comparison-control">
				<span>Palette</span>
				<select data-palette-select>${paletteOptions}</select>
			</label>
			<label class="comparison-control">
				<span>Default mode</span>
				<select data-color-mode-select>${colorModeOptions}</select>
			</label>
		</div>
		<nav class="comparison-links" aria-label="Selected preset links">
			<a data-preset-open href="${escapeHtml(initial.href)}">Open preset site</a>
			<a data-preset-source href="${escapeHtml(initial.source)}">View source</a>
			<a href="https://github.com/janga/norna/blob/main/docs/theme.md#palette-and-color-mode">Theme reference</a>
		</nav>
		<p class="comparison-description" data-theme-description aria-live="polite"></p>
		<div class="comparison-config">
			<span>theme.yaml</span>
			<pre><code data-theme-config></code></pre>
		</div>
	</header>
	<main>
		<iframe class="comparison-frame" data-theme-frame title="${escapeHtml(initial.title)} theme example" src="${escapeHtml(initial.href)}"></iframe>
	</main>
	<noscript>
		<div class="comparison-fallback">
			<p>JavaScript is only needed for switching the embedded preview. Each preset remains available as a normal static site:</p>
			<ul>${fallbackLinks}</ul>
		</div>
	</noscript>
	<script>
		const presets = ${JSON.stringify(presets)};
		const palettes = ${JSON.stringify(palettes)};
		const presetNames = Object.keys(presets);
		const paletteNames = Object.keys(palettes);
		const colorModes = ['system', 'light', 'dark'];
		const presetSelect = document.querySelector('[data-preset-select]');
		const paletteSelect = document.querySelector('[data-palette-select]');
		const colorModeSelect = document.querySelector('[data-color-mode-select]');
		const description = document.querySelector('[data-theme-description]');
		const config = document.querySelector('[data-theme-config]');
		const frame = document.querySelector('[data-theme-frame]');
		const openLink = document.querySelector('[data-preset-open]');
		const sourceLink = document.querySelector('[data-preset-source]');
		const frameBaselines = new WeakMap();
		let state;

		const sanitizeState = (candidate = {}) => ({
			preset: presetNames.includes(candidate.preset) ? candidate.preset : presetNames[0],
			palette: paletteNames.includes(candidate.palette) ? candidate.palette : '',
			colorMode: colorModes.includes(candidate.colorMode) ? candidate.colorMode : '',
		});

		const readHash = () => {
			const hash = location.hash.slice(1);
			if (presetNames.includes(hash)) return sanitizeState({ preset: hash });
			const values = new URLSearchParams(hash);
			return sanitizeState({
				preset: values.get('preset'),
				palette: values.get('palette'),
				colorMode: values.get('mode'),
			});
		};

		const writeHash = () => {
			if (!state.palette && !state.colorMode) {
				history.replaceState(null, '', '#' + state.preset);
				return;
			}
			const values = new URLSearchParams({ preset: state.preset });
			if (state.palette) values.set('palette', state.palette);
			if (state.colorMode) values.set('mode', state.colorMode);
			history.replaceState(null, '', '#' + values.toString());
		};

		const renderConfig = () => {
			const lines = ['preset: ' + state.preset];
			if (state.palette) lines.push('palette: ' + state.palette);
			if (state.colorMode) lines.push('colorMode:', '  default: ' + state.colorMode);
			config.textContent = lines.join('\\n');
		};

		const updateDescription = () => {
			const preset = presets[state.preset];
			const palette = state.palette ? palettes[state.palette] : palettes[preset.defaultPalette];
			const paletteContext = state.palette
				? palette.title + ': ' + palette.description
				: 'Uses the preset default, ' + palette.title + '. ' + palette.description;
			description.textContent = preset.description + ' ' + paletteContext;
		};

		const applyFrameTheme = () => {
			const frameDocument = frame.contentDocument;
			const root = frameDocument?.documentElement;
			if (!root) return;
			let baseline = frameBaselines.get(frameDocument);
			if (!baseline) {
				baseline = { style: root.getAttribute('style') };
				frameBaselines.set(frameDocument, baseline);
			}
			if (baseline.style === null) root.removeAttribute('style');
			else root.setAttribute('style', baseline.style);
			if (state.palette) {
				for (const [name, value] of Object.entries(palettes[state.palette].cssVariables)) {
					root.style.setProperty(name, value);
				}
			}
			const mode = state.colorMode || presets[state.preset].defaultColorMode;
			root.dataset.colorMode = mode;
			frameDocument.querySelectorAll('[data-reader-appearance]').forEach((input) => {
				input.checked = input.value === mode;
			});
			requestAnimationFrame(() => {
				const themeColor = getComputedStyle(root).getPropertyValue('--color-page').trim();
				if (themeColor) frameDocument.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
					meta.content = themeColor;
				});
			});
			const paletteTitle = state.palette ? palettes[state.palette].title : 'preset-default palette';
			frame.title = presets[state.preset].title + ' preset with ' + paletteTitle;
		};

		const applyState = (candidate, updateHash = true) => {
			state = sanitizeState(candidate);
			const preset = presets[state.preset];
			presetSelect.value = state.preset;
			paletteSelect.value = state.palette;
			colorModeSelect.value = state.colorMode;
			openLink.href = preset.href;
			sourceLink.href = preset.source;
			updateDescription();
			renderConfig();
			if (updateHash) writeHash();
			if (frame.getAttribute('src') !== preset.href) frame.setAttribute('src', preset.href);
			else applyFrameTheme();
		};

		presetSelect.addEventListener('change', () => applyState({ ...state, preset: presetSelect.value }));
		paletteSelect.addEventListener('change', () => applyState({ ...state, palette: paletteSelect.value }));
		colorModeSelect.addEventListener('change', () => applyState({ ...state, colorMode: colorModeSelect.value }));
		frame.addEventListener('load', applyFrameTheme);
		window.addEventListener('hashchange', () => applyState(readHash(), false));
		applyState(readHash());
	</script>
</body>
</html>`;
};

export const writeThemePresetComparison = async (outputDirectory) => {
	await mkdir(outputDirectory, { recursive: true });
	await writeFile(path.join(outputDirectory, 'index.html'), renderThemePresetComparison(), 'utf8');
};
