import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import {
	getBodySections,
	getContentFiles,
	readSiteFile,
	supportedImageExtensions,
	toPosixPath,
} from './lib/site-content.mjs';
import {
	extractNornaMarkdownBlocks,
	getNornaBlockImageReferences,
} from './lib/norna-markdown-blocks.mjs';
import {
	astroPublicDir,
	generatedImagesDir,
	generatedImagesManifestPath,
	originalImagesDir,
	siteDir,
	siteImagesDir,
} from './lib/site-paths.mjs';

const execFileAsync = promisify(execFile);

const imageOutputVersion = 2;
const sourceHashSlugLength = 8;
const widths = [480, 768, 1080, 1440, 1920];

const run = async (command, args) => {
	const { stdout } = await execFileAsync(command, args, { maxBuffer: 1024 * 1024 * 10 });
	return stdout.trim();
};

const canRun = async (command, args = ['-version']) => {
	try {
		await run(command, args);
		return true;
	} catch {
		return false;
	}
};

const getImageMagick = async () => {
	if (await canRun('magick')) {
		return {
			identify: (sourcePath) => run('magick', ['identify', '-format', '%w %h', sourcePath]),
			convert: (sourcePath, outputPath, width) => run('magick', [
				sourcePath,
				'-auto-orient',
				'-resize',
				`${width}x`,
				'-strip',
				'-quality',
				'82',
				outputPath,
			]),
		};
	}

	if (await canRun('identify') && await canRun('convert')) {
		return {
			identify: (sourcePath) => run('identify', ['-format', '%w %h', sourcePath]),
			convert: (sourcePath, outputPath, width) => run('convert', [
				sourcePath,
				'-auto-orient',
				'-resize',
				`${width}x`,
				'-strip',
				'-quality',
				'82',
				outputPath,
			]),
		};
	}

	throw new Error('ImageMagick is missing. Install either the "magick" command or both "identify" and "convert".');
};

const toPublicPath = (filePath) => filePath.split(path.sep).join('/');
const getPublicPath = (filePath) => `/${toPublicPath(path.relative(astroPublicDir, filePath))}`;
const getFilePathFromPublicPath = (publicPath) => path.join(astroPublicDir, publicPath.replace(/^\//, ''));

const getSourceHashSlug = (sourceHash) => sourceHash.slice(0, sourceHashSlugLength);

const getGeneratedPath = (sourcePath, sourceHash, width) => {
	const parsed = path.parse(path.relative(siteImagesDir, sourcePath).startsWith('..')
		? path.relative(path.dirname(siteImagesDir), sourcePath)
		: path.relative(siteImagesDir, sourcePath));
	return path.join(generatedImagesDir, parsed.dir, `${parsed.name}-${getSourceHashSlug(sourceHash)}-${width}.webp`);
};

const fail = (message) => {
	throw new Error(message);
};

const getImageSourceKey = (contentFile, sectionId, image) => (
	contentFile.isHome
		? `images/${sectionId}/${image}`
		: `routes/${contentFile.routeDirectory}/images/${sectionId}/${image}`
);

const getReferencedImages = async (contentFile) => {
	const { body } = await readSiteFile(contentFile.contentPath, contentFile.contentLabel);
	const { sections } = getBodySections(body);
	const references = [];

	for (const section of sections) {
		if (!section.id) {
			fail(`${contentFile.contentLabel}: section heading "${section.heading}" is missing an explicit id.`);
		}

		const blocks = extractNornaMarkdownBlocks(section.text, { label: contentFile.contentLabel });
		for (const { image, line, blockDisplayType } of getNornaBlockImageReferences(blocks)) {
			references.push({
				contentFile,
				image,
				line,
				blockDisplayType,
				sectionId: section.id,
				sourceKey: getImageSourceKey(contentFile, section.id, image),
			});
		}
	}

	return references;
};

const getContentSourcePath = ({ image, sourceKey }) => {
	if (image.includes('/') || image.includes('\\') || image.startsWith('/')) {
		fail(`Image reference must be a filename without a directory: ${image}`);
	}

	const extension = path.extname(image).toLowerCase();
	if (!supportedImageExtensions.has(extension)) {
		fail(`Image reference uses an unsupported file type: ${image}`);
	}

	return path.join(siteDir, sourceKey);
};

const getReferencedSources = async () => {
	const contentFiles = await getContentFiles();
	const seen = new Set();
	const sources = [];

	for (const contentFile of contentFiles) {
		const references = await getReferencedImages(contentFile);

		for (const reference of references) {
			const sourcePath = getContentSourcePath(reference);
			const siteImagePath = toPosixPath(path.relative(contentFile.imagesDir, sourcePath));
			const imageName = path.basename(sourcePath);

			if (seen.has(reference.sourceKey)) {
				continue;
			}

			const fileStat = await stat(sourcePath).catch(() => null);
			if (!fileStat?.isFile()) {
				fail(`Image file does not exist: ${contentFile.imagesLabel}/${siteImagePath}`);
			}

			const currentDirectory = path.basename(path.dirname(sourcePath));
			if (reference.sectionId && currentDirectory !== reference.sectionId) {
				fail(`Image "${imageName}" is used in section "${reference.sectionId}" but is located in ${contentFile.imagesLabel}/${currentDirectory}/. Run norna content:sync, or npm run norna:sync in starter-style repositories, to move it.`);
			}

			seen.add(reference.sourceKey);
			sources.push({ sourcePath, sourceKey: reference.sourceKey, reference });
		}
	}

	return sources.sort((left, right) => left.sourceKey.localeCompare(right.sourceKey, 'sv'));
};

const getOrientation = ({ width, height }) => {
	if (width === height) return 'square';
	return width > height ? 'landscape' : 'portrait';
};

const validateCarouselOrientations = async (manifest) => {
	const contentFiles = await getContentFiles();

	for (const contentFile of contentFiles) {
		const { body } = await readSiteFile(contentFile.contentPath, contentFile.contentLabel);
		const { sections } = getBodySections(body);

		for (const section of sections) {
			if (!section.id) continue;

			const blocks = extractNornaMarkdownBlocks(section.text, { label: contentFile.contentLabel });
			for (const block of blocks.filter((candidate) => candidate.type === 'image-carousel')) {
				const orientations = new Set(
					block.images
						.map((image) => manifest[getImageSourceKey(contentFile, section.id, image.image)])
						.filter(Boolean)
						.map(getOrientation)
				);

				orientations.delete('square');
				if (orientations.size > 1) {
					throw new Error(
						`Carousel in section "${section.id}" on line ${block.line} mixes landscape and portrait images. Use landscape images with optional square images, or portrait images with optional square images.`,
					);
				}
			}
		}
	}
};

const identify = async (sourcePath) => {
	const output = await imageMagick.identify(sourcePath);
	const [width, height] = output.split(' ').map(Number);
	return { width, height };
};

const convert = async (sourcePath, outputPath, width) => {
	await mkdir(path.dirname(outputPath), { recursive: true });
	await imageMagick.convert(sourcePath, outputPath, width);
};

const getHash = (value) => createHash('sha256').update(value).digest('hex');

const getSourceHash = async (sourcePath) => {
	const file = await readFile(sourcePath);
	return getHash(file);
};

const getVariantWidths = ({ width }) => {
	const variantWidths = widths.filter((candidateWidth) => candidateWidth <= width);

	if (!variantWidths.includes(width)) {
		variantWidths.push(width);
	}

	return variantWidths;
};

const getVariants = (sourcePath, sourceHash, variantWidths) => variantWidths.map((width) => ({
	src: getPublicPath(getGeneratedPath(sourcePath, sourceHash, width)),
	width,
}));

const readManifest = async () => {
	try {
		return JSON.parse(await readFile(generatedImagesManifestPath, 'utf8'));
	} catch (error) {
		if (error?.code === 'ENOENT') {
			return {};
		}

		throw error;
	}
};

const fileExists = async (filePath) => {
	const fileStat = await stat(filePath).catch(() => null);
	return fileStat?.isFile() ?? false;
};

const hasGeneratedVariants = async (variants) => {
	for (const variant of variants) {
		if (!(await fileExists(getFilePathFromPublicPath(variant.src)))) {
			return false;
		}
	}

	return true;
};

const getReusableEntry = async (sourcePath, previousEntry, sourceHash) => {
	if (
		previousEntry?.sourceHash !== sourceHash
		|| previousEntry?.outputVersion !== imageOutputVersion
		|| !Number.isFinite(previousEntry?.width)
		|| !Number.isFinite(previousEntry?.height)
	) {
		return null;
	}

	const variants = getVariants(sourcePath, sourceHash, getVariantWidths(previousEntry));

	if (!(await hasGeneratedVariants(variants))) {
		return null;
	}

	return {
		outputVersion: imageOutputVersion,
		sourceHash,
		width: previousEntry.width,
		height: previousEntry.height,
		variants,
	};
};

const listGeneratedFiles = async (directory) => {
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
			files.push(...await listGeneratedFiles(entryPath));
		} else if (entry.isFile()) {
			files.push(entryPath);
		}
	}

	return files;
};

const removeUnreferencedGeneratedFiles = async (manifest) => {
	const expectedFiles = new Set(
		Object.values(manifest)
			.flatMap((entry) => entry.variants ?? [])
			.map((variant) => getFilePathFromPublicPath(variant.src)),
	);
	const generatedFiles = await listGeneratedFiles(generatedImagesDir);

	for (const generatedFile of generatedFiles) {
		if (!expectedFiles.has(generatedFile)) {
			await rm(generatedFile, { force: true });
		}
	}
};

await rm(originalImagesDir, { recursive: true, force: true });
await mkdir(generatedImagesDir, { recursive: true });

const previousManifest = await readManifest();
const sources = await getReferencedSources();
const manifest = {};

if (sources.length === 0) {
	await removeUnreferencedGeneratedFiles(manifest);
	await mkdir(path.dirname(generatedImagesManifestPath), { recursive: true });
	await writeFile(generatedImagesManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
	process.exit(0);
}

const imageMagick = await getImageMagick();

for (const { sourcePath, sourceKey } of sources) {
	const sourceHash = await getSourceHash(sourcePath);
	const reusableEntry = await getReusableEntry(sourcePath, previousManifest[sourceKey], sourceHash);

	if (reusableEntry) {
		manifest[sourceKey] = reusableEntry;
		continue;
	}

	const dimensions = await identify(sourcePath);
	const variantWidths = getVariantWidths(dimensions);
	const variants = getVariants(sourcePath, sourceHash, variantWidths);
	for (const width of variantWidths) {
		const outputPath = getGeneratedPath(sourcePath, sourceHash, width);
		await convert(sourcePath, outputPath, width);
	}

	manifest[sourceKey] = {
		outputVersion: imageOutputVersion,
		sourceHash,
		width: dimensions.width,
		height: dimensions.height,
		variants,
	};
}

await validateCarouselOrientations(manifest);
await removeUnreferencedGeneratedFiles(manifest);
await mkdir(path.dirname(generatedImagesManifestPath), { recursive: true });
await writeFile(generatedImagesManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
