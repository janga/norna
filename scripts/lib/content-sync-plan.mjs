import path from 'node:path';

import { toPosixPath } from './site-content.mjs';

export const getExpectedImagePath = (contentFile, imageName) =>
	path.join(contentFile.imagesDir, imageName);

export const getExpectedImageLabel = (contentFile, imageName) =>
	`${contentFile.imagesLabel}/${imageName}`;

export const getImageRootLabel = (contentFile) => contentFile.imagesLabel.replace(/\/images$/, '');

export const getImageCandidateLabel = ({ contentFile, imagePath }) =>
	`${contentFile.imagesLabel}/${toPosixPath(path.relative(contentFile.imagesDir, imagePath))}`;

const getReferenceLabel = (contentFile, section) =>
	`${contentFile.contentLabel} [${section.id ?? 'page title'}]`;

const addMapEntry = (map, key, value) => {
	if (!map.has(key)) map.set(key, []);
	map.get(key).push(value);
};

const addReferenceIssue = (issues, entry, issue) => {
	issues.push({ ...entry, issue, phase: 'reference' });
};

const addConflictIssue = (issues, move, issue) => {
	issues.push({
		contentFile: move.contentFile,
		section: move.section,
		reference: move.reference,
		issue,
		phase: 'conflict',
	});
};

const addMoveConflicts = (moves, issues) => {
	const movesBySource = new Map();
	const movesByDestination = new Map();

	for (const move of moves) {
		addMapEntry(movesBySource, move.from, move);
		addMapEntry(movesByDestination, move.to, move);
	}

	for (const sourceMoves of movesBySource.values()) {
		const destinations = new Set(sourceMoves.map((move) => move.to));
		if (destinations.size <= 1) continue;

		const firstMove = sourceMoves[0];
		addConflictIssue(issues, firstMove, {
			severity: 'error',
			message: `Cannot relocate "${firstMove.imageName}" because the same source file is referenced from multiple destinations: ${sourceMoves.map((move) => getExpectedImageLabel(move.contentFile, move.imageName)).join(', ')}.`,
			fix: 'Duplicate the image manually or rename one of the image files so each move has a single destination.',
		});
	}

	for (const destinationMoves of movesByDestination.values()) {
		const sources = new Set(destinationMoves.map((move) => move.from));
		if (sources.size <= 1) continue;

		const firstMove = destinationMoves[0];
		addConflictIssue(issues, firstMove, {
			severity: 'error',
			message: `Cannot relocate "${firstMove.imageName}" because multiple source files would move to ${getExpectedImageLabel(firstMove.contentFile, firstMove.imageName)}: ${destinationMoves.map((move) => getImageCandidateLabel({ contentFile: move.sourceContentFile, imagePath: move.from })).join(', ')}.`,
			fix: 'Move the intended file manually or rename files so the destination is unambiguous.',
		});
	}
};

export const createImageSyncPlan = ({
	imageCandidates,
	references,
	reportMisplaced,
}) => {
	const candidatesByName = new Map();
	const expectedReferencesByPath = new Map();
	const issues = [];
	const moves = [];
	const referencedImagePaths = new Set();
	const resolvedPathByReference = new Map();

	for (const candidate of imageCandidates) {
		addMapEntry(candidatesByName, candidate.imageName, candidate);
	}

	for (const candidates of candidatesByName.values()) {
		candidates.sort((left, right) => left.imagePath.localeCompare(right.imagePath, 'sv'));
	}

	for (const entry of references) {
		const expectedPath = getExpectedImagePath(entry.contentFile, entry.reference.image);
		addMapEntry(expectedReferencesByPath, expectedPath, entry);
	}

	for (const entry of references) {
		const { contentFile, reference, section } = entry;
		const imageName = reference.image;
		const expectedPath = getExpectedImagePath(contentFile, imageName);
		const expectedLabel = getExpectedImageLabel(contentFile, imageName);
		const candidates = (candidatesByName.get(imageName) ?? [])
			.filter(({ imagePath }) => imagePath !== expectedPath);
		const expectedCandidate = (candidatesByName.get(imageName) ?? [])
			.find(({ imagePath }) => imagePath === expectedPath);

		if (expectedCandidate) {
			referencedImagePaths.add(expectedPath);
			resolvedPathByReference.set(reference, expectedPath);
			continue;
		}

		if (candidates.length === 0) {
			addReferenceIssue(issues, entry, {
				severity: 'error',
				message: `Image "${imageName}" does not exist at ${expectedLabel} or anywhere under any page image root.`,
				fix: `Add the source image directly to ${contentFile.imagesLabel}/ or remove the Norna-managed image reference.`,
			});
			continue;
		}

		if (candidates.length > 1) {
			addReferenceIssue(issues, entry, {
				severity: 'error',
				message: `Cannot relocate "${imageName}". Multiple files with this filename were found: ${candidates.map(getImageCandidateLabel).join(', ')}.`,
				fix: 'Move the intended file manually or rename files so the move is unambiguous.',
			});
			continue;
		}

		const sourceCandidate = candidates[0];
		const sourcePath = sourceCandidate.imagePath;
		const referencesAtCurrentLocation = (expectedReferencesByPath.get(sourcePath) ?? [])
			.filter((expectedReference) => expectedReference.contentFile !== contentFile);

		if (referencesAtCurrentLocation.length > 0) {
			addReferenceIssue(issues, entry, {
				severity: 'error',
				message: `Cannot relocate "${imageName}" from ${getImageCandidateLabel(sourceCandidate)} because it is still referenced from ${referencesAtCurrentLocation.map((expectedReference) => getReferenceLabel(expectedReference.contentFile, expectedReference.section)).join(', ')}.`,
				fix: 'Remove the extra reference, duplicate the image file manually, or rename one of the image files so the intended move is unambiguous.',
			});
			continue;
		}

		if (!moves.some((move) => move.from === sourcePath && move.to === expectedPath)) {
			moves.push({
				imageName,
				from: sourcePath,
				to: expectedPath,
				contentFile,
				sourceContentFile: sourceCandidate.contentFile,
				section,
				reference,
			});
		}

		referencedImagePaths.add(sourcePath);
		resolvedPathByReference.set(reference, sourcePath);

		if (reportMisplaced) {
			addReferenceIssue(issues, entry, {
				severity: 'error',
				message: `Image "${imageName}" is used here but is located in ${getImageCandidateLabel(sourceCandidate)}.`,
				fix: sourceCandidate.contentFile === contentFile
					? 'Run norna content:sync to move it directly into the current page image root.'
					: `Run norna content:sync to move it from ${getImageRootLabel(sourceCandidate.contentFile)} to ${getImageRootLabel(contentFile)}.`,
			});
		}
	}

	addMoveConflicts(moves, issues);

	return {
		issues,
		moves,
		referencedImagePaths,
		resolvedPathByReference,
	};
};
