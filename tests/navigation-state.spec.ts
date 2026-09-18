import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { expect, test } from '@playwright/test';
import { createNavigationStateHelpers } from '../src/lib/navigationState.mjs';
import { getNavigationStateScript } from '../src/lib/navigationStateScript.mjs';

// Execute the real deferred component, including its initial restore and writes.
// Browser tests cover geometry and native details events; these stubs isolate
// stored-input interpretation and parser-time lifecycle deterministically.
const component = await readFile(new URL('../src/components/TreeNavigationScript.astro', import.meta.url), 'utf8');
const runtimeScript = stripTypeScriptTypes(component.match(/<script>([\s\S]*?)<\/script>/)![1])
	.replace(/import \{ createNavigationStateHelpers \} from '[^']+';/, '');
const earlyScript = getNavigationStateScript();
const ancestor = 'reference/site';
const current = 'reference/site/pages';
const other = 'reference/configuration';
const root = '/norna/reference/';
const sharedRoot = '/norna/';
const scopedKey = (scope: string) => `norna:tree-navigation:${scope}:${root}`;
const sharedKey = `norna:tree-navigation:shared:${sharedRoot}`;
const record = (scrollTop: unknown = 240) => JSON.stringify({
	openPaths: [other], sectionOpenByPath: { [current]: false, [other]: true }, scrollTop,
});
const nativeState = { branches: [true, true, false], sections: [true, false], scrollTop: 0 };
const savedState = { branches: [true, false, true], sections: [false, true], scrollTop: 240 };

type Options = {
	local?: string | null;
	shared?: string | null;
	scope?: 'desktop' | 'mobile';
	prototype?: boolean;
	blockedStorage?: boolean;
	parserStartsEmpty?: boolean;
};
const setup = (source: string, options: Options = {}) => {
	const scope = options.scope ?? 'desktop';
	const storage = new Map<string, string>();
	if (options.local != null) storage.set(scopedKey(scope), options.local);
	if (options.shared != null) storage.set(sharedKey, options.shared);
	const disclosure = (pagePath: string, isCurrent = false, isAncestor = false) => Object.assign(new EventTarget(), {
		dataset: { pagePath, currentPage: String(isCurrent), currentBranch: String(isCurrent || isAncestor) },
		open: isCurrent || isAncestor,
	});
	const branches = [disclosure(ancestor, false, true), disclosure(current, true), disclosure(other)];
	const sections = [disclosure(current, true), disclosure(other)];
	if (options.parserStartsEmpty) { branches.length = 0; sections.length = 0; }
	const effects: string[] = [];
	let scrollTop = 0;
	const container = Object.assign(new EventTarget(), {
		dataset: { navigationRoot: root, navigationStateRoot: sharedRoot },
		parentElement: { getBoundingClientRect: () => ({ top: 32 }) },
		style: { setProperty: (name: string, value: string) => effects.push(`${name}:${value}`) },
		hasAttribute: (name: string) => name === 'data-navigation-root',
		querySelectorAll: (selector: string) => {
			if (selector === '.navigation-page-disclosure[data-page-path]') return branches;
			if (selector === '.navigation-page-sections-disclosure[data-page-path]') return sections;
			return [];
		},
		querySelector: () => null,
	});
	Object.defineProperty(container, 'scrollTop', {
		get: () => scrollTop,
		set: (value: number) => { effects.push(`scroll:${value}`); scrollTop = value; },
	});
	const window = Object.assign(new EventTarget(), { scrollY: 0 });
	const document = Object.assign(new EventTarget(), {
		currentScript: { parentElement: container, dataset: { navigationStateScope: scope } },
		documentElement: { hasAttribute: () => options.prototype !== false, lang: 'en' },
		querySelector: (selector: string) => selector === (scope === 'desktop'
			? '.tree-local-navigation' : '.mobile-site-nav[data-navigation-root]') ? container : null,
	});
	let mutationCallback = () => {};
	let observed = false;
	const frames: (() => void)[] = [];
	vm.runInNewContext(source, {
		document, window, CustomEvent, createNavigationStateHelpers,
		sessionStorage: {
			getItem: (key: string) => {
				if (options.blockedStorage) throw new Error('Storage unavailable');
				return storage.get(key) ?? null;
			},
			setItem: (key: string, value: string) => { storage.set(key, value); },
		},
		getComputedStyle: () => ({ overflowY: 'auto', top: '64px' }),
		requestAnimationFrame: (callback: () => void) => frames.push(callback),
		MutationObserver: class {
			constructor(callback: () => void) { mutationCallback = callback; }
			observe() { observed = true; }
			disconnect() { observed = false; }
		},
	});
	const flushFrames = () => { while (frames.length) frames.shift()!(); };
	flushFrames();
	return {
		branches, sections, storage, window, document, container, effects, disclosure, flushFrames,
		mutate: () => { if (observed) mutationCallback(); },
		isObserving: () => observed,
		snapshot: () => ({ branches: branches.map((branch) => branch.open), sections: sections.map((branch) => branch.open), scrollTop }),
	};
};

const cases: { name: string; options: Options; expected: typeof nativeState }[] = [
	{ name: 'absent records', options: {}, expected: nativeState },
	{ name: 'local fallback', options: { local: record() }, expected: savedState },
	{ name: 'shared disclosure with local scroll', options: { local: record(), shared: record(999) }, expected: savedState },
	{ name: 'malformed local with valid shared record', options: { local: '{', shared: record() }, expected: { ...savedState, scrollTop: 0 } },
	{ name: 'null local with valid shared record', options: { local: 'null', shared: record() }, expected: { ...savedState, scrollTop: 0 } },
	{ name: 'existing null shared record replaces local disclosures', options: { local: record(), shared: 'null' }, expected: { branches: [true, false, false], sections: [true, false], scrollTop: 240 } },
	{ name: 'malformed shared record replaces local disclosures', options: { local: record(), shared: '{' }, expected: { branches: [true, false, false], sections: [true, false], scrollTop: 240 } },
	{ name: 'malformed records still count as saved state', options: { local: '{', shared: '{' }, expected: { ...nativeState, branches: [true, false, false] } },
	{ name: 'numeric string scroll', options: { local: record('240') }, expected: savedState },
	{ name: 'non-finite scroll string', options: { local: record('Infinity') }, expected: { ...savedState, scrollTop: 0 } },
	{ name: 'negative scroll is decoded but not restored', options: { local: record(-10) }, expected: { ...savedState, scrollTop: 0 } },
	{ name: 'boolean scroll retains numeric coercion', options: { local: record(true) }, expected: { ...savedState, scrollTop: 1 } },
	{ name: 'array scroll retains numeric coercion', options: { local: record([240]) }, expected: savedState },
	{ name: 'non-boolean outline values use current-page default', options: { local: JSON.stringify({ openPaths: [other, 7, null], sectionOpenByPath: { [current]: 'false', [other]: 1 } }) }, expected: { branches: [true, false, true], sections: [true, false], scrollTop: 0 } },
	{ name: 'non-array paths and non-object outlines', options: { local: JSON.stringify({ openPaths: other, sectionOpenByPath: true }) }, expected: { ...nativeState, branches: [true, false, false] } },
	{ name: 'storage unavailable leaves server disclosures usable', options: { local: record(), blockedStorage: true }, expected: nativeState },
];

for (const { name, options, expected } of cases) {
	test(`restores ${name}`, () => {
		const runtime = setup(runtimeScript, options).snapshot();
		expect(runtime).toEqual(expected);
		expect(setup(earlyScript, options).snapshot()).toEqual(runtime);
	});
}

test('ordinary navigation still opens the current page and outline on arrival', () => {
	expect(setup(runtimeScript, { local: record(), prototype: false }).snapshot()).toEqual({
		branches: [true, true, true], sections: [true, true], scrollTop: 240,
	});
});

test('desktop and mobile retain scoped positions and the existing serialized format', () => {
	for (const [scope, scrollTop] of [['desktop', 240], ['mobile', 81]] as const) {
		const runtime = setup(runtimeScript, { scope, local: record(scrollTop), shared: record(999) });
		expect(runtime.snapshot()).toEqual({ ...savedState, scrollTop });
		expect(setup(earlyScript, { scope, local: record(scrollTop), shared: record(999) }).snapshot())
			.toEqual(runtime.snapshot());
		runtime.window.dispatchEvent(new Event('pagehide'));
		expect(JSON.parse(runtime.storage.get(scopedKey(scope))!)).toEqual({
			openPaths: [ancestor, other], sectionOpenByPath: { [current]: false, [other]: true }, scrollTop,
		});
		expect(JSON.parse(runtime.storage.get(sharedKey)!)).toEqual({
			openPaths: [ancestor, other], sectionOpenByPath: { [current]: false, [other]: true },
		});
	}
});

test('later synchronization preserves explicit choices without arrival reopening', () => {
	const runtime = setup(runtimeScript);
	runtime.window.dispatchEvent(new CustomEvent('norna:tree-navigation-state', { detail: {
		root: sharedRoot, state: { openPaths: [], sectionOpenByPath: { [current]: false, [other]: true } },
	} }));
	expect(runtime.snapshot()).toEqual({ branches: [false, false, false], sections: [false, true], scrollTop: 0 });
});

test('early restore measures the scroll limit before assigning a saved position', () => {
	const early = setup(earlyScript, { local: record() });
	expect(early.effects).toEqual(['--navigation-scrollport-top:64px', 'scroll:240']);
	expect(setup(earlyScript, { scope: 'mobile', local: record(81) }).effects).toEqual(['scroll:81']);
});

test('early restore initializes parser additions once, disconnects and refreshes on pagereveal', () => {
	const early = setup(earlyScript, { local: record(), parserStartsEmpty: true });
	expect(early.isObserving()).toBe(true);
	const branch = early.disclosure(other);
	early.branches.push(branch);
	early.mutate();
	expect(branch.open).toBe(true);
	branch.open = false;
	early.mutate();
	expect(branch.open).toBe(false);
	const outline = early.disclosure(current, true);
	early.sections.push(outline);
	early.document.dispatchEvent(new Event('DOMContentLoaded'));
	expect(outline.open).toBe(false);
	expect(branch.open).toBe(false);
	expect(early.isObserving()).toBe(false);
	outline.open = true;
	early.mutate();
	expect(outline.open).toBe(true);
	early.window.dispatchEvent(new Event('pagereveal'));
	expect(branch.open).toBe(true);
	expect(outline.open).toBe(false);
});

test('built inline scripts preserve the characterized runtime interpretation', async () => {
	// Run explicitly against a fresh opt-in build; importing the generator alone
	// cannot catch bundler transformations that introduce a closure dependency.
	const pagePath = process.env.NORNA_NAVIGATION_STATE_PAGE;
	test.skip(!pagePath, 'Set NORNA_NAVIGATION_STATE_PAGE to the built Pages and categories HTML.');
	const html = await readFile(pagePath!, 'utf8');
	const scripts = [...html.matchAll(/<script\b[^>]*data-navigation-state-scope="([^"]+)"[^>]*>([\s\S]*?)<\/script>/g)];
	expect(scripts.map((script) => script[1]).sort()).toEqual(['desktop', 'mobile']);
	for (const [, scope, source] of scripts) {
		for (const { name, options, expected } of cases) {
			expect(setup(source, { ...options, scope: scope as 'desktop' | 'mobile' }).snapshot(), `${scope}: ${name}`)
				.toEqual(expected);
		}
	}
});
