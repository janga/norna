import path from 'node:path';
import { siteDir } from './lib/site-paths.mjs';
import { applySiteUpgrade, planSiteUpgrade } from './lib/site-upgrade.mjs';

const usage = 'Usage: norna site:upgrade [--apply]\nPreview conversion of pages/000-home/ to the site root. Add --apply to move the files.';
const args = process.argv.slice(2);
try {
	if (args.includes('--help') || args.includes('-h')) {
		console.log(usage);
	} else {
		if (args.length > 1 || args.some((arg) => arg !== '--apply')) throw new Error(usage);
		const plan = await planSiteUpgrade(siteDir);
		if (!plan.moves.length) {
			console.log('The site already uses a root homepage. No files changed.');
		} else {
			console.log(`Site: ${siteDir}`);
			for (const move of plan.moves) console.log(`${path.relative(siteDir, move.source)} -> ${path.relative(siteDir, move.destination)}`);
			if (args.includes('--apply')) {
				await applySiteUpgrade(plan);
				console.log('Converted the homepage. Child page URLs are unchanged. Run norna check, then norna build.');
			} else {
				console.log('Preview only. Run norna site:upgrade --apply with the same --site-dir to move these files.');
			}
		}
	}
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
