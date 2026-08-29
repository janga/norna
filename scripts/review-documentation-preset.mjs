import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dump, load } from 'js-yaml';
import { documentationPresetCandidates } from './lib/documentation-preset-candidates.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureSite = path.join(repoRoot, 'fixtures', 'preset-baseline', 'site');
const reviewRoot = path.join(repoRoot, 'node_modules', '.cache', 'norna-documentation-preset-review');
const candidatesRoot = path.join(reviewRoot, 'candidates');
const cliPath = path.join(repoRoot, 'bin', 'norna.mjs');
const buildOnly = process.argv.includes('--build-only');
const requestedPortIndex = process.argv.indexOf('--port');
const requestedPort = requestedPortIndex === -1 ? 4330 : Number(process.argv[requestedPortIndex + 1]);

if (!Number.isInteger(requestedPort) || requestedPort < 0 || requestedPort > 65535) {
	throw new Error('--port must be an integer between 0 and 65535.');
}

const runBuild = (siteDir) => new Promise((resolve, reject) => {
	const child = spawn(process.execPath, [cliPath, '--site-dir', siteDir, 'build'], {
		cwd: repoRoot,
		stdio: 'inherit',
	});
	child.once('error', reject);
	child.once('exit', (code, signal) => {
		if (code === 0) return resolve();
		reject(new Error(signal ? `Candidate build exited with ${signal}.` : `Candidate build exited with code ${code}.`));
	});
});

const copyFixture = async (targetSite) => {
	await cp(fixtureSite, targetSite, {
		recursive: true,
		filter: (source) => !source.split(path.sep).includes('.norna'),
	});
};

const buildCandidate = async (candidate) => {
	const candidateRoot = path.join(candidatesRoot, candidate.id);
	const siteDir = path.join(candidateRoot, 'site');
	await mkdir(candidateRoot, { recursive: true });
	await copyFixture(siteDir);
	await writeFile(path.join(siteDir, 'theme.yaml'), candidate.theme, 'utf8');

	const configPath = path.join(siteDir, 'config.yaml');
	const config = load(await readFile(configPath, 'utf8'));
	config.url = `http://127.0.0.1/candidates/${candidate.id}/`;
	await writeFile(configPath, dump(config, { lineWidth: -1, noRefs: true }), 'utf8');
	await runBuild(siteDir);
};

const escapeHtml = (value) => String(value)
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;');

const renderReviewPage = () => {
	const options = documentationPresetCandidates.map((candidate) => (
		`<option value="${escapeHtml(candidate.id)}">${escapeHtml(candidate.label)}</option>`
	)).join('');
	const frames = documentationPresetCandidates.map((candidate, index) => (
		`<iframe${index === 0 ? '' : ' hidden'} data-candidate-frame="${escapeHtml(candidate.id)}" title="${escapeHtml(candidate.label)} documentation preset" src="/candidates/${escapeHtml(candidate.id)}/guide/components/"></iframe>`
	)).join('\n');
	const descriptions = Object.fromEntries(documentationPresetCandidates.map((candidate) => [candidate.id, candidate.description]));

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Documentation preset review</title>
	<style>
		* { box-sizing: border-box; }
		html, body { height: 100%; margin: 0; }
		body { display: grid; grid-template-rows: auto minmax(0, 1fr); background: #f3f4f3; color: #18201d; font: 14px/1.4 system-ui, sans-serif; }
		.review-toolbar { display: flex; align-items: center; gap: 1rem; min-height: 4.25rem; padding: 0.75rem clamp(1rem, 3vw, 2rem); border-bottom: 1px solid #c8ceca; background: #fff; }
		.review-toolbar h1 { flex: 0 0 auto; margin: 0; font-size: 0.95rem; letter-spacing: 0; }
		.review-control { display: flex; align-items: center; gap: 0.55rem; }
		.review-control span { font-size: 0.78rem; font-weight: 700; }
		.review-control select { min-height: 2.75rem; border: 1px solid #79827c; border-radius: 4px; padding: 0 2.2rem 0 0.7rem; background: #fff; color: #18201d; font: inherit; }
		.review-description { min-width: 0; margin: 0 0 0 auto; color: #4f5953; font-size: 0.78rem; }
		.review-frames { position: relative; min-height: 0; }
		.review-frames iframe { width: 100%; height: 100%; border: 0; background: #fff; }
		.review-frames iframe[hidden] { display: none; }
		:focus-visible { outline: 3px solid #155f46; outline-offset: 2px; }
		@media (max-width: 700px) {
			.review-toolbar { align-items: flex-start; flex-wrap: wrap; gap: 0.45rem 0.8rem; }
			.review-toolbar h1 { width: 100%; }
			.review-description { width: 100%; margin-left: 0; }
		}
	</style>
</head>
<body>
	<header class="review-toolbar">
		<h1>Documentation preset review</h1>
		<label class="review-control">
			<span>Direction</span>
			<select data-candidate-select>${options}</select>
		</label>
		<p class="review-description" data-candidate-description></p>
	</header>
	<main class="review-frames">${frames}</main>
	<script>
		const descriptions = ${JSON.stringify(descriptions)};
		const select = document.querySelector('[data-candidate-select]');
		const description = document.querySelector('[data-candidate-description]');
		const frames = [...document.querySelectorAll('[data-candidate-frame]')];
		const apply = (id) => {
			const selected = frames.some((frame) => frame.dataset.candidateFrame === id) ? id : frames[0].dataset.candidateFrame;
			select.value = selected;
			description.textContent = descriptions[selected];
			frames.forEach((frame) => frame.hidden = frame.dataset.candidateFrame !== selected);
			history.replaceState(null, '', '#' + selected);
		};
		select.addEventListener('change', () => apply(select.value));
		apply(location.hash.slice(1));
	</script>
</body>
</html>`;
};

const buildReview = async () => {
	await rm(reviewRoot, { recursive: true, force: true });
	await mkdir(candidatesRoot, { recursive: true });
	for (const candidate of documentationPresetCandidates) await buildCandidate(candidate);
	await writeFile(path.join(reviewRoot, 'index.html'), renderReviewPage(), 'utf8');
};

const contentTypes = Object.freeze({
	'.css': 'text/css; charset=utf-8',
	'.html': 'text/html; charset=utf-8',
	'.ico': 'image/x-icon',
	'.jpeg': 'image/jpeg',
	'.jpg': 'image/jpeg',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.webp': 'image/webp',
});

const resolveRequestPath = async (requestUrl) => {
	const pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname);
	const requestPath = pathname === '/' ? 'index.html' : pathname.slice(1);
	const requestParts = requestPath.split('/');
	const relativePath = requestParts[0] === 'candidates' && requestParts.length >= 2
		? path.join('candidates', requestParts[1], 'dist', ...requestParts.slice(2))
		: requestPath;
	let candidatePath = path.resolve(reviewRoot, relativePath);
	if (!candidatePath.startsWith(`${reviewRoot}${path.sep}`) && candidatePath !== path.join(reviewRoot, 'index.html')) return null;
	try {
		if ((await stat(candidatePath)).isDirectory()) candidatePath = path.join(candidatePath, 'index.html');
		return candidatePath;
	} catch {
		return null;
	}
};

await buildReview();
if (buildOnly) {
	console.log(`Built documentation preset review in ${path.relative(repoRoot, reviewRoot)}.`);
	process.exit(0);
}

const server = http.createServer(async (request, response) => {
	const filePath = await resolveRequestPath(request.url ?? '/');
	if (!filePath) {
		response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
		response.end('Not found');
		return;
	}
	try {
		const content = await readFile(filePath);
		response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] ?? 'application/octet-stream' });
		response.end(content);
	} catch {
		response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
		response.end('Not found');
	}
});

server.listen(requestedPort, '127.0.0.1', () => {
	const address = server.address();
	const port = typeof address === 'object' && address ? address.port : requestedPort;
	console.log(`Documentation preset review: http://127.0.0.1:${port}/`);
});
