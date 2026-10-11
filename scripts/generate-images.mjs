import { getPageImageSourceKey } from './lib/site-conventions.mjs';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readdir, readFile, rm, stat, lstat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	getContentFiles,
	readSiteFile,
	staticImageExtensions,
	supportedImageExtensions,
	toPosixPath,
} from './lib/site-content.mjs';
import { readImageDimensions } from './lib/image-dimensions.mjs';
import { parsePageMarkdown } from './lib/page-markdown.mjs';
import {
	astroPublicDir,
	generatedImagesDir,
	generatedImagesManifestPath,
	originalImagesDir,
	siteDir,
} from './lib/site-paths.mjs';

// Bump only when the raster recipe changes, not on ordinary engine releases.
const rasterOutputVersion = 4;
const staticOutputVersion = 3;
const sourceHashSlugLength = 8;
const widths = [480, 768, 1080, 1440, 1920];

let sharpPromise;
const getSharp = () => sharpPromise ??= import('sharp').then(({ default: sharp }) => sharp).catch(() => {
	throw new Error('Norna could not load Sharp for image processing. Run npm install --include=optional in the project to install the native image dependencies for this computer.');
});

const toPublicPath = (filePath) => filePath.split(path.sep).join('/');
const getPublicPath = (filePath) => `/${toPublicPath(path.relative(astroPublicDir, filePath))}`;
const getFilePathFromPublicPath = (publicPath) => path.join(astroPublicDir, publicPath.replace(/^\//, ''));

const getSourceHashSlug = (sourceHash) => sourceHash.slice(0, sourceHashSlugLength);

const getGeneratedPath = (sourceKey, sourceHash, width) => {
	const parsed = path.parse(sourceKey.replace(/^root\//, ''));
	return path.join(generatedImagesDir, parsed.dir, `${parsed.base}-${getSourceHashSlug(sourceHash)}-v${rasterOutputVersion}-${width}.webp`);
};

const getOriginalPath = (sourceKey, sourceHash) => {
	const parsed = path.parse(sourceKey.replace(/^root\//, ''));
	return path.join(originalImagesDir, parsed.dir, `${parsed.name}-${getSourceHashSlug(sourceHash)}${parsed.ext}`);
};

const fail = (message) => {
	throw new Error(message);
};

const getImageSourceKey = (contentFile, image) => getPageImageSourceKey(contentFile.pageDirectory, image);

const getReferencedImages = async (contentFile) => {
	const { body } = await readSiteFile(contentFile.contentPath, contentFile.contentLabel);
	const page = await parsePageMarkdown(body, { label: contentFile.contentLabel });
	const imageError = page.diagnostics.find((issue) => issue.code === 'invalid-markdown-image');
	if (imageError) throw new Error(imageError.message + ' ' + imageError.fix);
	const references = [];

	for (const region of page.regions) {
		if (region.blockErrors.length > 0) throw new Error(region.blockErrors[0].message);
		for (const { image, line, blockDisplayType } of region.managedImages) {
			references.push({
				contentFile,
				image,
				line,
				blockDisplayType,
				sectionLabel: region.id ?? 'page title',
				sourceKey: getImageSourceKey(contentFile, image),
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
	const normalizedSources = new Map();
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

			const fileStat = await lstat(sourcePath).catch(() => null);
			const directoryStat = await lstat(contentFile.imagesDir).catch(() => null);
			if (fileStat?.isSymbolicLink() || directoryStat?.isSymbolicLink()) fail(`Image ${sourcePath} must belong to a regular images/ directory; symbolic links are not supported.`);
			if (!fileStat?.isFile()) {
				fail(`Image file does not exist: ${contentFile.imagesLabel}/${siteImagePath}`);
			}

			if (path.dirname(sourcePath) !== contentFile.imagesDir) {
				fail(`Image "${imageName}" is used in ${reference.sectionLabel} but is not stored directly in ${contentFile.imagesLabel}/. Run norna content:sync, or npm run norna:sync in starter-style repositories, to move it.`);
			}

			const normalizedKey = reference.sourceKey.normalize('NFC').toLowerCase();
			const previous = normalizedSources.get(normalizedKey);
			if (previous) fail(`Image sources ${previous} and ${sourcePath} conflict after case/Unicode normalization. Rename one image.`);
			normalizedSources.set(normalizedKey, sourcePath);
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
		const page = await parsePageMarkdown(body, { label: contentFile.contentLabel });

		for (const region of page.regions) {
			if (region.blockErrors.length > 0) throw new Error(region.blockErrors[0].message);
			for (const block of region.blocks.filter((candidate) => candidate.type === 'image-carousel')) {
				const orientations = new Set(
					block.images
						.map((image) => manifest[getImageSourceKey(contentFile, image.image)])
						.filter(Boolean)
						.filter((entry) => Number.isFinite(entry.width) && Number.isFinite(entry.height))
						.map(getOrientation)
				);

				orientations.delete('square');
				if (orientations.size > 1) {
					throw new Error(
						`Carousel in ${region.id ? `section "${region.id}"` : 'the page introduction'} on line ${block.line} mixes landscape and portrait images. Use landscape images with optional square images, or portrait images with optional square images.`,
					);
				}
			}
		}
	}
};

const identify = async (sourcePath, sharp) => {
	const { autoOrient: dimensions } = await sharp(sourcePath).metadata();
	if (!dimensions || !Number.isSafeInteger(dimensions.width) || !Number.isSafeInteger(dimensions.height)
		|| dimensions.width <= 0 || dimensions.height <= 0) throw new Error('The image has no usable dimensions.');
	return dimensions;
};

const convert = async (sourcePath, outputPath, width, sharp) => {
	await mkdir(path.dirname(outputPath), { recursive: true });
	// Sharp converts to sRGB and strips metadata by default.
	await sharp(sourcePath).autoOrient().resize({ width, withoutEnlargement: true })
		.webp({ quality: 82 }).toFile(outputPath);
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

const getVariants = (sourceKey, sourceHash, variantWidths) => variantWidths.map((width) => ({
	src: getPublicPath(getGeneratedPath(sourceKey, sourceHash, width)),
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

const getReusableEntry = async (sourceKey, previousEntry, sourceHash) => {
	if (
		previousEntry?.sourceHash !== sourceHash
		|| previousEntry?.outputVersion !== rasterOutputVersion
		|| !Number.isFinite(previousEntry?.width)
		|| !Number.isFinite(previousEntry?.height)
	) {
		return null;
	}

	const variants = getVariants(sourceKey, sourceHash, getVariantWidths(previousEntry));

	if (!(await hasGeneratedVariants(variants))) {
		return null;
	}

	return {
		outputVersion: rasterOutputVersion,
		sourceHash,
		width: previousEntry.width,
		height: previousEntry.height,
		variants,
	};
};

const getReusableStaticEntry = async (previousEntry, sourceHash, sourceKey) => {
	if (
		previousEntry?.kind !== 'static'
		|| previousEntry?.sourceHash !== sourceHash
		|| previousEntry?.outputVersion !== staticOutputVersion
		|| previousEntry?.src !== getPublicPath(getOriginalPath(sourceKey, sourceHash))
		|| !(await fileExists(getFilePathFromPublicPath(previousEntry.src)))
	) {
		return null;
	}

	return previousEntry;
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

const getManifestOutputPaths = (entry) => [
	...(entry.variants ?? []).map((variant) => getFilePathFromPublicPath(variant.src)),
	...(entry.kind === 'static' && typeof entry.src === 'string'
		? [getFilePathFromPublicPath(entry.src)]
		: []),
];

const removeUnreferencedGeneratedFiles = async (manifest) => {
	const expectedFiles = new Set(
		Object.values(manifest)
			.flatMap(getManifestOutputPaths),
	);
	const generatedFiles = [
		...await listGeneratedFiles(generatedImagesDir),
		...await listGeneratedFiles(originalImagesDir),
	];

	for (const generatedFile of generatedFiles) {
		if (!expectedFiles.has(generatedFile)) {
			await rm(generatedFile, { force: true });
		}
	}
};

const main = async () => {
	await mkdir(generatedImagesDir, { recursive: true });

	const previousManifest = await readManifest();
	const sources = await getReferencedSources();
	const manifest = {};
	const isStaticSource = (sourcePath) => staticImageExtensions.has(path.extname(sourcePath).toLowerCase());

	if (sources.length === 0) {
		await removeUnreferencedGeneratedFiles(manifest);
		await mkdir(path.dirname(generatedImagesManifestPath), { recursive: true });
		await writeFile(generatedImagesManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
		return;
	}

	for (const { sourcePath, sourceKey } of sources) {
		const sourceHash = await getSourceHash(sourcePath);

		if (isStaticSource(sourcePath)) {
			const reusableEntry = await getReusableStaticEntry(previousManifest[sourceKey], sourceHash, sourceKey);

			if (reusableEntry) {
				manifest[sourceKey] = reusableEntry;
				continue;
			}

			const outputPath = getOriginalPath(sourceKey, sourceHash);
			await mkdir(path.dirname(outputPath), { recursive: true });
			await copyFile(sourcePath, outputPath);

			const dimensions = await readImageDimensions(sourcePath).catch(() => null);
			manifest[sourceKey] = {
				kind: 'static',
				outputVersion: staticOutputVersion,
				sourceHash,
				src: getPublicPath(outputPath),
				...(dimensions ? { width: dimensions.width, height: dimensions.height } : {}),
			};
			continue;
		}

		const reusableEntry = await getReusableEntry(sourceKey, previousManifest[sourceKey], sourceHash);

		if (reusableEntry) {
			manifest[sourceKey] = reusableEntry;
			continue;
		}

		const sharp = await getSharp();
		let dimensions;
		let variants;
		try {
			dimensions = await identify(sourcePath, sharp);
			const variantWidths = getVariantWidths(dimensions);
			variants = getVariants(sourceKey, sourceHash, variantWidths);
			for (const width of variantWidths) {
				await convert(sourcePath, getGeneratedPath(sourceKey, sourceHash, width), width, sharp);
			}
		} catch (error) {
			throw new Error(`Cannot process image ${sourcePath}: ${error.message}`);
		}

		manifest[sourceKey] = {
			outputVersion: rasterOutputVersion,
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
};

try {
	await main();
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
