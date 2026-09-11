import { copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runReviewEnvironment } from './review-environments.mjs';
import { captureReviewPage } from './review-capture.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const consumers = ['site/pages/010-features/images', 'site/pages/030-examples/images'];

// Replace only the registered disposable scratch copy, never a maintained site.
for (const [scenario, route, pageMenu] of [
	['single', '.', null],
	['top', 'dogs/', 'Dogs'],
	['nested', 'dogs/adult-dogs/', null],
]) {
	await runReviewEnvironment(['scratch', 'prepare', '--from', `fixtures/navigation-examples/${scenario}/site`, '--replace']);
	const environment = await runReviewEnvironment(['start', 'scratch']);
	for (const [state, viewport, menu] of [
		['desktop', '1200x650', null],
		['mobile', '390x600', null],
		['menu', '390x600', 'compact'],
		...(pageMenu ? [['sections', '1200x650', pageMenu]] : []),
	]) {
		const capture = await captureReviewPage({
			environment,
			root,
			rawArguments: [route, '--viewport', viewport, ...(menu ? ['--menu', menu] : [])],
		});
		for (const consumer of consumers) {
			if (consumer.includes('010-features') && state !== 'desktop') continue;
			await copyFile(capture.outputPath, path.join(root, consumer, `navigation-${scenario}-${state}.png`));
		}
	}
}

// Getting Started uses the complete public shelter rather than the small diagrams.
await runReviewEnvironment(['scratch', 'prepare', '--from', 'examples/complete-sites/dog-shelter-multi-page/site', '--replace']);
const shelter = await runReviewEnvironment(['start', 'scratch']);
for (const [name, options] of [['page', []], ['navigation', ['--menu', 'compact']]]) {
	const capture = await captureReviewPage({
		environment: shelter, root,
		rawArguments: ['dogs/', '--viewport', '390x600', ...options],
	});
	await copyFile(capture.outputPath, path.join(root,
		`site/pages/020-getting-started/pages/020-grow-your-site/images/dog-shelter-mobile-${name}.png`));
}
