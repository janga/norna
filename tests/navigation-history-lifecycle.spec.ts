import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { expect, test } from '@playwright/test';

// Exercise the delivered inline guard. Browser history/geometry is covered by
// navigation-prototype.spec.ts; these cases cover its temporary ownership.
const component = await readFile(new URL('../src/components/NavigationPrototype.astro', import.meta.url), 'utf8');
const script = component.match(/<script is:inline>([\s\S]*?)<\/script>/)![1];
const setup = (overrides: {
	hash?: string;
	readyState?: string;
	type?: string;
	scrollRestoration?: string;
} = {}) => {
	const window = new EventTarget();
	const history = { scrollRestoration: overrides.scrollRestoration ?? 'auto' };
	vm.runInNewContext(script, {
		window, history,
		location: { hash: overrides.hash ?? '#heading' },
		document: { readyState: overrides.readyState ?? 'interactive' },
		performance: { getEntriesByType: () => [{ type: overrides.type ?? 'back_forward' }] },
	});
	return { history, dispatch: (type: string) => window.dispatchEvent(new Event(type)) };
};

for (const event of ['load', 'pagehide']) {
	test(`releases temporary history ownership on ${event}`, () => {
		const { history, dispatch } = setup();
		expect(history.scrollRestoration).toBe('auto');
		dispatch('pagereveal');
		expect(history.scrollRestoration).toBe('manual');
		dispatch(event);
		expect(history.scrollRestoration).toBe('auto');
		// Cleanup must not retain a listener that overwrites a subsequent owner.
		history.scrollRestoration = 'manual';
		dispatch('load');
		dispatch('pagehide');
		dispatch('pagereveal');
		expect(history.scrollRestoration).toBe('manual');
	});
}

for (const [name, overrides] of [
	['direct fragment', { type: 'navigate' }],
	['reload', { type: 'reload' }],
	['history without a fragment', { hash: '' }],
	['already loaded or cached document', { readyState: 'complete' }],
	['another scroll-restoration owner', { scrollRestoration: 'manual' }],
] as const) {
	test(`leaves ${name} untouched`, () => {
		const { history, dispatch } = setup(overrides);
		const original = history.scrollRestoration;
		for (const event of ['pagereveal', 'load', 'pagehide']) {
			dispatch(event);
			expect(history.scrollRestoration).toBe(original);
		}
	});
}
