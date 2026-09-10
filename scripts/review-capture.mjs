import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

export const reviewCaptureViewportProfiles = Object.freeze({
	desktop: Object.freeze({ width: 1440, height: 1000 }),
	compact: Object.freeze({ width: 1024, height: 900 }),
	mobile: Object.freeze({ width: 390, height: 844 }),
});

const appearances = Object.freeze(['system', 'light', 'dark']);
const customViewportPattern = /^(\d{3,4})x(\d{3,4})$/;
const minimumViewportDimension = 240;
const maximumViewportDimension = 3840;

const parseViewport = (value) => {
	const profile = reviewCaptureViewportProfiles[value];
	if (profile) return { name: value, ...profile };

	const match = customViewportPattern.exec(value);
	if (!match) {
		throw new Error([
			`Unknown review capture viewport "${value}".`,
			`Choose ${Object.keys(reviewCaptureViewportProfiles).join(', ')}, or use WIDTHxHEIGHT.`,
		].join('\n'));
	}

	const width = Number(match[1]);
	const height = Number(match[2]);
	if (
		width < minimumViewportDimension
		|| width > maximumViewportDimension
		|| height < minimumViewportDimension
		|| height > maximumViewportDimension
	) {
		throw new Error(
			`Review capture dimensions must be between ${minimumViewportDimension} and ${maximumViewportDimension} pixels.`,
		);
	}

	return { name: `${width}x${height}`, width, height };
};

export const parseReviewCaptureArguments = (rawArguments) => {
	const [relativePage, ...options] = rawArguments;
	if (!relativePage || relativePage.startsWith('--')) {
		throw new Error('Review capture requires a relative page such as "." or "guide/components/#images".');
	}

	let appearance = 'light';
	let viewport = parseViewport('desktop');
	let fullPage = false;

	for (let index = 0; index < options.length; index += 1) {
		const option = options[index];
		if (option === '--full-page') {
			fullPage = true;
			continue;
		}

		if (option === '--appearance') {
			const value = options[index + 1];
			if (!value || value.startsWith('--')) {
				throw new Error('--appearance requires system, light, or dark.');
			}
			if (!appearances.includes(value)) {
				throw new Error(`Unknown review capture appearance "${value}". Choose ${appearances.join(', ')}.`);
			}
			appearance = value;
			index += 1;
			continue;
		}

		if (option === '--viewport') {
			const value = options[index + 1];
			if (!value || value.startsWith('--')) {
				throw new Error('--viewport requires desktop, compact, mobile, or WIDTHxHEIGHT.');
			}
			viewport = parseViewport(value);
			index += 1;
			continue;
		}

		throw new Error(`Unknown review capture option "${option}".`);
	}

	return { appearance, fullPage, relativePage, viewport };
};

const sanitizeFilenamePart = (value, fallback) => {
	const normalized = value
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 96);
	return normalized || fallback;
};

export const resolveReviewCapture = ({ environment, options, root }) => {
	const baseUrl = new URL(environment.url);
	const relativePage = options.relativePage.trim();
	if (!relativePage) throw new Error('Review capture relative page cannot be empty.');
	if (/^[a-z][a-z\d+.-]*:/i.test(relativePage) || relativePage.startsWith('//')) {
		throw new Error('Review capture accepts only a relative page within the registered local site.');
	}

	const targetUrl = new URL(relativePage === '.' ? './' : relativePage, baseUrl);
	if (targetUrl.origin !== baseUrl.origin || !targetUrl.pathname.startsWith(baseUrl.pathname)) {
		throw new Error([
			`Review capture page escapes the registered base path ${baseUrl.pathname}.`,
			'Use a page relative to the registered review site.',
		].join('\n'));
	}

	const relativePath = targetUrl.pathname.slice(baseUrl.pathname.length);
	const pageName = sanitizeFilenamePart(
		`${relativePath}${targetUrl.hash ? `-${targetUrl.hash.slice(1)}` : ''}`,
		'root',
	);
	const fullPageSuffix = options.fullPage ? '-full' : '';
	const filename = [
		pageName,
		options.viewport.name,
		options.appearance,
	].join('-') + `${fullPageSuffix}.png`;
	const outputPath = path.join(root, '.local', 'review-captures', environment.name, filename);

	return {
		...options,
		outputPath,
		url: targetUrl.href,
	};
};

const isReachable = async (url, fetchImplementation) => {
	try {
		const response = await fetchImplementation(url, { signal: AbortSignal.timeout(2_000) });
		await response.arrayBuffer();
		return response.ok;
	} catch {
		return false;
	}
};

const applyCaptureAppearance = async (page, appearance) => {
	for (let attempt = 1; attempt <= 3; attempt += 1) {
		try {
			await page.waitForLoadState('domcontentloaded');
			await page.evaluate(async (selectedAppearance) => {
				document.documentElement.dataset.appearance = selectedAppearance;
				document.documentElement.style.scrollBehavior = 'auto';
				await document.fonts?.ready;
			}, appearance);
			return;
		} catch (error) {
			const contextWasReplaced = /Execution context was destroyed|navigation/i.test(
				error instanceof Error ? error.message : String(error),
			);
			if (!contextWasReplaced || attempt === 3) throw error;
			await page.waitForTimeout(100);
		}
	}
};

export const captureReviewPage = async ({
	environment,
	rawArguments,
	root,
	write = console.log,
	fetchImplementation = fetch,
	launchBrowser = () => chromium.launch(),
}) => {
	const options = parseReviewCaptureArguments(rawArguments);
	const capture = resolveReviewCapture({ environment, options, root });

	if (!await isReachable(capture.url, fetchImplementation)) {
		throw new Error([
			`${environment.label} is not reachable at ${environment.url}`,
			`Start it with: npm run review:start -- ${environment.name}`,
		].join('\n'));
	}

	await mkdir(path.dirname(capture.outputPath), { recursive: true });
	const browser = await launchBrowser();
	try {
		const context = await browser.newContext({
			colorScheme: capture.appearance === 'system' ? 'no-preference' : capture.appearance,
			reducedMotion: 'reduce',
			viewport: {
				width: capture.viewport.width,
				height: capture.viewport.height,
			},
		});
		const page = await context.newPage();
		await page.goto(capture.url, { waitUntil: 'domcontentloaded' });
		await applyCaptureAppearance(page, capture.appearance);
		await page.screenshot({
			fullPage: capture.fullPage,
			path: capture.outputPath,
		});
		await context.close();
	} finally {
		await browser.close();
	}

	write(`Review URL: ${capture.url}`);
	write(`Review capture: ${capture.outputPath}`);
	return capture;
};
