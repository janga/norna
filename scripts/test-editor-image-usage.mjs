import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { getImageCompletionContext } from './lib/editor-language-service.mjs';

test('image suggestions classify live page references, not publication or saved examples', async () => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'norna-image-usage-'));
	const write = async (name, value) => {
		await mkdir(path.dirname(path.join(root, name)), { recursive: true });
		await writeFile(path.join(root, name), value);
	};
	const block = (type, names) => `\`\`\`${type}\nitems:\n${names.map((name) => `  - image: ${name}`).join('\n')}\n\`\`\`\n`;
	try {
		await write('config.yaml', 'url: https://example.com/\n');
		await write('pages/000-home/content.md', `# Home\n\n${block('image-stack', ['z-unused.svg'])}`);
		await write('pages/010-other/content.md', `# Other\n\n${block('image-stack', ['y-other.svg'])}`);
		for (const [page, files] of [['000-home', ['a-used.svg', 'z-unused.svg']], ['010-other', ['b-used.svg', 'y-other.svg']]]) {
			for (const file of files) await write(`pages/${page}/images/${file}`, '<svg/>');
		}
		const complete = async (source) => (await getImageCompletionContext({
			documentPath: path.join(root, 'pages/000-home/content.md'), source,
			line: source.split('\n').findIndex((line) => line === '  - image: '),
		})).candidates;
		for (const type of ['image-stack', 'image-carousel', 'card-list']) {
			const source = `# Home\n\n${block(type, ['a-used.svg', 'b-used.svg', ''])}`;
			const candidates = await complete(source);
			assert.deepEqual(candidates.map(({ filename, usage }) => [filename, usage]), [
				['z-unused.svg', 'unused'], ['a-used.svg', 'used'], ['y-other.svg', 'unused'], ['b-used.svg', 'used'],
			], type);
			assert.ok(!candidates[0].referencedBy.includes('pages/000-home/content.md'));
			assert.ok(candidates[1].referencedBy.includes('pages/000-home/content.md'));
			assert.deepEqual(candidates[2].referencedBy, ['pages/010-other/content.md']);
			const deleted = await complete(source.replace('a-used.svg', ''));
			assert.equal(deleted.find(({ filename }) => filename === 'a-used.svg').usage, 'unused');
		}
		const literals = [
			`\`\`\`\`md\n${block('image-stack', ['z-unused.svg'])}\`\`\`\``,
			'<!--\n' + block('image-stack', ['z-unused.svg']) + '-->',
			block('yaml', ['z-unused.svg']),
			'![An ordinary Markdown image](z-unused.svg)',
			'```card-list\nitems:\n  - title: Example\n    text: |\n      - image: z-unused.svg\n```',
		];
		for (const literal of literals) {
			const candidates = await complete(`# Home\n\n${literal}\n\n${block('image-stack', [''])}`);
			assert.ok(candidates.every(({ usage }) => usage === 'unused'), literal);
		}
		await write('pages/010-other/images/a-used.svg', '<svg/>');
		let candidates = await complete(`# Home\n\n${block('image-stack', ['a-used.svg', ''])}`);
		assert.deepEqual(candidates.filter(({ filename }) => filename === 'a-used.svg').map(({ usage }) => usage), ['used', 'unused']);
		await write('pages/020-third/images/b-used.svg', '<svg/>');
		candidates = await complete(`# Home\n\n${block('image-stack', ['b-used.svg', ''])}`);
		assert.deepEqual(candidates.filter(({ filename }) => filename === 'b-used.svg').map(({ usage }) => usage), ['ambiguous', 'ambiguous']);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
