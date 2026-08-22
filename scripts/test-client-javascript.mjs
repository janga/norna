import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nornaBin = path.join(repoRoot, 'bin', 'norna.mjs');
const tempParent = path.join(repoRoot, 'node_modules', '.cache');
await mkdir(tempParent, { recursive: true });
const tempRoot = await mkdtemp(path.join(tempParent, 'norna-client-javascript-'));
const siteDir = path.join(tempRoot, 'site');
const routeDir = path.join(siteDir, 'routes', '010-details');
const configPath = path.join(siteDir, 'config.md');

const runBuild = () => {
	const result = spawnSync(process.execPath, [nornaBin, 'build'], {
		cwd: tempRoot,
		encoding: 'utf8',
		env: {
			...process.env,
			NORNA_SITE_DIR: siteDir,
		},
	});

	if (result.status !== 0) {
		throw new Error([
			`norna build exited with code ${result.status}.`,
			result.stdout.trim(),
			result.stderr.trim(),
		].filter(Boolean).join('\n'));
	}
};

const readPage = (pathname = 'index.html') => readFile(path.join(tempRoot, 'dist', pathname), 'utf8');
const getScripts = (html) => html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
const assertNoClientJavaScript = (html, label) => {
	assert.deepEqual(getScripts(html), [], `${label} should not require client-side JavaScript.`);
};
const assertScrollBehavior = (html, behavior, label) => {
	assert.match(
		html,
		new RegExp(`<html\\b[^>]*style="[^"]*scroll-behavior: ${behavior}(?:;|&quot;|\")`),
		`${label} should render scroll-behavior: ${behavior}.`,
	);
};
const writeConfig = (scrollBehavior) => writeFile(configPath, `---
url: https://example.com/
${scrollBehavior ? `scrollBehavior: ${scrollBehavior}\n` : ''}---
`);
const writeSvg = (filePath, color) => writeFile(filePath, [
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">',
	`  <rect width="160" height="90" fill="${color}"/>`,
	'</svg>',
	'',
].join('\n'));

try {
	await mkdir(path.join(siteDir, 'public'), { recursive: true });
	await writeConfig();
	await writeFile(path.join(siteDir, 'theme.md'), `---
typography:
  preset: text-forward
presentation:
  palette: paper
---
`);
	await writeFile(path.join(siteDir, 'sitewide-content.md'), `---
navigation:
  brand: Test site
---
`);
	await writeFile(path.join(siteDir, 'content.md'), `---
title: Static single page
description: A single page without interactive features.
sections:
  intro: {}
  more: {}
---
## Intro {#intro}

Ordinary Markdown needs no client-side JavaScript.

## More {#more}

Additional sections do not make the page interactive.
`);

	runBuild();
	const instantHtml = await readPage();
	assertNoClientJavaScript(instantHtml, 'The default instant scroll mode');
	assertScrollBehavior(instantHtml, 'auto', 'The default instant scroll mode');
	assert.match(instantHtml, /<nav class="page-nav"/);
	assert.match(instantHtml, /href="#intro"/);
	assert.match(instantHtml, /href="#more"/);

	await writeConfig('browser-smooth');
	runBuild();
	const browserSmoothHtml = await readPage();
	assertNoClientJavaScript(browserSmoothHtml, 'The browser smooth scroll mode');
	assertScrollBehavior(browserSmoothHtml, 'smooth', 'The browser smooth scroll mode');

	await writeConfig();

	await mkdir(path.join(routeDir, 'images', 'details'), { recursive: true });
	await writeSvg(path.join(routeDir, 'images', 'details', 'first.svg'), '#7b8f78');
	await writeSvg(path.join(routeDir, 'images', 'details', 'second.svg'), '#a7664b');
	await writeFile(path.join(siteDir, 'content.md'), `---
title: Static baseline
description: A page without interactive features.
sections:
  intro: {}
---
## Intro {#intro}

Ordinary Markdown needs no client-side JavaScript.
`);
	await writeFile(path.join(routeDir, 'route-content.md'), `---
title: Details
description: Static managed images.
sections:
  details: {}
---
## Details {#details}

Static image stacks remain static.

\`\`\`norna-image-stack
- image: first.svg
  caption: First image.
- image: second.svg
  caption: Second image.
\`\`\`

\`\`\`norna-card-list
- title: Static card
  text: Cards do not require client-side behaviour.
\`\`\`
`);

	runBuild();
	assertNoClientJavaScript(await readPage(), 'A plain homepage in a multi-page site');
	assertNoClientJavaScript(
		await readPage(path.join('details', 'index.html')),
		'A page with managed image stacks and cards',
	);

	await writeFile(path.join(siteDir, 'content.md'), `---
title: Notes
description: A page with an enhanced sidenote.
sections:
  intro: {}
---
## Intro {#intro}

This sentence has additional context.{note-ref}

{note: The note remains readable without JavaScript, while alignment is enhanced when JavaScript runs.}
`);
	await writeFile(path.join(routeDir, 'route-content.md'), `---
title: Carousel
description: An interactive image carousel.
sections:
  details: {}
---
## Details {#details}

\`\`\`norna-image-carousel
- image: first.svg
  caption: First slide.
- image: second.svg
  caption: Second slide.
\`\`\`
`);

	runBuild();
	const noteHtml = await readPage();
	const carouselHtml = await readPage(path.join('details', 'index.html'));
	assert.equal(getScripts(noteHtml).length, 1, 'A page with notes should load only the note enhancement.');
	assert.match(noteHtml, /data-note-id=/);
	assert.equal(getScripts(carouselHtml).length, 1, 'A carousel page should load only the carousel implementation.');
	assert.match(carouselHtml, /data-carousel/);
	assert.match(getScripts(carouselHtml)[0], /\ssrc=/, 'Carousel JavaScript should be emitted as a module asset.');

	await writeFile(path.join(siteDir, 'content.md'), `---
title: Banner
description: A page with a dismissible banner.
sections:
  intro: {}
---
## Intro {#intro}

The only interactive feature is the banner.
`);
	await writeFile(path.join(routeDir, 'route-content.md'), `---
title: Details
description: A second plain page.
sections:
  details: {}
---
## Details {#details}

Plain route content.
`);
	await writeFile(path.join(siteDir, 'sitewide-content.md'), `---
banners:
  - id: test-banner
    title: Test banner
    text: This banner can be dismissed.
---
`);

	runBuild();
	const bannerHtml = await readPage();
	assert.equal(getScripts(bannerHtml).length, 1, 'A dismissible banner should load only its dismissal script.');
	assert.match(getScripts(bannerHtml)[0], /norna-banner:/);

	console.log('Client JavaScript boundaries test passed.');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
