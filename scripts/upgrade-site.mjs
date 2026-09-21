import path from 'node:path';
import { siteDir } from './lib/site-paths.mjs';
import { applySiteUpgrade, planSiteUpgrade } from './lib/site-upgrade.mjs';

const usage = 'Usage: norna site:upgrade [--apply]\nPreview conversion to site-config/ and a root homepage with an optional theme.yaml. Add --apply to move the files.';
const args = process.argv.slice(2);
try {
	if (args.includes('--help') || args.includes('-h')) {
		console.log(usage);
	} else {
		if (args.length > 1 || args.some((arg) => arg !== '--apply')) throw new Error(usage);
		const plan = await planSiteUpgrade(siteDir);
		if (!plan.moves.length) {
			console.log('The site already uses the current configuration and homepage layout. No files changed.');
		} else {
			console.log(`Site: ${siteDir}`);
			for (const move of plan.moves) console.log(`${path.relative(siteDir, move.source)} -> ${path.relative(siteDir, move.destination)}`);
			if (args.includes('--apply')) {
				await applySiteUpgrade(plan);
				console.log('Converted the site configuration and homepage files. Public page URLs are unchanged. Run norna check, then norna build.');
			} else {
				console.log('Preview only. Run norna site:upgrade --apply with the same --site-dir to move these files.');
			}
		}
	}
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
