import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runReviewEnvironment } from './review-environments.mjs';
import { captureReviewPage } from './review-capture.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const navigationImages = path.join(root, 'site/root/pages/examples/pages/building-a-site/images');

// Replace only the registered disposable scratch copy, never a maintained site.
for (const [scenario, route, pageMenu] of [
	['single', '.', null],
	['top', 'dogs/', 'Dogs'],
	['nested', 'dogs/adult-dogs/', null],
	['documentation', 'guides/installation/linux/', null],
]) {
	await runReviewEnvironment(['scratch', 'prepare', '--from', `fixtures/navigation-examples/${scenario}/site`, '--replace']);
	const environment = await runReviewEnvironment(['start', 'scratch']);
	const states = scenario === 'documentation' ? [['desktop', '1440x850', null]] : [
		['desktop', '1200x650', null],
		['mobile', '390x600', null],
		['menu', '390x600', 'compact'],
		...(pageMenu ? [['sections', '1200x650', pageMenu]] : []),
	];
	for (const [state, viewport, menu] of states) {
		const capture = await captureReviewPage({
			environment,
			root,
			rawArguments: [route, '--viewport', viewport, ...(menu ? ['--menu', menu] : [])],
		});
		await copyFile(capture.outputPath, path.join(navigationImages, `navigation-${scenario}-${state}.png`));
	}
}

// Complete-site previews and Getting Started use the public shelters.
await runReviewEnvironment(['scratch', 'prepare', '--from', 'examples/complete-sites/dog-shelter-single-page/site', '--replace']);
const singleShelter = await runReviewEnvironment(['start', 'scratch']);
const singlePreview = await captureReviewPage({
	environment: singleShelter, root,
	rawArguments: ['.', '--viewport', '1200x800'],
});
await copyFile(singlePreview.outputPath, path.join(root, 'site/root/pages/examples/pages/complete-sites/images/single-page-dog-shelter.png'));

await runReviewEnvironment(['scratch', 'prepare', '--from', 'examples/complete-sites/dog-shelter-multi-page/site', '--replace']);
const shelter = await runReviewEnvironment(['start', 'scratch']);
const multiPreview = await captureReviewPage({
	environment: shelter, root,
	rawArguments: ['.', '--viewport', '1200x800'],
});
await copyFile(multiPreview.outputPath, path.join(root, 'site/root/pages/examples/pages/complete-sites/images/multi-page-dog-shelter.png'));
for (const [name, options] of [['page', []], ['navigation', ['--menu', 'compact']]]) {
	const capture = await captureReviewPage({
		environment: shelter, root,
		rawArguments: ['dogs/', '--viewport', '390x600', ...options],
	});
	await copyFile(capture.outputPath, path.join(root,
		`site/root/pages/getting-started/pages/grow-your-site/images/dog-shelter-mobile-${name}.png`));
}

// Leave the illustrated H2 menus available for interactive review.
await runReviewEnvironment(['scratch', 'prepare', '--from', 'fixtures/navigation-examples/top/site', '--replace']);
await runReviewEnvironment(['start', 'scratch']);
