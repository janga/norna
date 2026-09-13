import {
	auditDocusaurusProject,
	migrationCheckUsage,
	parseMigrationCheckArgs,
	writeMigrationReport,
} from './lib/docusaurus-migration-audit.mjs';

const parsed = parseMigrationCheckArgs(process.argv.slice(2));
if (parsed.help) {
	console.log(migrationCheckUsage);
	process.exit(0);
}

const report = await auditDocusaurusProject({ sourceRoot: parsed.sourceRoot });
await writeMigrationReport(report, parsed.reportDir, { sourceRoot: parsed.sourceRoot });
console.log('Docusaurus migration audit written to ' + parsed.reportDir);
console.log('Source pages: ' + report.summary.pages);
console.log('Pages requiring attention: ' + report.summary.pagesWithFindings);
console.log('Findings: ' + report.summary.findings);
