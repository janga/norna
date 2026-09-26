import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getSiteLinkGraph } from './site-link-graph.mjs';
import { getSiteStructure } from './site-structure.mjs';

const writeFileAtomically = async (filePath, source, mode) => {
	const temporaryPath = path.join(
		path.dirname(filePath),
		`.${path.basename(filePath)}.norna-${process.pid}-${randomUUID()}.tmp`,
	);
	try {
		await writeFile(temporaryPath, source, { mode: mode & 0o777 });
		await rename(temporaryPath, filePath);
	} finally {
		await rm(temporaryPath, { force: true });
	}
};

const assertSourcesUnchanged = async (plan) => {
	for (const file of plan.sourceFiles) {
		const currentSource = await readFile(file.contentPath, 'utf8');
		if (currentSource !== file.source) {
			throw new Error([
				`Page move stopped because ${file.contentLabel} changed after the plan was created.`,
				'Run the command again to build a fresh plan. No file was changed.',
			].join('\n'));
		}
	}
};

const assertFinalSite = async (siteRoot, generatedRoutes) => {
	const structure = await getSiteStructure({ siteRoot });
	const graph = await getSiteLinkGraph({ siteStructure: structure, publicDir: path.join(siteRoot, 'public'), generatedRoutes });
	const errors = graph.diagnostics.filter(({ severity }) => severity === 'error');
	if (errors.length === 0) return;
	throw new Error([
		'Post-move link validation failed.',
		...errors.flatMap((diagnostic) => [
			`- ${diagnostic.message}`,
			...(diagnostic.fix ? [`  Fix: ${diagnostic.fix}`] : []),
		]),
	].join('\n'));
};

export const applyPageMovePlan = async (plan, { siteRoot, generatedRoutes, renameDirectory = rename }) => {
	await assertSourcesUnchanged(plan);
	let collectionCreated = false;
	let directoryMoved = false;
	let fileWritten = false;

	try {
		if (plan.mode === 'move') {
			if (!plan.destinationCollectionExists) {
				await mkdir(plan.destinationCollectionDirectory);
				collectionCreated = true;
			}
			try {
				await renameDirectory(plan.sourceDirectory, plan.destinationDirectory);
				directoryMoved = true;
			} catch (error) {
				if (error?.code === 'EXDEV') {
					throw new Error('Page directories must stay on one filesystem so Norna can move the complete subtree atomically.');
				}
				throw error;
			}
		}

		for (const change of plan.fileChanges) {
			await writeFileAtomically(change.finalPath, change.updatedSource, change.mode);
			fileWritten = true;
		}
		await assertFinalSite(siteRoot, generatedRoutes);
	} catch (error) {
		const changesStarted = directoryMoved || fileWritten;
		const rollbackErrors = [];
		if (directoryMoved) {
			try {
				await renameDirectory(plan.destinationDirectory, plan.sourceDirectory);
				directoryMoved = false;
			} catch (rollbackError) {
				rollbackErrors.push(`Could not restore the page directory: ${rollbackError.message}`);
			}
		}

		for (const change of changesStarted ? plan.fileChanges : []) {
			try {
				const restorePath = directoryMoved && change.finalPath !== change.originalPath
					? change.finalPath
					: change.originalPath;
				await writeFileAtomically(restorePath, change.originalSource, change.mode);
			} catch (rollbackError) {
				rollbackErrors.push(`Could not restore ${change.contentLabel}: ${rollbackError.message}`);
			}
		}

		if (collectionCreated && !directoryMoved) {
			try {
				await rmdir(plan.destinationCollectionDirectory);
			} catch (rollbackError) {
				if (rollbackError?.code !== 'ENOENT' && rollbackError?.code !== 'ENOTEMPTY') {
					rollbackErrors.push(`Could not remove the newly created pages directory: ${rollbackError.message}`);
				}
			}
		}

		throw new Error([
			error instanceof Error ? error.message : String(error),
			rollbackErrors.length === 0
				? (changesStarted
					? 'The original page directory and content files were restored.'
					: 'No source file was changed.')
				: 'Rollback was incomplete. Inspect these paths before running page:move again:',
			...rollbackErrors.map((message) => `- ${message}`),
		].join('\n'));
	}
};
