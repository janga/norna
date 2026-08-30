import { mkdir, rename, stat } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import path from 'node:path';
import {
	getImageCandidatesByName,
	getDeprecatedInlineStyleReferences,
	readSiteFile,
	readThemeFile,
	toPosixPath,
	validateContentFrontmatterStructure,
	validateFrontmatterIndentation,
	validateThemeYamlStructure,
} from './lib/site-content.mjs';
import { getSiteStructure } from './lib/site-structure.mjs';
import { readImageDimensions } from './lib/image-dimensions.mjs';
import { parsePageMarkdown } from './lib/page-markdown.mjs';
import {
	siteThemeLabel,
	siteThemePath,
} from './lib/site-paths.mjs';

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has('--write');
const shouldCheck = args.has('--check') || !shouldWrite;
const skipPrompt = args.has('--yes');
const issues = [];
const imageMoves = [];
const referencedImagePaths = new Set();

const addIssue = ({ severity, message, fix, sectionId, sectionLabel }) => {
	issues.push({ severity, message, fix, sectionId, sectionLabel });
};

const hasErrors = () => issues.some((issue) => issue.severity === 'error');

const formatSectionLabel = (contentFile, section) => `${contentFile.contentLabel} [${section.id ?? section.title}]`;

const addContentIssue = (contentFile, issue) => addIssue({
	...issue,
	sectionId: issue.sectionId ?? contentFile.contentLabel,
	sectionLabel: issue.sectionLabel ?? contentFile.contentLabel,
});

const addSectionIssue = (contentFile, section, issue) => addIssue({
	...issue,
	sectionId: issue.sectionId ?? `${contentFile.contentLabel}:${section.id ?? section.title}`,
	sectionLabel: issue.sectionLabel ?? formatSectionLabel(contentFile, section),
});

const getMovePlanLines = (moves) => [
	'Planned image moves:',
	...moves.map((move) => `- ${getCandidateLabel({ contentFile: move.sourceContentFile, imagePath: move.from })} -> ${getExpectedImageLabel(move.contentFile, move.imageName)}`),
];

const promptForWrite = async (moves) => {
	console.log(getMovePlanLines(moves).join('\n'));

	if (skipPrompt) return true;
	if (!process.stdin.isTTY) return false;

	const rl = createInterface({ input, output });
	const answer = await rl.question('This will move image files into the page image roots where Norna references them. Continue? [y/N] ');
	rl.close();

	return answer.trim().toLowerCase() === 'y';
};

const groupIssuesBySeverity = (groupedIssues) => [
	['error', 'Errors'],
	['warning', 'Warnings'],
].map(([severity, label]) => ({
	label,
	issues: groupedIssues.filter((issue) => issue.severity === severity),
})).filter((group) => group.issues.length > 0);

const formatIssue = (issue) => [
	`- ${issue.message}`,
	issue.fix ? `  Fix: ${issue.fix}` : null,
].filter(Boolean);

const getReportLines = (title, unreferencedImages) => {
	const lines = [title];
	const sectionIssues = issues.filter((issue) => issue.sectionId || issue.sectionLabel);
	const globalIssues = issues.filter((issue) => !issue.sectionId && !issue.sectionLabel);

	if (sectionIssues.length > 0) {
		const sectionGroups = new Map();

		for (const issue of sectionIssues) {
			const key = issue.sectionId ?? issue.sectionLabel;
			const label = issue.sectionLabel ?? issue.sectionId;

			if (!sectionGroups.has(key)) {
				sectionGroups.set(key, { label, issues: [] });
			}

			sectionGroups.get(key).issues.push(issue);
		}

		lines.push('', 'Content Issues');

		for (const [, group] of Array.from(sectionGroups.entries()).sort(([left], [right]) => left.localeCompare(right, 'sv'))) {
			lines.push('', `[${group.label}]`);

			for (const severityGroup of groupIssuesBySeverity(group.issues)) {
				lines.push(`  ${severityGroup.label}:`);

				for (const issue of severityGroup.issues) {
					for (const line of formatIssue(issue)) {
						lines.push(`  ${line}`);
					}
				}
			}
		}
	}

	if (globalIssues.length > 0) {
		lines.push('', 'Global Content Issues');

		for (const severityGroup of groupIssuesBySeverity(globalIssues)) {
			lines.push('', `${severityGroup.label}:`);

			for (const issue of severityGroup.issues) {
				lines.push(...formatIssue(issue));
			}
		}
	}

	if (unreferencedImages.length > 0) {
		lines.push(
			'',
			'Unreferenced Images',
			'These files are kept under page image roots but are not referenced by Norna-managed image references:',
		);

		for (const imagePath of unreferencedImages) {
			lines.push(`- ${imagePath}`);
		}
	}

	return lines;
};

const printReport = (title, unreferencedImages) => {
	const lines = getReportLines(title, unreferencedImages);
	const target = hasErrors() ? console.error : console.log;
	target(lines.join('\n'));
};

const getGreatestCommonDivisor = (left, right) => {
	let a = Math.abs(left);
	let b = Math.abs(right);

	while (b !== 0) {
		const next = a % b;
		a = b;
		b = next;
	}

	return a || 1;
};

const getAspectRatioLabel = ({ width, height }) => {
	const divisor = getGreatestCommonDivisor(width, height);
	return `${width / divisor}:${height / divisor}`;
};

const getExpectedImagePath = (contentFile, imageName) =>
	path.join(contentFile.imagesDir, imageName);

const getExpectedImageLabel = (contentFile, imageName) =>
	`${contentFile.imagesLabel}/${imageName}`;

const getGlobalImageCandidates = (globalImageCandidatesByName, imageName, expectedPath) =>
	(globalImageCandidatesByName.get(imageName) ?? []).filter(({ imagePath }) => imagePath !== expectedPath);

const getReferenceLabel = (contentFile, section) => `${contentFile.contentLabel} [${section.id ?? 'page title'}]`;

const getRootLabel = (contentFile) => contentFile.imagesLabel.replace(/\/images$/, '');

const getCandidateLabel = ({ contentFile, imagePath }) =>
	`${contentFile.imagesLabel}/${toPosixPath(path.relative(contentFile.imagesDir, imagePath))}`;

const addExpectedReference = (expectedReferencesByPath, expectedPath, expectedReference) => {
	if (!expectedReferencesByPath.has(expectedPath)) {
		expectedReferencesByPath.set(expectedPath, []);
	}

	expectedReferencesByPath.get(expectedPath).push(expectedReference);
};

const addGlobalImageCandidate = (globalImageCandidatesByName, imageName, candidate) => {
	if (!globalImageCandidatesByName.has(imageName)) {
		globalImageCandidatesByName.set(imageName, []);
	}

	globalImageCandidatesByName.get(imageName).push(candidate);
};

const addConflictingMoveIssues = () => {
	const movesBySource = new Map();
	const movesByDestination = new Map();

	for (const move of imageMoves) {
		const sourceKey = move.from;
		const destinationKey = move.to;

		if (!movesBySource.has(sourceKey)) {
			movesBySource.set(sourceKey, []);
		}
		movesBySource.get(sourceKey).push(move);

		if (!movesByDestination.has(destinationKey)) {
			movesByDestination.set(destinationKey, []);
		}
		movesByDestination.get(destinationKey).push(move);
	}

	for (const moves of movesBySource.values()) {
		const destinations = new Set(moves.map((move) => move.to));
		if (destinations.size <= 1) continue;

		const firstMove = moves[0];
		addSectionIssue(firstMove.contentFile, firstMove.section, {
			severity: 'error',
			message: `Cannot relocate "${firstMove.imageName}" because the same source file is referenced from multiple destinations: ${moves.map((move) => getExpectedImageLabel(move.contentFile, move.imageName)).join(', ')}.`,
			fix: 'Duplicate the image manually or rename one of the image files so each move has a single destination.',
		});
	}

	for (const moves of movesByDestination.values()) {
		const sources = new Set(moves.map((move) => move.from));
		if (sources.size <= 1) continue;

		const firstMove = moves[0];
		addSectionIssue(firstMove.contentFile, firstMove.section, {
			severity: 'error',
			message: `Cannot relocate "${firstMove.imageName}" because multiple source files would move to ${getExpectedImageLabel(firstMove.contentFile, firstMove.imageName)}: ${moves.map((move) => getCandidateLabel(move.sourceContentFile ? { contentFile: move.sourceContentFile, imagePath: move.from } : move)).join(', ')}.`,
			fix: 'Move the intended file manually or rename files so the destination is unambiguous.',
		});
	}
};

const validateImageReference = async (
	contentFile,
	section,
	reference,
	globalImageCandidatesByName,
	expectedReferencesByPath,
) => {
	const imageName = reference.image;
	const expectedPath = getExpectedImagePath(contentFile, imageName);
	const expectedLabel = getExpectedImageLabel(contentFile, imageName);
	const expectedExists = await stat(expectedPath).then((entry) => entry.isFile()).catch(() => false);

	if (expectedExists) {
		referencedImagePaths.add(expectedPath);
		return expectedPath;
	}

	const candidates = getGlobalImageCandidates(globalImageCandidatesByName, imageName, expectedPath);
	if (candidates.length === 0) {
		addSectionIssue(contentFile, section, {
			severity: 'error',
			message: `Image "${imageName}" does not exist at ${expectedLabel} or anywhere under any page image root.`,
			fix: `Add the source image directly to ${contentFile.imagesLabel}/ or remove the Norna-managed image reference.`,
		});
		return null;
	}

	if (candidates.length > 1) {
		addSectionIssue(contentFile, section, {
			severity: 'error',
			message: `Cannot relocate "${imageName}". Multiple files with this filename were found: ${candidates.map(getCandidateLabel).join(', ')}.`,
			fix: 'Move the intended file manually or rename files so the move is unambiguous.',
		});
		return null;
	}

	const sourceCandidate = candidates[0];
	const sourcePath = sourceCandidate.imagePath;
	const referencesAtCurrentLocation = (expectedReferencesByPath.get(sourcePath) ?? [])
		.filter((expectedReference) => expectedReference.contentFile !== contentFile);

	if (referencesAtCurrentLocation.length > 0) {
		addSectionIssue(contentFile, section, {
			severity: 'error',
			message: `Cannot relocate "${imageName}" from ${getCandidateLabel(sourceCandidate)} because it is still referenced from ${referencesAtCurrentLocation.map((expectedReference) => getReferenceLabel(expectedReference.contentFile, expectedReference.section)).join(', ')}.`,
			fix: 'Remove the extra reference, duplicate the image file manually, or rename one of the image files so the intended move is unambiguous.',
		});
		return null;
	}

	if (!imageMoves.some((move) => move.from === sourcePath && move.to === expectedPath)) {
		imageMoves.push({
			imageName,
			from: sourcePath,
			to: expectedPath,
			contentFile,
			sourceContentFile: sourceCandidate.contentFile,
			section,
		});
	}
	referencedImagePaths.add(sourcePath);

	if (!shouldWrite) {
		addSectionIssue(contentFile, section, {
			severity: 'error',
			message: `Image "${imageName}" is used here but is located in ${getCandidateLabel(sourceCandidate)}.`,
			fix: sourceCandidate.contentFile === contentFile
				? 'Run norna content:sync to move it directly into the current page image root.'
				: `Run norna content:sync to move it from ${getRootLabel(sourceCandidate.contentFile)} to ${getRootLabel(contentFile)}.`,
		});
	}

	return sourcePath;
};

const warnAboutCarouselAspectRatios = async (contentFile, section, block, sourcePathsByImage) => {
	if (block.type !== 'image-carousel') return;

	const imagesWithRatios = [];
	const imagesWithoutRatios = [];
	for (const image of block.images) {
		const imagePath = sourcePathsByImage.get(image.image);
		if (!imagePath) continue;

		const dimensions = await readImageDimensions(imagePath).catch(() => null);
		if (!dimensions) {
			imagesWithoutRatios.push(image.image);
			continue;
		}

		imagesWithRatios.push({
			image: image.image,
			ratio: getAspectRatioLabel(dimensions),
		});
	}

	if (imagesWithoutRatios.length > 0) {
		addSectionIssue(contentFile, section, {
			severity: 'warning',
			message: `Carousel on line ${block.line} uses images without an intrinsic aspect ratio: ${imagesWithoutRatios.join(', ')}.`,
			fix: 'For SVG images, add a viewBox or numeric width and height when stable carousel sizing matters.',
		});
	}

	const ratios = new Set(imagesWithRatios.map(({ ratio }) => ratio));
	if (ratios.size <= 1) return;

	addSectionIssue(contentFile, section, {
		severity: 'warning',
		message: `Carousel on line ${block.line} uses images with different aspect ratios: ${imagesWithRatios.map(({ image, ratio }) => `${image} (${ratio})`).join(', ')}.`,
		fix: 'Use images with exactly matching proportions in the same carousel to avoid uneven layout and motion.',
	});
};

let themeFrontmatter = null;
try {
	themeFrontmatter = (await readThemeFile(siteThemePath)).frontmatter;
	validateFrontmatterIndentation(themeFrontmatter, addIssue);
	validateThemeYamlStructure(themeFrontmatter, addIssue);
} catch (error) {
	if (error?.code !== 'ENOENT') {
		throw error;
	}
}

const siteStructure = await getSiteStructure();
const contentFiles = siteStructure.contentFiles;
for (const warning of siteStructure.warnings) {
	addIssue({
		severity: 'warning',
		message: warning.message,
		sectionId: warning.label,
		sectionLabel: warning.label,
	});
}
const allImageFiles = [];
const contentFileContexts = [];
const globalImageCandidatesByName = new Map();
const globalExpectedReferencesByPath = new Map();

for (const contentFile of contentFiles) {
	const { frontmatter, body } = await readSiteFile(contentFile.contentPath, contentFile.contentLabel);
	const bodyLineOffset = frontmatter.split(/\r?\n/).length - 1;
	validateFrontmatterIndentation(frontmatter, addIssue);
	validateContentFrontmatterStructure(frontmatter, addIssue);

	const page = await parsePageMarkdown(body, {
		label: contentFile.contentLabel,
		lineOffset: bodyLineOffset,
	});
	const {
		headingIssues: headingIdentifierIssues,
		pageHeadings,
		prelude,
		regions: sections,
	} = page;
	const invalidHeadingLines = new Set();
	for (const issue of headingIdentifierIssues) {
		invalidHeadingLines.add(issue.heading.line);
		if (issue.otherHeading) invalidHeadingLines.add(issue.otherHeading.line);
		const line = bodyLineOffset + issue.heading.line;
		const relatedLine = issue.otherHeading
			? ` The other heading is on line ${bodyLineOffset + issue.otherHeading.line}.`
			: '';
		addIssue({
			severity: 'error',
			message: `${contentFile.contentLabel} line ${line}: ${issue.message}${relatedLine}`,
			fix: issue.fix,
			sectionId: `${contentFile.contentLabel}:heading:${issue.heading.line}`,
			sectionLabel: `${contentFile.contentLabel} line ${line}`,
		});
	}
	const sectionsById = new Map();
	const blockResultsBySection = new Map();
	const validSections = new Set();
	const imageCandidatesByName = await getImageCandidatesByName(contentFile.imagesDir);

	for (const [imageName, candidates] of imageCandidatesByName) {
		for (const imagePath of candidates) {
			const candidate = { contentFile, imagePath };
			allImageFiles.push(candidate);
			addGlobalImageCandidate(globalImageCandidatesByName, imageName, candidate);
		}
	}

	if (pageHeadings.length === 0) {
		addContentIssue(contentFile, {
			severity: 'error',
			message: 'The page is missing its Markdown H1 title.',
			fix: 'Add exactly one page title before any sections, for example "# About".',
		});
	} else if (pageHeadings.length > 1) {
		addContentIssue(contentFile, {
			severity: 'error',
			message: `The page contains ${pageHeadings.length} Markdown H1 headings.`,
			fix: 'Keep exactly one H1 page title. Use level 2 headings with explicit ids for sections.',
		});
	}

	if (sections[0] && sections[0].kind !== 'page-intro') {
		addContentIssue(contentFile, {
			severity: 'error',
			message: `The first content heading is "${sections[0].title}", but a Norna page must start with its H1 title.`,
			fix: 'Add the page title first, for example "# About".',
		});
	}

	if (prelude.trim()) {
		addContentIssue(contentFile, {
			severity: 'error',
			message: 'The page contains content before its first heading.',
			fix: 'Make the Markdown H1 page title the first content after optional frontmatter.',
		});
	}

	for (const section of sections) {
		if (section.kind === 'page-intro') {
			if (
				pageHeadings.length === 1
				&& sections[0] === section
				&& !invalidHeadingLines.has(section.bodyLine)
			) {
				validSections.add(section);
			}
			continue;
		}

		if (invalidHeadingLines.has(section.bodyLine) || !section.id) continue;

		if (sectionsById.has(section.id)) {
			addSectionIssue(contentFile, section, {
				severity: 'error',
				message: `Duplicate Markdown heading id "${section.id}".`,
				fix: 'Add a unique explicit id to at least one heading.',
			});
			continue;
		}

		sectionsById.set(section.id, section);
		validSections.add(section);
	}

	for (const section of sections) {
		if (!validSections.has(section)) continue;

		const blockResults = { blocks: section.blocks, errors: section.blockErrors };
		blockResultsBySection.set(section, blockResults);

		for (const error of section.noteErrors) {
			addSectionIssue(contentFile, section, {
				severity: 'error',
				message: error.message,
			});
		}

		for (const reference of section.managedImages) {
			const expectedPath = getExpectedImagePath(contentFile, reference.image);
			addExpectedReference(globalExpectedReferencesByPath, expectedPath, { contentFile, section, reference });
		}
	}

	contentFileContexts.push({
		contentFile,
		sections,
		validSections,
		blockResultsBySection,
		body,
	});
}

for (const context of contentFileContexts) {
	const {
		contentFile,
		sections,
		validSections,
		blockResultsBySection,
		body,
	} = context;

	for (const styleName of new Set(getDeprecatedInlineStyleReferences(body))) {
		addContentIssue(contentFile, {
			severity: 'error',
			message: `Inline color style ".${styleName}" is no longer supported in ${contentFile.contentLabel}.`,
			fix: 'Use standard Markdown emphasis, a blockquote, or a semantic Norna block instead of color syntax.',
		});
	}

	for (const section of sections) {
		if (!validSections.has(section)) continue;

		for (const reference of section.markdownImages) {
			addSectionIssue(contentFile, section, {
				severity: 'warning',
				message: `Markdown image "${reference.target}" references a local image that is not managed by Norna.`,
				fix: 'Use a norna-image-stack, norna-image-carousel, or norna-card-list block for site images that should be validated, processed and synced.',
			});
		}

		const { blocks, errors: blockErrors } = blockResultsBySection.get(section) ?? { blocks: [], errors: [] };
		for (const error of blockErrors) {
			addSectionIssue(contentFile, section, {
				severity: 'error',
				message: error.message,
			});
		}

		for (const block of blocks) {
			if (block.type === 'image-carousel' && block.images.length < 2) {
				addSectionIssue(contentFile, section, {
					severity: 'error',
					message: `norna-image-carousel on line ${block.line} contains ${block.images.length} image. A carousel needs at least two images.`,
					fix: 'Add another image entry, or use norna-image-stack for a single image.',
				});
			}
		}

		const sourcePathsByImage = new Map();
		for (const reference of section.managedImages) {
			const sourcePath = await validateImageReference(
				contentFile,
				section,
				reference,
				globalImageCandidatesByName,
				globalExpectedReferencesByPath,
			);
			if (sourcePath) {
				sourcePathsByImage.set(reference.image, sourcePath);
			}
		}

		for (const block of blocks) {
			await warnAboutCarouselAspectRatios(contentFile, section, block, sourcePathsByImage);
		}
	}
}

const unreferencedImages = allImageFiles
	.filter(({ imagePath }) => !referencedImagePaths.has(imagePath))
	.map(({ contentFile, imagePath }) => `${contentFile.imagesLabel}/${toPosixPath(path.relative(contentFile.imagesDir, imagePath))}`)
	.sort((left, right) => left.localeCompare(right, 'sv'));

addConflictingMoveIssues();

if (hasErrors()) {
	printReport(shouldWrite ? 'Content sync failed.' : 'Content check failed.', unreferencedImages);
	process.exit(1);
}

if (shouldCheck) {
	const title = issues.length > 0 || unreferencedImages.length > 0
		? 'Content check completed with warnings.'
		: 'Content check passed.';
	printReport(title, unreferencedImages);
	process.exit(0);
}

if (imageMoves.length === 0) {
	console.log('No content sync needed.');
	process.exit(0);
}

const canWrite = await promptForWrite(imageMoves);
if (!canWrite) {
	console.log('Aborted. No file was changed.');
	process.exit(1);
}

const completedMoves = [];
for (const [index, move] of imageMoves.entries()) {
	try {
		await mkdir(path.dirname(move.to), { recursive: true });
		await rename(move.from, move.to);
		completedMoves.push(move);
		console.log(`Moved image "${move.imageName}" to ${move.contentFile.imagesLabel}/.`);
	} catch (error) {
		const sourceLabel = getCandidateLabel({ contentFile: move.sourceContentFile, imagePath: move.from });
		const destinationLabel = getExpectedImageLabel(move.contentFile, move.imageName);
		const remainingMoves = imageMoves.slice(index);
		const lines = [
			'',
			`Content sync stopped after ${completedMoves.length} of ${imageMoves.length} image moves.`,
		];

		if (error?.code === 'EXDEV') {
			lines.push(
				`Cannot move "${move.imageName}" because the source and destination are on different filesystems.`,
				`Move it manually from ${sourceLabel} to ${destinationLabel}.`,
			);
		} else {
			lines.push(
				`Could not move "${move.imageName}" from ${sourceLabel} to ${destinationLabel}.`,
				`Filesystem error${error?.code ? ` (${error.code})` : ''}: ${error?.message ?? String(error)}`,
			);
		}

		if (completedMoves.length > 0) {
			lines.push('', 'Completed moves:', ...getMovePlanLines(completedMoves).slice(1));
		}

		lines.push(
			'',
			'Remaining moves:',
			...getMovePlanLines(remainingMoves).slice(1),
			'',
			'Fix the reported filesystem problem, then run content:sync again. Already completed moves will be kept.',
		);

		console.error(lines.join('\n'));
		process.exit(1);
	}
}
