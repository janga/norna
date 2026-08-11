import { readFile } from 'node:fs/promises';
import path from 'node:path';

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const jpegStartOfFrameMarkers = new Set([
	0xc0,
	0xc1,
	0xc2,
	0xc3,
	0xc5,
	0xc6,
	0xc7,
	0xc9,
	0xca,
	0xcb,
	0xcd,
	0xce,
	0xcf,
]);

const isPng = (buffer) => buffer.length >= 24 && buffer.subarray(0, 8).equals(pngSignature);

const readPngDimensions = (buffer) => ({
	width: buffer.readUInt32BE(16),
	height: buffer.readUInt32BE(20),
});

const readJpegDimensions = (buffer) => {
	if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
		return null;
	}

	let offset = 2;

	while (offset + 9 < buffer.length) {
		while (buffer[offset] === 0xff) {
			offset += 1;
		}

		const marker = buffer[offset];
		offset += 1;

		if (marker === 0xd9 || marker === 0xda) {
			return null;
		}

		if (offset + 2 > buffer.length) {
			return null;
		}

		const segmentLength = buffer.readUInt16BE(offset);
		if (segmentLength < 2 || offset + segmentLength > buffer.length) {
			return null;
		}

		if (jpegStartOfFrameMarkers.has(marker)) {
			if (segmentLength < 7) return null;

			return {
				height: buffer.readUInt16BE(offset + 3),
				width: buffer.readUInt16BE(offset + 5),
			};
		}

		offset += segmentLength;
	}

	return null;
};

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

	if (isPng(buffer)) {
		return readPngDimensions(buffer);
	}

	return readJpegDimensions(buffer);
};
