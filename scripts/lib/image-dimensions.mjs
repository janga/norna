import { readFile } from 'node:fs/promises';
import path from 'node:path';

const parseSvgLength = (value) => {
	const match = String(value ?? '').trim().match(/^(\d+(?:\.\d+)?|\.\d+)(?:px)?$/i);
	return match ? Number(match[1]) : null;
};

const readSvgDimensions = (source) => {
	const svgTag = source.match(/<svg\b[^>]*>/i)?.[0];
	if (!svgTag) return null;

	const viewBox = svgTag.match(/\bviewBox\s*=\s*["']\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))[\s,]+([+-]?(?:\d+(?:\.\d+)?|\.\d+))[\s,]+([+-]?(?:\d+(?:\.\d+)?|\.\d+))[\s,]+([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*["']/i);
	if (viewBox) {
		const width = Number(viewBox[3]);
		const height = Number(viewBox[4]);
		return width > 0 && height > 0 ? { width, height } : null;
	}

	const width = parseSvgLength(svgTag.match(/\bwidth\s*=\s*["']([^"']+)["']/i)?.[1]);
	const height = parseSvgLength(svgTag.match(/\bheight\s*=\s*["']([^"']+)["']/i)?.[1]);
	return width && height ? { width, height } : null;
};

export const readImageDimensions = async (filePath) => {
	const buffer = await readFile(filePath);

	if (path.extname(filePath).toLowerCase() === '.svg') {
		return readSvgDimensions(buffer.toString('utf8'));
	}

	const { default: sharp } = await import('sharp');
	const { autoOrient } = await sharp(buffer).metadata();
	return autoOrient ?? null;
};
