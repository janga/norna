import { freezeDeep, mergeDeep } from './object.mjs';

export const themeProfileDefinitions = freezeDeep({
	color: {
		'monochrome-dark': {
			colorMode: { default: 'dark', allowSelection: true },
			palette: 'dark',
		},
		'paper-adaptive': {
			colorMode: { default: 'system', allowSelection: true },
			palette: 'paper',
		},
		'clear-adaptive': {
			colorMode: { default: 'system', allowSelection: true },
			palette: 'light',
		},
	},
	typography: {
		'restrained-sans': {
			typography: {
				fontFamily: "'Helvetica Neue', Arial, sans-serif",
				profile: 'restrained',
			},
		},
		'editorial-reading': {
			typography: {
				fontFamily: "Georgia, 'Times New Roman', serif",
				profile: 'reading',
			},
		},
		'system-reading': {
			typography: {
				fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
				profile: 'reading',
			},
		},
		'expressive-sans': {
			typography: {
				fontFamily: "'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif",
				profile: 'statement',
			},
		},
	},
	rhythm: {
		balanced: {
			layout: { contentSpacing: 'normal' },
			typography: { rhythm: 'normal' },
		},
		compact: {
			layout: { contentSpacing: 'compact' },
			typography: { rhythm: 'compact' },
		},
		expansive: {
			layout: { contentSpacing: 'spacious' },
			typography: { rhythm: 'airy' },
		},
	},
	geometry: {
		'image-led': {
			layout: {
				textWidth: 'wide',
				pageWidth: '1240px',
				localNavigationGap: 'clamp(1rem, 2vw, 1.75rem)',
				noteWidth: '13rem',
				noteGap: '1.5rem',
				gutter: {
					desktop: 'clamp(1.25rem, 4vw, 3rem)',
					mobile: '1rem',
				},
			},
		},
		'focused-reading': {
			layout: {
				textWidth: 'narrow',
				pageWidth: '1240px',
				localNavigationGap: 'clamp(1rem, 2vw, 1.5rem)',
				noteWidth: '12rem',
				noteGap: '1.25rem',
				gutter: {
					desktop: 'clamp(1.25rem, 4vw, 3rem)',
					mobile: '1rem',
				},
			},
		},
		'balanced-site': {
			layout: {
				textWidth: 'normal',
				pageWidth: '1120px',
				localNavigationGap: 'clamp(1rem, 2vw, 1.5rem)',
				noteWidth: '12rem',
				noteGap: '1.25rem',
				gutter: {
					desktop: 'clamp(1.25rem, 4vw, 3rem)',
					mobile: '1rem',
				},
			},
		},
		'expansive-statement': {
			layout: {
				textWidth: 'normal',
				pageWidth: '1280px',
				localNavigationGap: 'clamp(1rem, 2vw, 1.75rem)',
				noteWidth: '13rem',
				noteGap: '1.75rem',
				gutter: {
					desktop: 'clamp(1.5rem, 5vw, 4rem)',
					mobile: '1rem',
				},
			},
		},
	},
	media: {
		prominent: {
			images: {
				width: '1000px',
				maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
				maxAvailableHeightPercent: { desktop: 78, mobile: 68 },
			},
		},
		supporting: {
			images: {
				width: '920px',
				maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
				maxAvailableHeightPercent: { desktop: 74, mobile: 68 },
			},
		},
		balanced: {
			images: {
				width: '840px',
				maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
				maxAvailableHeightPercent: { desktop: 70, mobile: 62 },
			},
		},
		immersive: {
			images: {
				width: '1080px',
				maxAvailableWidthPercent: { desktop: 100, mobile: 100 },
				maxAvailableHeightPercent: { desktop: 80, mobile: 70 },
			},
		},
	},
	shape: {
		square: { shape: 'square' },
		soft: { shape: 'soft' },
	},
	surfaces: {
		uniform: { sections: { backgroundPattern: 'uniform' } },
		alternating: { sections: { backgroundPattern: 'alternating' } },
		cycling: { sections: { backgroundPattern: 'cycling' } },
	},
});

export const themeProfileCategoryNames = Object.freeze(Object.keys(themeProfileDefinitions));

const collectLeafPaths = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => {
	const path = prefix ? `${prefix}.${key}` : key;
	if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
		return collectLeafPaths(child, path);
	}

	return path;
});

const formatAvailableProfiles = (category) => Object.keys(themeProfileDefinitions[category]).join(', ');

export const resolveThemeProfileRecipe = (recipe, sourceLabel = 'theme preset recipe') => {
	if (recipe === null || typeof recipe !== 'object' || Array.isArray(recipe)) {
		throw new Error(`Theme profile recipe must be an object in ${sourceLabel}.`);
	}

	const unknownCategories = Object.keys(recipe)
		.filter((category) => !themeProfileCategoryNames.includes(category));
	if (unknownCategories.length > 0) {
		throw new Error(`Unknown theme profile category "${unknownCategories[0]}" in ${sourceLabel}.`);
	}

	const missingCategories = themeProfileCategoryNames
		.filter((category) => recipe[category] === undefined);
	if (missingCategories.length > 0) {
		throw new Error(`Missing theme profile category "${missingCategories[0]}" in ${sourceLabel}.`);
	}

	const pathOwners = new Map();
	let resolved = {};

	for (const category of themeProfileCategoryNames) {
		const profileName = recipe[category];
		const profile = themeProfileDefinitions[category][profileName];
		if (!profile) {
			throw new Error(
				`Unknown ${category} profile "${profileName}" in ${sourceLabel}. `
				+ `Use one of: ${formatAvailableProfiles(category)}.`,
			);
		}

		for (const path of collectLeafPaths(profile)) {
			const previousCategory = pathOwners.get(path);
			if (previousCategory) {
				throw new Error(
					`Theme profile categories "${previousCategory}" and "${category}" both own "${path}" in ${sourceLabel}.`,
				);
			}
			pathOwners.set(path, category);
		}

		resolved = mergeDeep(resolved, profile);
	}

	return resolved;
};
