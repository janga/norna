import {
	formatNavigationReviewText,
	getNavigationReview,
	parseNavigationReviewArgs,
} from './lib/navigation-review.mjs';

const usage = `
Usage: norna navigation:review [--format text|json]

Read the selected site and report its page hierarchy, heading outlines,
internal page links, effective navigation modes, and structural review prompts.
No files are changed.
`.trim();

try {
	const { format, help } = parseNavigationReviewArgs(process.argv.slice(2));
	if (help) {
		console.log(usage);
	} else {
		const { projectConfig } = await import('./lib/project-config.mjs');
		const review = await getNavigationReview({
			requestedNavigationMode: projectConfig.navigation.mode,
		});
		process.stdout.write(format === 'json'
			? `${JSON.stringify(review, null, 2)}\n`
			: formatNavigationReviewText(review));
		if (review.errors.length > 0) process.exitCode = 1;
	}
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
}
