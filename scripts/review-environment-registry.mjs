const definitions = {
	docs: {
		label: 'Documentation site',
		siteDirectory: 'site',
		port: 4321,
		basePath: '/norna/',
		browserSuites: [],
	},
	presentation: {
		label: 'Presentation review site',
		siteDirectory: 'fixtures/presentation-review/site',
		port: 4322,
		basePath: '/',
		browserSuites: [],
	},
	navigation: {
		label: 'Nested navigation fixture',
		siteDirectory: 'fixtures/nested-pages/site',
		port: 4323,
		basePath: '/',
		browserSuites: [
			'tests/navigation-tree.spec.ts',
			'tests/page-contents-placement.spec.ts',
		],
	},
	presets: {
		label: 'Preset baseline fixture',
		siteDirectory: 'fixtures/preset-baseline/site',
		port: 4324,
		basePath: '/',
		browserSuites: ['tests/presentation-contract.spec.ts'],
	},
	scratch: {
		label: 'Temporary scratch site',
		siteDirectory: '.local/test-sites/scratch/site',
		port: 4399,
		basePath: null,
		browserSuites: [],
	},
};

export const reviewEnvironmentNames = Object.freeze(Object.keys(definitions));

export const reviewEnvironments = Object.freeze(Object.fromEntries(
	Object.entries(definitions).map(([name, definition]) => [name, Object.freeze({
		...definition,
		browserSuites: Object.freeze([...definition.browserSuites]),
	})]),
));

export const getReviewEnvironment = (name) => {
	const environment = reviewEnvironments[name];
	if (environment) return environment;

	throw new Error([
		`Unknown review target "${name ?? ''}".`,
		`Choose one of: ${reviewEnvironmentNames.join(', ')}.`,
	].join('\n'));
};
