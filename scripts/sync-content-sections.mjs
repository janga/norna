import { mkdir, rename, stat } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import path from 'node:path';
import {
	extractMarkdownImageReferences,
	extractNornaMarkdownBlockDiagnostics,
	getNornaBlockImageReferences,
} from './lib/norna-markdown-blocks.mjs';
import {
	getBodySections,
	getContentFiles,
	getFrontmatterInlineStyleNames,
	getFrontmatterSections,
	getImageCandidatesByName,
	getInlineStyleReferences,
	readSiteFile,
	readThemeFile,
	toPosixPath,
	validateContentFrontmatterStructure,
	validateFrontmatterIndentation,
	validateThemeFrontmatterStructure,
} from './lib/site-content.mjs';
import { readImageDimensions } from './lib/image-dimensions.mjs';
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

const formatSectionLabel = (contentFile, section) => `${contentFile.contentLabel} [${section.id ?? section.heading}]`;

const addContentIssue = (contentFile, issue) => addIssue({
	...issue,
	sectionId: issue.sectionId ?? contentFile.contentLabel,
	sectionLabel: issue.sectionLabel ?? contentFile.contentLabel,
});

const addSectionIssue = (contentFile, section, issue) => addIssue({
	...issue,
	sectionId: issue.sectionId ?? `${contentFile.contentLabel}:${section.id ?? section.heading}`,
	sectionLabel: issue.sectionLabel ?? formatSectionLabel(contentFile, section),
});

const promptForWrite = async () => {
	if (skipPrompt) return true;
	if (!process.stdin.isTTY) return false;

	const rl = createInterface({ input, output });
	const answer = await rl.question('This will move image files inside their current page or route image root if needed. Continue? [y/N] ');
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
			'These files are kept under page or route image roots but are not referenced by Norna image blocks:',
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

const getExpectedImagePath = (contentFile, sectionId, imageName) =>
	path.join(contentFile.imagesDir, sectionId, imageName);

const getExpectedImageLabel = (contentFile, sectionId, imageName) =>
	`${contentFile.imagesLabel}/${sectionId}/${imageName}`;

const getImageCandidates = (imageCandidatesByName, imageName, expectedPath) =>
	(imageCandidatesByName.get(imageName) ?? []).filter((candidate) => candidate !== expectedPath);

const getReferenceLabel = (contentFile, section) => `${contentFile.contentLabel} [${section.id}]`;

const validateImageReference = async (
	contentFile,
	section,
	reference,
	imageCandidatesByName,
	expectedReferencesByPath,
) => {
	const imageName = reference.image;
	const expectedPath = getExpectedImagePath(contentFile, section.id, imageName);
	const expectedLabel = getExpectedImageLabel(contentFile, section.id, imageName);
	const expectedExists = await stat(expectedPath).then((entry) => entry.isFile()).catch(() => false);

	if (expectedExists) {
		referencedImagePaths.add(expectedPath);
		return expectedPath;
	}

	const candidates = getImageCandidates(imageCandidatesByName, imageName, expectedPath);
	if (candidates.length === 0) {
		addSectionIssue(contentFile, section, {
			severity: 'error',
			message: `Image "${imageName}" does not exist at ${expectedLabel} or anywhere under ${contentFile.imagesLabel}/.`,
			fix: `Add the source image to ${contentFile.imagesLabel}/${section.id}/ or remove the Norna image block reference.`,
		});
		return null;
	}

	if (candidates.length > 1) {
		addSectionIssue(contentFile, section, {
			severity: 'error',
			message: `Cannot relocate "${imageName}". Multiple files with this filename were found: ${candidates.map((candidate) => `${contentFile.imagesLabel}/${toPosixPath(path.relative(contentFile.imagesDir, candidate))}`).join(', ')}.`,
			fix: 'Move the intended file manually or rename files so the local move is unambiguous.',
		});
		return null;
	}

	const sourcePath = candidates[0];
	const referencesAtCurrentLocation = (expectedReferencesByPath.get(sourcePath) ?? [])
		.filter((expectedReference) => expectedReference.section.id !== section.id);

	if (referencesAtCurrentLocation.length > 0) {
		addSectionIssue(contentFile, section, {
			severity: 'error',
			message: `Cannot relocate "${imageName}" from ${contentFile.imagesLabel}/${toPosixPath(path.relative(contentFile.imagesDir, sourcePath))} because it is still referenced from ${referencesAtCurrentLocation.map((expectedReference) => getReferenceLabel(contentFile, expectedReference.section)).join(', ')}.`,
			fix: 'Remove the extra reference, duplicate the image file manually, or rename one of the image files so the intended move is unambiguous.',
		});
		return null;
	}

	imageMoves.push({
		imageName,
		from: sourcePath,
		to: expectedPath,
		contentFile,
		sectionId: section.id,
	});
	referencedImagePaths.add(sourcePath);

	if (!shouldWrite) {
		addSectionIssue(contentFile, section, {
			severity: 'error',
			message: `Image "${imageName}" is used here but is located in ${contentFile.imagesLabel}/${toPosixPath(path.relative(contentFile.imagesDir, sourcePath))}.`,
			fix: 'Run norna content:sync to move it inside the current page or route image root.',
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
	validateThemeFrontmatterStructure(themeFrontmatter, addIssue);
} catch (error) {
	if (error?.code !== 'ENOENT') {
		throw error;
	}
}

const themeInlineStyleNames = themeFrontmatter
	? getFrontmatterInlineStyleNames(themeFrontmatter)
	: new Set();

const contentFiles = await getContentFiles();
const allImageFiles = [];

for (const contentFile of contentFiles) {
	const { frontmatter, body } = await readSiteFile(contentFile.contentPath, contentFile.contentLabel);
	const bodyLineOffset = frontmatter.split(/\r?\n/).length - 1;
	validateFrontmatterIndentation(frontmatter, addIssue);
	validateContentFrontmatterStructure(frontmatter, addIssue);

	const frontmatterSections = getFrontmatterSections(frontmatter);
	const frontmatterIds = new Set(frontmatterSections.map((section) => section.id));
	const { sections } = getBodySections(body);
	const sectionsById = new Map();
	const blockResultsBySectionId = new Map();
	const expectedReferencesByPath = new Map();
	const imageCandidatesByName = await getImageCandidatesByName(contentFile.imagesDir);

	for (const candidates of imageCandidatesByName.values()) {
		allImageFiles.push(...candidates.map((imagePath) => ({ contentFile, imagePath })));
	}

	for (const section of sections) {
		if (!section.id) {
			addSectionIssue(contentFile, section, {
				severity: 'error',
				message: `Section heading "${section.heading.replace(/^##\s+/, '')}" is missing an explicit id.`,
				fix: `Write it as: ${section.heading} {#section-id}`,
			});
			continue;
		}

		if (sectionsById.has(section.id)) {
			addSectionIssue(contentFile, section, {
				severity: 'error',
				message: `Duplicate Markdown section heading id "${section.id}".`,
				fix: 'Each Markdown level 2 section heading must use a unique explicit id within the page.',
			});
			continue;
		}

		sectionsById.set(section.id, section);
	}

	for (const section of sections) {
		if (!section.id || !sectionsById.has(section.id)) continue;

		const blockResults = extractNornaMarkdownBlockDiagnostics(section.text, {
			label: contentFile.contentLabel,
			lineOffset: bodyLineOffset + section.line - 1,
		});
		blockResultsBySectionId.set(section.id, blockResults);

		for (const reference of getNornaBlockImageReferences(blockResults.blocks)) {
			const expectedPath = getExpectedImagePath(contentFile, section.id, reference.image);
			if (!expectedReferencesByPath.has(expectedPath)) {
				expectedReferencesByPath.set(expectedPath, []);
			}
			expectedReferencesByPath.get(expectedPath).push({ section, reference });
		}
	}

	for (const id of frontmatterIds) {
		if (!sectionsById.has(id)) {
			addContentIssue(contentFile, {
				severity: 'error',
				message: `Section metadata "${id}" does not match any Markdown section.`,
				fix: `Add a level 2 Markdown heading, for example "## Heading {#${id}}", or remove sections.${id}.`,
			});
		}
	}

	for (const styleName of new Set(getInlineStyleReferences(body))) {
		if (!themeInlineStyleNames.has(styleName)) {
			addContentIssue(contentFile, {
				severity: 'error',
				message: `Inline style ".${styleName}" is used in ${contentFile.contentLabel} but is not defined in ${siteThemeLabel} presentation.inlineStyles.`,
				fix: `Add presentation.inlineStyles.${styleName} to ${siteThemeLabel} or remove "{.${styleName}}" from Markdown.`,
			});
		}
	}

	for (const section of sections) {
		if (!section.id || !sectionsById.has(section.id)) continue;

		const markdownImages = extractMarkdownImageReferences(section.text);
		for (const reference of markdownImages) {
			addSectionIssue(contentFile, section, {
				severity: 'warning',
				message: `Markdown image "${reference.target}" references a local image that is not managed by Norna.`,
				fix: 'Use a norna-image-stack or norna-image-carousel block for site images that should be validated, processed and synced.',
			});
		}

		const { blocks, errors: blockErrors } = blockResultsBySectionId.get(section.id) ?? { blocks: [], errors: [] };
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
		for (const reference of getNornaBlockImageReferences(blocks)) {
			const sourcePath = await validateImageReference(
				contentFile,
				section,
				reference,
				imageCandidatesByName,
				expectedReferencesByPath,
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

const canWrite = await promptForWrite();
if (!canWrite) {
	console.log('Aborted. No file was changed.');
	process.exit(1);
}

for (const move of imageMoves) {
	await mkdir(path.dirname(move.to), { recursive: true });
	await rename(move.from, move.to);
	console.log(`Moved image "${move.imageName}" to ${move.contentFile.imagesLabel}/${move.sectionId}/.`);
}
