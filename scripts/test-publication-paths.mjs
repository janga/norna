import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { attachmentPublicationPath, publicationIssues, publicFilePublication } from './lib/publication-paths.mjs';
import { readEditorLinkState } from './lib/editor-site-links.mjs';
import { planEditorPublicCreation, planEditorResourceRename, getEditorResourceAddress } from './lib/editor-resource-actions.mjs';
import { configSchema } from './lib/schema-definitions.mjs';
import { createTempSite, runNorna } from './test-support/content-model.mjs';
const run = promisify(execFile);

const fixture = async t => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'norna-publication-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const write = async (name, text) => { const filename = path.join(root, name); await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, text); return filename; };
	await write('site-config/settings.yaml', 'sourceFormat: 2\nurl: https://example.com/docs/\nverificationFiles: [ownership.html]\n');
	await write('root/tree-theme.yaml', 'preset: documentation\n');
	await write('root/content.md', '# Home\n');
	return { root, write };
};

test('resource identities stay distinct from page names, descendants and extensionless attachments', async t => {
	const { root, write } = await fixture(t);
	await write('root/downloads/guide.pdf', 'home');
	await write('root/downloads/help', 'extensionless');
	await write('root/pages/help/downloads/guide.pdf', 'help');
	await write('root/pages/help/downloads/install', 'extensionless');
	await write('root/pages/help/pages/install/downloads/guide.pdf', 'nested');
	for (const name of ['images', 'downloads', 'shared', 'help', 'help/pages/install']) await write(`root/pages/${name}/content.md`, '# Page\n');
	await write('public/logo.svg', '<svg/>');
	const state = await readEditorLinkState({ siteRoot: root });
	assert.deepEqual(state.incomplete, []);
	assert.deepEqual(state.graph.diagnostics, []);
	assert.equal(attachmentPublicationPath('/', 'guide.pdf'), '/_norna/downloads/~home/guide.pdf');
	assert.equal(attachmentPublicationPath('/help/install/', 'guide.pdf'), '/_norna/downloads/help--install/guide.pdf');
	assert.equal(new Set(state.graph.attachments.files.map(file => file.pathname)).size, 5);
	assert.equal(await getEditorResourceAddress({ siteRoot: root, filePath: path.join(root, 'root/downloads/guide.pdf') }), 'https://example.com/docs/_norna/downloads/~home/guide.pdf');
});

test('public policy permits explicit purposes and rejects arbitrary files and reserved areas', () => {
	for (const name of ['robots.txt', 'CNAME', 'llms.txt', '.well-known/security.txt', 'ownership.html']) assert.equal(publicFilePublication(name, { verificationFiles: ['ownership.html'] }).pathname, '/' + name);
	for (const name of ['logo.svg', 'favicon.ico', 'apple-touch-icon.png', 'social-image.jpg']) assert.equal(publicFilePublication(name).pathname, '/_norna/shared/' + name);
	for (const name of ['manual.pdf', 'style.css', 'script.js', 'font.woff2', 'page.html', 'ownership.html', 'manifest.webmanifest', 'sitemap.xml', '404.html', '_norna/shared/logo.svg', 'images/decoration.svg', 'images/nested/decoration.png', 'images/fake.txt', '../file.txt', 'images/a%2fb.svg']) assert.throws(() => publicFilePublication(name), /public\//, name);
	for (const name of ['.well-known', '.well-known/verification']) assert.doesNotThrow(() => publicFilePublication(name, {}, { directory: true }));
	for (const name of ['images', 'images/branding', 'downloads']) assert.throws(() => publicFilePublication(name, {}, { directory: true }), /owning page’s images\/ beside content.md/);
	for (const name of ['../escape', 'nested/file.html', '_norna', 'robots.txt', 'sitemap.xml', 'logo.svg']) assert.equal(configSchema.safeParse({ sourceFormat: 2, url: 'https://example.com/', verificationFiles: [name] }).success, false, name);
});

test('collisions report both owners for files, directories, aliases, case and Unicode', () => {
	for (const pathname of ['/guide/index.html', '/GUIDE/index.html', '/guide', '/guide/index.html/child']) {
		const issues = publicationIssues({ pages: [{ pathname: '/guide/', contentLabel: 'root/pages/guide/content.md' }], publicFiles: [{ pathname, label: 'public/verification' }] });
		assert.ok(issues.some(issue => issue.message.includes('root/pages/guide/content.md') && issue.message.includes('public/verification')), pathname);
	}
	assert.ok(publicationIssues({ pages: [{ pathname: '/', aliases: ['/_norna/shared/'] }] }).some(issue => issue.code === 'reserved-publication-path'));
	assert.ok(publicationIssues({ publicFiles: [{ pathname: '/.well-known/é', label: 'first' }, { pathname: '/.well-known/e\u0301', label: 'second' }] }).some(issue => issue.code === 'publication-collision'));
	assert.ok(publicationIssues({ images: [{ pathname: '/_norna/images/x.svg', label: 'first image' }, { pathname: '/_norna/images/X.svg', label: 'second image' }] }).some(issue => issue.message.includes('first image') && issue.message.includes('second image')));
});

test('editor named site image references and verification rules use the engine publication policy', async t => {
	const { root, write } = await fixture(t);
	const imagePath = await write('public/logo.svg', '<svg/>');
	const sourcePath = await write('root/content.md', '# Home\n\n![Shared](/_norna/shared/logo.svg "Title")\n\n![Again][image]\n\n[image]: /_norna/shared/logo.svg\n');
	const plan = await planEditorResourceRename({ siteRoot: root, filePath: imagePath, name: 'favicon.svg' });
	assert.equal(plan.changes.length, 1);
	assert.equal((plan.changes[0].updated.match(/\/favicon.svg/g) ?? []).length, 2);
	assert.ok(plan.changes[0].updated.includes('"Title"'));
	assert.ok((await readFile(sourcePath, 'utf8')).includes('/logo.svg'));
	assert.equal((await planEditorPublicCreation({ siteRoot: root, name: 'ownership.html' })).destination, path.join(root, 'public/ownership.html'));
	await assert.rejects(planEditorPublicCreation({ siteRoot: root, name: 'another.html' }), /verificationFiles/);
	await assert.rejects(planEditorPublicCreation({ siteRoot: root, name: 'other', folder: true }), /supported public folder/);
	await symlink(path.join(root, 'root/content.md'), path.join(root, 'public/apple-touch-icon.png'));
	assert.ok((await readEditorLinkState({ siteRoot: root })).incomplete.some(message => message.includes('Symbolic links')));
});

test('public sync maps named site images, keeps technical bytes and rejects invalid input before replacing output', async t => {
	const { root, write } = await fixture(t);
	await write('public/logo.svg', '<svg/>');
	await write('public/ownership.html', 'verification bytes');
	await write('public/.well-known/security.txt', 'contact');
	const script = path.resolve('scripts/sync-site-public.mjs');
	await run(process.execPath, [script], { env: { ...process.env, NORNA_SITE_DIR: root } });
	assert.equal(await readFile(path.join(root, '.norna/public/_norna/shared/logo.svg'), 'utf8'), '<svg/>');
	assert.equal(await readFile(path.join(root, '.norna/public/ownership.html'), 'utf8'), 'verification bytes');
	await write('public/invalid.pdf', 'unsupported');
	await assert.rejects(run(process.execPath, [script], { env: { ...process.env, NORNA_SITE_DIR: root } }), error => {
		assert.match(error.stderr, /public\/invalid.pdf/);
		assert.doesNotMatch(error.stderr, /\n\s+at /);
		return true;
	});
	assert.equal(await readFile(path.join(root, '.norna/public/ownership.html'), 'utf8'), 'verification bytes');
});

test('removed public image directories fail content checks and sync before output changes, including empty directories', async t => {
	const { root, write } = await fixture(t);
	await write('public/logo.svg', '<svg/>');
	await write('.norna/public/_norna/shared/images/old.svg', 'previous public image');
	await write('.norna/public/_norna/images/generated/keep.webp', 'managed image');
	await mkdir(path.join(root, 'public/images'));
	const script = path.resolve('scripts/sync-site-public.mjs');
	const sync = () => run(process.execPath, [script], { env: { ...process.env, NORNA_SITE_DIR: root } });
	const invalidSource = error => {
		const output = error.output ?? error.stderr;
		assert.match(output, /public\/images\/ is not a supported public folder/);
		assert.match(output, /owning page’s images\/ beside content.md/);
		assert.doesNotMatch(output, /\n\s+at /);
		return true;
	};
	await assert.rejects(sync(), invalidSource);
	await write('public/images/old.svg', '<svg/>');
	await assert.rejects(runNorna(['--site-dir', root, 'content:check']), invalidSource);
	assert.equal(await readFile(path.join(root, '.norna/public/_norna/shared/images/old.svg'), 'utf8'), 'previous public image');
	await rm(path.join(root, 'public/images'), { recursive: true });
	await sync();
	await assert.rejects(access(path.join(root, '.norna/public/_norna/shared/images')), { code: 'ENOENT' });
	assert.equal(await readFile(path.join(root, '.norna/public/_norna/images/generated/keep.webp'), 'utf8'), 'managed image');
	assert.equal(await readFile(path.join(root, '.norna/public/_norna/shared/logo.svg'), 'utf8'), '<svg/>');
});

test('a build links named site images and a managed content image, declared verification files and the generated 404 below the configured base', async t => {
	const { root, siteDir } = await createTempSite({ underRepoCache: true });
	t.after(() => rm(root, { recursive: true, force: true }));
	await writeFile(path.join(siteDir, 'site-config/settings.yaml'), 'sourceFormat: 2\nurl: https://example.com/docs/\nverificationFiles: [ownership.html]\n');
	await mkdir(path.join(siteDir, 'public'), { recursive: true });
	await mkdir(path.join(siteDir, 'root/downloads'), { recursive: true });
	await writeFile(path.join(siteDir, 'root/downloads/guide.pdf'), 'attachment bytes');
	const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';
	for (const file of ['logo.svg', 'favicon.svg']) await writeFile(path.join(siteDir, 'public', file), svg);
	await mkdir(path.join(siteDir, 'root/images'), { recursive: true });
	await writeFile(path.join(siteDir, 'root/images/mark.svg'), svg);
	// A small valid PNG, copied byte-for-byte as the site-wide social image.
	const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1kAAAAASUVORK5CYII=', 'base64');
	await writeFile(path.join(siteDir, 'public/social-image.png'), png);
	await writeFile(path.join(siteDir, 'public/ownership.html'), 'verification bytes\n');
	await writeFile(path.join(siteDir, 'root/content.md'), '# Home\n\n![Content image](images/mark.svg)\n\n[Guide](guide.pdf)\n\n[Verify](/ownership.html)\n\n[Missing page](/404.html)\n');
	await runNorna(['--site-dir', siteDir, 'build']);
	const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
	for (const file of ['logo.svg', 'favicon.svg', 'social-image.png']) {
		assert.ok(html.includes('/docs/_norna/shared/' + file), file);
		assert.deepEqual(await readFile(path.join(root, 'dist/_norna/shared', file)), await readFile(path.join(siteDir, 'public', file)));
	}
	assert.match(html, /src="\/docs\/_norna\/images\/original\/images\/mark-[a-f0-9]{8}\.svg"/);
	assert.ok(html.includes('https://example.com/docs/_norna/shared/social-image.png'));
	assert.ok(html.includes('/docs/_norna/downloads/~home/guide.pdf'));
	assert.equal(await readFile(path.join(root, 'dist/_norna/downloads/~home/guide.pdf'), 'utf8'), 'attachment bytes');
	assert.ok(html.includes('href="/docs/ownership.html"'));
	assert.equal(await readFile(path.join(root, 'dist/ownership.html'), 'utf8'), 'verification bytes\n');
	assert.ok(html.includes('href="/docs/404.html"'));
	assert.match(await readFile(path.join(root, 'dist/404.html'), 'utf8'), /<meta name="robots" content="noindex">/);
});
