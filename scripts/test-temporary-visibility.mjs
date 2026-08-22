import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nornaBin = path.join(repoRoot, 'bin', 'norna.mjs');
const tempParent = path.join(repoRoot, 'node_modules', '.cache');
await mkdir(tempParent, { recursive: true });
const tempRoot = await mkdtemp(path.join(tempParent, 'norna-temporary-visibility-'));
const siteDir = path.join(tempRoot, 'site');

const runCli = (args, env = {}) => {
	const result = spawnSync(process.execPath, [nornaBin, ...args], {
		cwd: tempRoot,
		encoding: 'utf8',
		env: {
			...process.env,
			NORNA_SITE_DIR: siteDir,
			...env,
		},
	});

	if (result.status !== 0) {
		throw new Error([
			`norna ${args.join(' ')} exited with code ${result.status}.`,
			result.stdout.trim(),
			result.stderr.trim(),
		].filter(Boolean).join('\n'));
	}

	return result;
};

try {
	await mkdir(path.join(siteDir, 'images', 'work'), { recursive: true });
	await mkdir(path.join(siteDir, 'public'), { recursive: true });
	await writeFile(path.join(siteDir, 'public', 'robots.txt'), 'User-agent: *\nAllow: /\n');
	await writeFile(path.join(siteDir, 'config.md'), `---
url: https://example.com/
---
`);
	await writeFile(path.join(siteDir, 'theme.md'), `---
typography:
  profile: restrained
palette: dark
---
`);
	await writeFile(path.join(siteDir, 'sitewide-content.md'), `---
banners:
  - id: expired-banner
    visible:
      until: "2026-01-01"
    title: Expired banner
    text: Expired banner text.
  - id: active-banner
    visible:
      from: "2026-01-01"
      until: "2026-12-31"
    title: Active banner
    text: Active banner text.
---
`);
	await writeFile(path.join(siteDir, 'content.md'), `---
title: Temporary Visibility Test
description: Test site for temporary sections.
sections:
  expired:
    visible:
      until: "2026-01-01"
  active:
    visible:
      from: "2026-01-01"
      until: "2026-12-31"
  always: {}

---
## Expired {#expired}

Expired section text.

## Active {#active}

Active section text.

## Always {#always}

Always visible section text.
`);

	runCli(['build'], { NORNA_TODAY: '2026-06-15' });

	const html = await readFile(path.join(tempRoot, 'dist', 'index.html'), 'utf8');
	assert.match(html, /Active section text/);
	assert.match(html, /Always visible section text/);
	assert.doesNotMatch(html, /Expired section text/);
	assert.match(html, /Active banner text/);
	assert.doesNotMatch(html, /Expired banner text/);

	console.log('Temporary visibility test passed.');
} finally {
	await rm(tempRoot, { force: true, recursive: true });
}
