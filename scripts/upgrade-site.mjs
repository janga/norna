import { siteDir } from './lib/site-paths.mjs';
import { planSiteUpgrade } from './lib/site-upgrade.mjs';

const usage = 'Usage: norna site:upgrade [--apply]\nCheck the root/ source layout. Former layouts require manual conversion; --apply is retained but does not convert old sources.';
const args = process.argv.slice(2);
try {
	if (args.includes('--help') || args.includes('-h')) {
		console.log(usage);
	} else {
		if (args.length > 1 || args.some((arg) => arg !== '--apply')) throw new Error(usage);
		await planSiteUpgrade(siteDir);
		console.log('The site already uses the current configuration and homepage layout. No files changed.');
	}
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
