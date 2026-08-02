import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { siteContentLabel, siteImagesLabel } from './site-paths.mjs';

export const supportedImageExtensions = new Set(['.jpg', '.jpeg', '.png']);

const h2Regex = /^##\s+.*$/gm;
const explicitHeadingIdRegex = /\s*\{#([a-z0-9-]+)\}\s*$/;
const inlineStyleReferenceRegex = /\[[^\]\n]+\]\{\.([a-z][a-z0-9-]*)\}/g;

export const toPosixPath = (filePath) => filePath.split(path.sep).join('/');

export const splitSiteFile = (source) => {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

	if (!match) {
		throw new Error(`${siteContentLabel} is missing frontmatter delimited by ---.`);
	}

	return {
		frontmatter: match[0],
		frontmatterBody: match[1],
		body: source.slice(match[0].length),
	};
};

export const readSiteFile = async (sitePath) => splitSiteFile(await readFile(sitePath, 'utf8'));

export const getFrontmatterSections = (frontmatter) => {
	const sections = [];
	const lines = frontmatter.split(/\r?\n/);
	let inSections = false;
	let currentSection = null;

	for (const [index, line] of lines.entries()) {
		if (/^sections:\s*$/.test(line)) {
			inSections = true;
			continue;
		}

		if (!inSections) continue;
		if (/^[a-zA-Z0-9_-]+:/.test(line)) break;

		const sectionMatch = line.match(/^\s{2}-\s+id:\s*([a-z0-9-]+)\s*$/);
		if (sectionMatch) {
			currentSection = { id: sectionMatch[1], images: [], imageReferences: [], carousels: [] };
			sections.push(currentSection);
			continue;
		}

		const carouselMatch = line.match(/^\s{6}-\s+carousel:\s*$/);
		if (carouselMatch && currentSection) {
			currentSection.carousels.push({ images: [], imageReferences: [], line: index + 1 });
			continue;
		}

		const imageMatch = line.match(/^\s{6,}-\s+image:\s*["']?([^"'\n]+)["']?\s*$/);
		if (imageMatch && currentSection) {
			const image = imageMatch[1].trim();
			const isCarouselImage = /^\s{10}-\s+image:/.test(line);
			const carousel = isCarouselImage ? currentSection.carousels.at(-1) : null;
			currentSection.images.push(image);
			currentSection.imageReferences.push({ image, line: index + 1 });
			if (carousel) {
				carousel.images.push(image);
				carousel.imageReferences.push({ image, line: index + 1 });
			}
		}
	}

	return sections;
};

export const getFrontmatterInlineStyleNames = (frontmatter) => {
	const names = new Set();
	const lines = frontmatter.split(/\r?\n/);
	let inlineStylesIndent = null;

	for (const line of lines) {
		const inlineStylesMatch = line.match(/^(\s*)inlineStyles:\s*$/);

		if (inlineStylesMatch) {
			inlineStylesIndent = inlineStylesMatch[1].length;
			continue;
		}

		if (inlineStylesIndent === null) continue;
		if (!line.trim() || line.trim().startsWith('#')) continue;

		const indent = line.match(/^\s*/)?.[0].length ?? 0;
		if (indent <= inlineStylesIndent) {
			inlineStylesIndent = null;
			continue;
		}

		const nameMatch = line.match(new RegExp(`^\\s{${inlineStylesIndent + 2}}([a-z][a-z0-9-]*):\\s*$`));
		if (nameMatch) {
			names.add(nameMatch[1]);
		}
	}

	return names;
};

export const getInlineStyleReferences = (body) => Array.from(body.matchAll(inlineStyleReferenceRegex))
	.map((match) => match[1]);

export const getHeadingId = (heading) => heading.match(explicitHeadingIdRegex)?.[1];

export const getBodySections = (body) => {
	const matches = Array.from(body.matchAll(h2Regex));
	const prelude = matches.length > 0 ? body.slice(0, matches[0].index) : body;
	const sections = [];

	for (let index = 0; index < matches.length; index += 1) {
		const match = matches[index];
		const start = match.index ?? 0;
		const next = matches[index + 1];
		const end = next?.index ?? body.length;
		const text = body.slice(start, end).trimEnd();
		const heading = match[0];
		const id = getHeadingId(heading);

		sections.push({ id, heading, text });
	}

	return { prelude, sections };
};

export const getImageFiles = async (directory) => {
	const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
		if (error?.code === 'ENOENT') {
			return [];
		}

		throw error;
	});
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			files.push(...await getImageFiles(entryPath));
		} else if (entry.isFile() && supportedImageExtensions.has(path.extname(entry.name).toLowerCase())) {
			files.push(entryPath);
		}
	}

	return files;
};

export const getImageIndex = async (contentDir, fail) => {
	const imageFiles = await getImageFiles(contentDir);
	const imagesByName = new Map();

	for (const imagePath of imageFiles) {
		const imageName = path.basename(imagePath);
		const existingPath = imagesByName.get(imageName);

		if (existingPath) {
			fail(`Duplicate image filename "${imageName}" found at ${siteImagesLabel}/${toPosixPath(path.relative(contentDir, existingPath))} and ${siteImagesLabel}/${toPosixPath(path.relative(contentDir, imagePath))}. Image filenames must be globally unique.`);
			continue;
		}

		imagesByName.set(imageName, imagePath);
	}

	return imagesByName;
};
