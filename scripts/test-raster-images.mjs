import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import sharp from 'sharp';
import { createTempSite, runContentScript, runNorna } from './test-support/content-model.mjs';

// Original synthetic fixtures: solid colours and four asymmetric quadrants.
// No third-party image assets or encoder-byte snapshots are needed.
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fixture = async (t, images) => {
	const { root, siteDir } = await createTempSite();
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(path.join(siteDir, 'root/images'));
	for (const [name, bytes] of Object.entries(images)) await writeFile(path.join(siteDir, 'root/images', name), bytes);
	await writeFile(path.join(siteDir, 'root/content.md'), '# Images\n\n' + Object.keys(images).map(name => `![Example](images/${name})`).join('\n\n'));
	const manifestPath = path.join(siteDir, '.norna/generated-images.json');
	return {
		root, siteDir, manifestPath,
		generate: (options) => runNorna(['--site-dir', siteDir, 'images'], options),
		manifest: async () => JSON.parse(await readFile(manifestPath, 'utf8')),
		output: (src) => path.join(siteDir, '.norna/public', src),
	};
};
const solid = (width, height, background) => sharp({ create: { width, height, channels: 4, background } });
const withIptc = (jpeg) => {
	// JPEG APP13 Photoshop resource 0x0404, IPTC copyright dataset 2:116.
	const iptc = Buffer.from('\x1c\x02\x74\x00\x07Fixture', 'latin1');
	const size = Buffer.alloc(4);
	size.writeUInt32BE(iptc.length);
	const payload = Buffer.concat([Buffer.from('Photoshop 3.0\0' + '8BIM\x04\x04\0\0', 'latin1'), size, iptc]);
	const header = Buffer.from([0xff, 0xed, 0, 0]);
	header.writeUInt16BE(payload.length + 2, 2);
	return Buffer.concat([jpeg.subarray(0, 2), header, payload, jpeg.subarray(2)]);
};

test('raster widths, alpha and metadata match the generated WebP rather than the input header', async t => {
	const images = {
		'photo.jpg': withIptc(await solid(2000, 1200, '#d02040').withMetadata()
			.withXmp('<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description/></rdf:RDF></x:xmpmeta>')
			.jpeg().toBuffer()),
		'alpha.png': await solid(1000, 600, { r: 20, g: 180, b: 70, alpha: 0.5 }).png().toBuffer(),
		'small.png': await solid(120, 60, '#203040').png().toBuffer(),
	};
	const inputMetadata = await sharp(images['photo.jpg']).metadata();
	for (const key of ['exif', 'icc', 'iptc', 'xmp']) assert.ok(inputMetadata[key]?.length, `${key} must be present before stripping`);
	const f = await fixture(t, images);
	await f.generate();
	const manifest = await f.manifest();
	for (const [name, widths] of [['photo.jpg', [480, 768, 1080, 1440, 1920, 2000]], ['alpha.png', [480, 768, 1000]], ['small.png', [120]]]) {
		const entry = manifest[`root/images/${name}`];
		assert.deepEqual(entry.variants.map(v => v.width), widths);
		assert.equal(entry.sourceHash, digest(images[name]));
		assert.equal(digest(await readFile(path.join(f.siteDir, 'root/images', name))), digest(images[name]));
		for (const variant of entry.variants) {
			const filename = f.output(variant.src);
			const meta = await sharp(filename).metadata();
			assert.equal(meta.format, 'webp');
			assert.equal(meta.width, variant.width);
			assert.ok(Math.abs(meta.height - variant.width * entry.height / entry.width) <= 1);
			for (const key of ['exif', 'icc', 'iptc', 'xmp', 'orientation']) assert.equal(meta[key], undefined, key);
			if (name === 'alpha.png') {
				assert.equal(meta.hasAlpha, true);
				const pixel = await sharp(filename).extract({ left: 10, top: 10, width: 1, height: 1 }).raw().toBuffer();
				assert.ok(Math.abs(pixel[3] - 128) <= 1);
			}
		}
	}
});

for (const [orientation, width, height, expected] of [
	[6, 80, 160, [[0, 0, 255], [255, 0, 0], [255, 255, 0], [0, 255, 0]]],
	[2, 160, 80, [[0, 255, 0], [255, 0, 0], [255, 255, 0], [0, 0, 255]]],
]) {
	test(`EXIF orientation ${orientation} preserves the expected quadrant arrangement and dimensions`, async t => {
		const input = Buffer.alloc(160 * 80 * 3);
		const colours = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0]];
		for (let y = 0; y < 80; y++) for (let x = 0; x < 160; x++) {
			input.set(colours[(y >= 40 ? 2 : 0) + (x >= 80 ? 1 : 0)], (y * 160 + x) * 3);
		}
		const bytes = await sharp(input, { raw: { width: 160, height: 80, channels: 3 } })
			.withMetadata({ orientation }).withExif({ IFD0: { Copyright: 'Synthetic test fixture' } })
			.jpeg({ quality: 100, chromaSubsampling: '4:4:4' }).toBuffer();
		assert.equal((await sharp(bytes).metadata()).orientation, orientation);
		const f = await fixture(t, { 'oriented.jpg': bytes });
		await f.generate();
		const entry = (await f.manifest())['root/images/oriented.jpg'];
		assert.deepEqual([entry.width, entry.height], [width, height]);
		assert.deepEqual(entry.variants.map(v => v.width), [width]);
		const output = f.output(entry.variants[0].src);
		const meta = await sharp(output).metadata();
		assert.deepEqual([meta.width, meta.height, meta.orientation, meta.exif], [width, height, undefined, undefined]);
		for (let quadrant = 0; quadrant < 4; quadrant++) {
			const pixel = await sharp(output).extract({
				left: Math.floor(width * (quadrant % 2 ? 0.75 : 0.25)),
				top: Math.floor(height * (quadrant >= 2 ? 0.75 : 0.25)), width: 1, height: 1,
			}).raw().toBuffer();
			for (let c = 0; c < 3; c++) assert.ok(Math.abs(pixel[c] - expected[quadrant][c]) < 20, `quadrant ${quadrant}, channel ${c}`);
		}
	});
}

test('profiled CMYK input is converted to web colour and its profile is removed', async t => {
	const bytes = await solid(100, 60, '#c83c28').withIccProfile('cmyk').jpeg({ quality: 100 }).toBuffer();
	const input = await sharp(bytes).metadata();
	assert.equal(input.space, 'cmyk');
	assert.ok(input.icc);
	const f = await fixture(t, { 'print.jpg': bytes });
	await f.generate();
	const output = f.output((await f.manifest())['root/images/print.jpg'].variants[0].src);
	const metadata = await sharp(output).metadata();
	assert.equal(metadata.space, 'srgb');
	assert.equal(metadata.icc, undefined);
	const pixel = await sharp(output).extract({ left: 50, top: 30, width: 1, height: 1 }).raw().toBuffer();
	// The bundled CMYK profile maps this patch to approximately sRGB (196,55,19).
	// Compare with that colour, not the pre-conversion RGB outside its gamut.
	for (const [channel, expected] of [196, 55, 19].entries()) assert.ok(Math.abs(pixel[channel] - expected) < 8);
});

test('a previous raster recipe regenerates with new URLs once while SVG, sources and other sites stay unchanged', async t => {
	const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 40"><rect width="80" height="40"/></svg>');
	const bytes = await solid(600, 300, '#304050').jpeg().toBuffer();
	const f = await fixture(t, { 'photo.jpg': bytes, 'diagram.svg': svg });
	const other = await fixture(t, { 'other.jpg': bytes });
	await writeFile(path.join(f.siteDir, 'root/images/unused.jpg'), bytes);
	await f.generate();
	const first = await f.manifest();
	const raster = first['root/images/photo.jpg'];
	const staticEntry = first['root/images/diagram.svg'];
	const old = structuredClone(first);
	old['root/images/photo.jpg'].outputVersion = 3;
	for (const variant of old['root/images/photo.jpg'].variants) {
		const currentPath = f.output(variant.src);
		variant.src = variant.src.replace(/-v\d+-/, '-');
		await writeFile(f.output(variant.src), await readFile(currentPath));
		await rm(currentPath);
	}
	await writeFile(f.manifestPath, JSON.stringify(old));
	const oldTime = new Date('2000-01-01');
	await utimes(f.output(staticEntry.src), oldTime, oldTime);
	await f.generate();
	const current = await f.manifest();
	assert.deepEqual(current['root/images/photo.jpg'], raster);
	assert.deepEqual(current['root/images/diagram.svg'], staticEntry);
	assert.equal((await stat(f.output(staticEntry.src))).mtimeMs, oldTime.getTime());
	for (const variant of old['root/images/photo.jpg'].variants) await assert.rejects(stat(f.output(variant.src)), { code: 'ENOENT' });
	for (const variant of raster.variants) await utimes(f.output(variant.src), oldTime, oldTime);
	await f.generate();
	for (const variant of raster.variants) assert.equal((await stat(f.output(variant.src))).mtimeMs, oldTime.getTime());
	assert.equal(current['root/images/unused.jpg'], undefined);
	assert.equal(digest(await readFile(path.join(f.siteDir, 'root/images/unused.jpg'))), digest(bytes));
	await assert.rejects(stat(other.manifestPath), { code: 'ENOENT' });
});

test('failed decoding identifies the source and preserves the previous manifest and generated files', async t => {
	const f = await fixture(t, { 'photo.png': await solid(90, 60, '#203040').png().toBuffer() });
	await f.generate();
	const previous = await readFile(f.manifestPath, 'utf8');
	const output = f.output((await f.manifest())['root/images/photo.png'].variants[0].src);
	const oldBytes = await readFile(output);
	await writeFile(path.join(f.siteDir, 'root/images/photo.png'), 'broken image');
	await assert.rejects(f.generate(), error => {
		assert.match(error.output, /Cannot process image .*photo\.png:/);
		assert.doesNotMatch(error.output, /\n\s+at /);
		return true;
	});
	assert.equal(await readFile(f.manifestPath, 'utf8'), previous);
	assert.deepEqual(await readFile(output), oldBytes);
	assert.equal(await readFile(path.join(f.siteDir, 'root/images/photo.png'), 'utf8'), 'broken image');
});

test('a missing Sharp runtime reports installation guidance but is not loaded for SVG or valid cache hits', async t => {
	const f = await fixture(t, { 'photo.png': await solid(90, 60, '#203040').png().toBuffer() });
	const loader = path.join(f.root, 'missing-sharp.mjs');
	const preload = path.join(f.root, 'preload.mjs');
	await writeFile(loader, "export async function resolve(specifier, context, next) { if (specifier === 'sharp') throw new Error('Simulated unavailable native runtime'); return next(specifier, context); }\n");
	await writeFile(preload, `import { register } from 'node:module'; register(${JSON.stringify(pathToFileURL(loader).href)}, import.meta.url);\n`);
	const options = { env: { ...process.env, NODE_OPTIONS: `--import=${pathToFileURL(preload).href}` } };
	await assert.rejects(f.generate(options), error => /Norna could not load Sharp/.test(error.output) && /npm install --include=optional/.test(error.output));
	await f.generate();
	await f.generate(options);
	await writeFile(path.join(f.siteDir, 'root/content.md'), '# SVG\n\n![Diagram](images/diagram.svg)\n');
	await writeFile(path.join(f.siteDir, 'root/images/diagram.svg'), '<svg viewBox="0 0 10 10"/>');
	await f.generate(options);
	assert.equal((await f.manifest())['root/images/diagram.svg'].kind, 'static');
});

test('carousel classification follows displayed EXIF orientation', async t => {
	const rotated = await solid(160, 80, '#305080').withMetadata({ orientation: 6 }).jpeg().toBuffer();
	const portrait = await solid(80, 160, '#805030').jpeg().toBuffer();
	const f = await fixture(t, { 'rotated.jpg': rotated, 'portrait.jpg': portrait });
	await writeFile(path.join(f.siteDir, 'root/content.md'), '# Portraits\n\n```image-carousel\nitems:\n  - image: rotated.jpg\n  - image: portrait.jpg\n```\n');
	const checked = await runContentScript(f.siteDir, ['--check']);
	assert.doesNotMatch(checked.stdout, /different aspect ratios/);
	await f.generate();
	const entries = Object.values(await f.manifest());
	assert.ok(entries.every(entry => entry.width < entry.height));
});
