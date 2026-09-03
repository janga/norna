import {
	assertTypographyContract,
	defaultTypography,
	resolveTypographyConfig,
} from './typography.mjs';
import {
	assertPaletteModeContract,
	createSemanticColorRoles,
	deriveSecondaryTextColor,
} from './presentation-contract.mjs';
import { presentationPaletteNames } from './presentation-palette-metadata.mjs';
import { resolveThemeConfig } from './theme-presets.mjs';

export { presentationPaletteNames };
export const appearanceNames = ['system', 'light', 'dark'];
const sectionBackgroundPatterns = Object.freeze({
	uniform: ['base'],
	alternating: ['base', 'soft'],
	accented: ['base', 'soft', 'emphasis', 'soft'],
});

const createPaletteMode = ({ appearance, page, surfaces, frame, css }) => {
	const resolvedSurfaces = Object.fromEntries(Object.entries(surfaces).map(([name, surface]) => [
		name,
		Object.freeze({
			...surface,
			secondaryTextColor: deriveSecondaryTextColor(surface.textColor, surface.backgroundColor),
		}),
	]));

	return Object.freeze({
		page: Object.freeze(page),
		surfaces: Object.freeze(resolvedSurfaces),
		frame: Object.freeze(frame),
		css: Object.freeze(css),
		semantic: createSemanticColorRoles({
			appearance,
			page,
			secondaryText: css.muted,
			linkText: css.accent,
		}),
	});
};

const presentationPalettes = Object.freeze({
	'near-monochrome': Object.freeze({
		defaultAppearance: 'dark',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#f7f7f5', textColor: '#171717' },
				surfaces: {
					base: { backgroundColor: '#f7f7f5', textColor: '#171717' },
					soft: { backgroundColor: '#ececea', textColor: '#171717' },
					emphasis: { backgroundColor: '#dadad6', textColor: '#171717' },
				},
				frame: { backgroundColor: '#f7f7f5', textColor: '#171717' },
				css: {
					surface: '#eeeeeb',
					muted: '#666660',
					soft: '#d8d8d3',
					accent: '#4b4b46',
					border: 'rgb(23 23 23 / 16%)',
					navSeparator: 'rgb(23 23 23 / 24%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#000000', textColor: '#f2eee6' },
				surfaces: {
					base: { backgroundColor: '#000000', textColor: '#f2eee6' },
					soft: { backgroundColor: '#171717', textColor: '#f2eee6' },
					emphasis: { backgroundColor: '#252525', textColor: '#f2eee6' },
				},
				frame: { backgroundColor: '#000000', textColor: '#f2eee6' },
				css: {
					surface: '#101010',
					muted: '#aaa49a',
					soft: '#302f2c',
					accent: '#d8d2c8',
					border: 'rgb(255 255 255 / 14%)',
					navSeparator: 'rgb(255 255 255 / 28%)',
				},
			}),
		}),
	}),
	'arctic-blue': Object.freeze({
		defaultAppearance: 'light',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#f3f6f8', textColor: '#202932' },
				surfaces: {
					base: { backgroundColor: '#f3f6f8', textColor: '#202932' },
					soft: { backgroundColor: '#e4eaf0', textColor: '#202932' },
					emphasis: { backgroundColor: '#d3dee8', textColor: '#202932' },
				},
				frame: { backgroundColor: '#f3f6f8', textColor: '#202932' },
				css: {
					surface: '#e9eef2',
					muted: '#5d6a76',
					soft: '#d5dfe7',
					accent: '#2a5877',
					border: 'rgb(32 41 50 / 16%)',
					navSeparator: 'rgb(32 41 50 / 24%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#17202a', textColor: '#edf3f7' },
				surfaces: {
					base: { backgroundColor: '#17202a', textColor: '#edf3f7' },
					soft: { backgroundColor: '#202c38', textColor: '#edf3f7' },
					emphasis: { backgroundColor: '#2b3c4b', textColor: '#edf3f7' },
				},
				frame: { backgroundColor: '#17202a', textColor: '#edf3f7' },
				css: {
					surface: '#1d2833',
					muted: '#b2bec8',
					soft: '#354655',
					accent: '#9bc5de',
					border: 'rgb(237 243 247 / 16%)',
					navSeparator: 'rgb(237 243 247 / 28%)',
				},
			}),
		}),
	}),
	'mineral-teal': Object.freeze({
		defaultAppearance: 'light',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#eef4f1', textColor: '#203631' },
				surfaces: {
					base: { backgroundColor: '#eef4f1', textColor: '#203631' },
					soft: { backgroundColor: '#dce9e4', textColor: '#203631' },
					emphasis: { backgroundColor: '#c8ddd5', textColor: '#203631' },
				},
				frame: { backgroundColor: '#eef4f1', textColor: '#203631' },
				css: {
					surface: '#e3ece8',
					muted: '#536560',
					soft: '#cfdfd9',
					accent: '#155f5a',
					border: 'rgb(32 54 49 / 17%)',
					navSeparator: 'rgb(32 54 49 / 24%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#102d2c', textColor: '#edf5f1' },
				surfaces: {
					base: { backgroundColor: '#102d2c', textColor: '#edf5f1' },
					soft: { backgroundColor: '#173a37', textColor: '#edf5f1' },
					emphasis: { backgroundColor: '#24504a', textColor: '#edf5f1' },
				},
				frame: { backgroundColor: '#102d2c', textColor: '#edf5f1' },
				css: {
					surface: '#153633',
					muted: '#b2c5bf',
					soft: '#2c554f',
					accent: '#8bd5ca',
					border: 'rgb(237 245 241 / 16%)',
					navSeparator: 'rgb(237 245 241 / 28%)',
				},
			}),
		}),
	}),
	'soft-lavender': Object.freeze({
		defaultAppearance: 'light',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#f7f3fa', textColor: '#2e2736' },
				surfaces: {
					base: { backgroundColor: '#f7f3fa', textColor: '#2e2736' },
					soft: { backgroundColor: '#ebe4f1', textColor: '#2e2736' },
					emphasis: { backgroundColor: '#ddd3e8', textColor: '#2e2736' },
				},
				frame: { backgroundColor: '#f7f3fa', textColor: '#2e2736' },
				css: {
					surface: '#eee8f3',
					muted: '#6c6273',
					soft: '#ded5e7',
					accent: '#604678',
					border: 'rgb(46 39 54 / 16%)',
					navSeparator: 'rgb(46 39 54 / 24%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#251f2e', textColor: '#f4edf8' },
				surfaces: {
					base: { backgroundColor: '#251f2e', textColor: '#f4edf8' },
					soft: { backgroundColor: '#31283d', textColor: '#f4edf8' },
					emphasis: { backgroundColor: '#42344f', textColor: '#f4edf8' },
				},
				frame: { backgroundColor: '#251f2e', textColor: '#f4edf8' },
				css: {
					surface: '#2d2538',
					muted: '#c1b4c7',
					soft: '#4b3d57',
					accent: '#d4b7e3',
					border: 'rgb(244 237 248 / 16%)',
					navSeparator: 'rgb(244 237 248 / 28%)',
				},
			}),
		}),
	}),
	'warm-paper': Object.freeze({
		defaultAppearance: 'light',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#f8f5ee', textColor: '#272522' },
				surfaces: {
					base: { backgroundColor: '#f8f5ee', textColor: '#272522' },
					soft: { backgroundColor: '#ebe5d9', textColor: '#272522' },
					emphasis: { backgroundColor: '#ded4c5', textColor: '#272522' },
				},
				frame: { backgroundColor: '#f8f5ee', textColor: '#272522' },
				css: {
					surface: '#f0ebe1',
					muted: '#6b655b',
					soft: '#d8d0c4',
					accent: '#5f513c',
					border: 'rgb(39 37 34 / 18%)',
					navSeparator: 'rgb(39 37 34 / 24%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#1b1916', textColor: '#f3ede2' },
				surfaces: {
					base: { backgroundColor: '#1b1916', textColor: '#f3ede2' },
					soft: { backgroundColor: '#25211c', textColor: '#f3ede2' },
					emphasis: { backgroundColor: '#342d25', textColor: '#f3ede2' },
				},
				frame: { backgroundColor: '#1b1916', textColor: '#f3ede2' },
				css: {
					surface: '#211e1a',
					muted: '#b9ad9c',
					soft: '#3b342b',
					accent: '#d5bea0',
					border: 'rgb(243 237 226 / 16%)',
					navSeparator: 'rgb(243 237 226 / 26%)',
				},
			}),
		}),
	}),
	'retro-earth': Object.freeze({
		defaultAppearance: 'light',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#f7efd9', textColor: '#34291c' },
				surfaces: {
					base: { backgroundColor: '#f7efd9', textColor: '#34291c' },
					soft: { backgroundColor: '#eadbb8', textColor: '#34291c' },
					emphasis: { backgroundColor: '#d8c18c', textColor: '#34291c' },
				},
				frame: { backgroundColor: '#f7efd9', textColor: '#34291c' },
				css: {
					surface: '#efe2c4',
					muted: '#6c5e4c',
					soft: '#deca9c',
					accent: '#5e4514',
					border: 'rgb(52 41 28 / 18%)',
					navSeparator: 'rgb(52 41 28 / 25%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#282117', textColor: '#f5e8c9' },
				surfaces: {
					base: { backgroundColor: '#282117', textColor: '#f5e8c9' },
					soft: { backgroundColor: '#382c1e', textColor: '#f5e8c9' },
					emphasis: { backgroundColor: '#4b3a24', textColor: '#f5e8c9' },
				},
				frame: { backgroundColor: '#282117', textColor: '#f5e8c9' },
				css: {
					surface: '#33291c',
					muted: '#c6b796',
					soft: '#54422a',
					accent: '#e5c36c',
					border: 'rgb(245 232 201 / 16%)',
					navSeparator: 'rgb(245 232 201 / 28%)',
				},
			}),
		}),
	}),
	'clay-rose': Object.freeze({
		defaultAppearance: 'light',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#f7efed', textColor: '#3c2929' },
				surfaces: {
					base: { backgroundColor: '#f7efed', textColor: '#3c2929' },
					soft: { backgroundColor: '#ecdeda', textColor: '#3c2929' },
					emphasis: { backgroundColor: '#ddc7c1', textColor: '#3c2929' },
				},
				frame: { backgroundColor: '#f7efed', textColor: '#3c2929' },
				css: {
					surface: '#f0e3e0',
					muted: '#6d5558',
					soft: '#e2cfca',
					accent: '#71313d',
					border: 'rgb(60 41 41 / 17%)',
					navSeparator: 'rgb(60 41 41 / 25%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#2d1e22', textColor: '#f7ebeb' },
				surfaces: {
					base: { backgroundColor: '#2d1e22', textColor: '#f7ebeb' },
					soft: { backgroundColor: '#3b282e', textColor: '#f7ebeb' },
					emphasis: { backgroundColor: '#50343d', textColor: '#f7ebeb' },
				},
				frame: { backgroundColor: '#2d1e22', textColor: '#f7ebeb' },
				css: {
					surface: '#36252a',
					muted: '#c8b3b7',
					soft: '#58404a',
					accent: '#e6a7b0',
					border: 'rgb(247 235 235 / 16%)',
					navSeparator: 'rgb(247 235 235 / 28%)',
				},
			}),
		}),
	}),
	'forest-moss': Object.freeze({
		defaultAppearance: 'light',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#f1f3e8', textColor: '#263225' },
				surfaces: {
					base: { backgroundColor: '#f1f3e8', textColor: '#263225' },
					soft: { backgroundColor: '#e1e6d2', textColor: '#263225' },
					emphasis: { backgroundColor: '#cbd5b7', textColor: '#263225' },
				},
				frame: { backgroundColor: '#f1f3e8', textColor: '#263225' },
				css: {
					surface: '#e7eadb',
					muted: '#52604c',
					soft: '#d5ddc5',
					accent: '#324e25',
					border: 'rgb(38 50 37 / 17%)',
					navSeparator: 'rgb(38 50 37 / 24%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#172218', textColor: '#eef2e6' },
				surfaces: {
					base: { backgroundColor: '#172218', textColor: '#eef2e6' },
					soft: { backgroundColor: '#213022', textColor: '#eef2e6' },
					emphasis: { backgroundColor: '#314531', textColor: '#eef2e6' },
				},
				frame: { backgroundColor: '#172218', textColor: '#eef2e6' },
				css: {
					surface: '#1d2a1e',
					muted: '#b8c3af',
					soft: '#394c37',
					accent: '#add493',
					border: 'rgb(238 242 230 / 16%)',
					navSeparator: 'rgb(238 242 230 / 28%)',
				},
			}),
		}),
	}),
	'vivid-night': Object.freeze({
		defaultAppearance: 'dark',
		modes: Object.freeze({
			light: createPaletteMode({
				appearance: 'light',
				page: { backgroundColor: '#f2f4fb', textColor: '#25243a' },
				surfaces: {
					base: { backgroundColor: '#f2f4fb', textColor: '#25243a' },
					soft: { backgroundColor: '#e2e6f3', textColor: '#25243a' },
					emphasis: { backgroundColor: '#d0d7eb', textColor: '#25243a' },
				},
				frame: { backgroundColor: '#f2f4fb', textColor: '#25243a' },
				css: {
					surface: '#e8eaf5',
					muted: '#62647a',
					soft: '#d5daec',
					accent: '#3b568f',
					border: 'rgb(37 36 58 / 16%)',
					navSeparator: 'rgb(37 36 58 / 24%)',
				},
			}),
			dark: createPaletteMode({
				appearance: 'dark',
				page: { backgroundColor: '#1d1b2d', textColor: '#f4f1ff' },
				surfaces: {
					base: { backgroundColor: '#1d1b2d', textColor: '#f4f1ff' },
					soft: { backgroundColor: '#29263d', textColor: '#f4f1ff' },
					emphasis: { backgroundColor: '#38334f', textColor: '#f4f1ff' },
				},
				frame: { backgroundColor: '#1d1b2d', textColor: '#f4f1ff' },
				css: {
					surface: '#252238',
					muted: '#bbb7cc',
					soft: '#403a58',
					accent: '#9fe4e8',
					border: 'rgb(244 241 255 / 16%)',
					navSeparator: 'rgb(244 241 255 / 28%)',
				},
			}),
		}),
	}),
});

const implementedPaletteNames = Object.keys(presentationPalettes);
const missingPaletteNames = presentationPaletteNames.filter((name) => !implementedPaletteNames.includes(name));
const unexpectedPaletteNames = implementedPaletteNames.filter((name) => !presentationPaletteNames.includes(name));
if (missingPaletteNames.length > 0 || unexpectedPaletteNames.length > 0) {
	throw new Error(`Palette metadata and implementations differ. Missing: ${missingPaletteNames.join(', ') || '(none)'}. Unexpected: ${unexpectedPaletteNames.join(', ') || '(none)'}.`);
}

for (const [paletteName, palette] of Object.entries(presentationPalettes)) {
	for (const [modeName, mode] of Object.entries(palette.modes)) {
		assertPaletteModeContract(paletteName, modeName, mode);
	}
}

export const getPresentationPalette = (paletteName = 'near-monochrome') => {
	const palette = presentationPalettes[paletteName];
	if (!palette) {
		throw new Error(`Unknown presentation palette: ${paletteName}. Use one of: ${presentationPaletteNames.join(', ')}`);
	}

	return palette;
};

export const getPresentationCssVariables = (presentation) => {
	const variables = {};
	for (const [modeName, palette] of Object.entries(presentation.paletteModes)) {
		const prefix = `--palette-${modeName}`;
		variables[`${prefix}-page-background`] = palette.page.backgroundColor;
		variables[`${prefix}-page-text`] = palette.page.textColor;
		variables[`${prefix}-frame-background`] = palette.frame.backgroundColor;
		variables[`${prefix}-frame-text`] = palette.frame.textColor;
		for (const [surfaceName, surface] of Object.entries(palette.surfaces)) {
			variables[`${prefix}-surface-${surfaceName}-background`] = surface.backgroundColor;
			variables[`${prefix}-surface-${surfaceName}-text`] = surface.textColor;
			variables[`${prefix}-surface-${surfaceName}-secondary-text`] = surface.secondaryTextColor;
		}
		for (const [name, value] of Object.entries(palette.css)) {
			const cssName = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
			variables[`${prefix}-${cssName}`] = value;
		}
		for (const [name, value] of Object.entries(palette.semantic)) {
			const cssName = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
			variables[`${prefix}-${cssName}`] = value;
		}
	}

	return variables;
};

const getSectionSurfaces = (pattern = 'uniform', sourceLabel = 'theme.yaml') => {
	const surfaces = sectionBackgroundPatterns[pattern];
	if (!surfaces) {
		throw new Error(`sections.backgroundPattern must be one of ${Object.keys(sectionBackgroundPatterns).join(', ')} in ${sourceLabel}.`);
	}

	return surfaces;
};

export const resolveThemePresentation = (theme, sourceLabel = 'theme.yaml') => {
	const normalizedTheme = resolveThemeConfig(theme, sourceLabel);
	const paletteName = normalizedTheme.palette ?? 'near-monochrome';
	const palette = getPresentationPalette(paletteName);
	const appearance = normalizedTheme.appearance ?? {};
	const readerControls = normalizedTheme.readerControls ?? {};
	const defaultAppearance = appearance.default ?? palette.defaultAppearance;
	if (!appearanceNames.includes(defaultAppearance)) {
		throw new Error(`appearance.default must be one of ${appearanceNames.join(', ')} in ${sourceLabel}.`);
	}
	const typography = resolveTypographyConfig(normalizedTheme.typography ?? defaultTypography, sourceLabel);
	const textWidth = normalizedTheme.layout?.textWidth;
	if (textWidth !== undefined) {
		typography.values.body.width = textWidth;
	}
	assertTypographyContract(typography, sourceLabel);

	return {
		paletteName,
		palette: palette.modes[defaultAppearance === 'dark' ? 'dark' : 'light'],
		paletteModes: palette.modes,
		appearance: {
			default: defaultAppearance,
		},
		readerPreferences: {
			controls: {
				appearance: readerControls.appearance === true,
				readingWidth: true,
				focusReading: readerControls.focusReading === true,
			},
			defaults: {
				appearance: defaultAppearance,
				readingWidth: textWidth === 'narrow' ? 'narrow' : textWidth === 'wide' ? 'wide' : 'standard',
				focusReading: 'off',
			},
		},
		blocks: {
			cardList: {
				width: normalizedTheme.blocks?.cardList?.width ?? 'normal',
			},
		},
		sectionSurfaces: getSectionSurfaces(normalizedTheme.sections?.backgroundPattern, sourceLabel),
		typography,
	};
};

export const assertSectionBackgroundPatternCompatibility = (
	theme,
	sourceLabel = 'theme.yaml',
	navigationMode = 'sections',
) => {
	const requestedPattern = theme?.sections?.backgroundPattern;
	if (navigationMode === 'tree' && requestedPattern !== undefined && requestedPattern !== 'uniform') {
		throw new Error([
			`sections.backgroundPattern "${requestedPattern}" cannot be used with tree navigation in ${sourceLabel}.`,
			'Tree navigation uses one uniform reading surface so the navigation rail and page content remain distinct.',
			'Remove sections.backgroundPattern or set it to uniform.',
		].join('\n'));
	}
};

export const resolvePagePresentation = (theme, sourceLabel, { navigationMode = 'sections' } = {}) => {
	assertSectionBackgroundPatternCompatibility(theme, sourceLabel, navigationMode);

	const resolvedThemePresentation = resolveThemePresentation(theme, sourceLabel);
	if (navigationMode === 'tree') {
		return {
			...resolvedThemePresentation,
			readerPreferences: {
				...resolvedThemePresentation.readerPreferences,
				controls: {
					...resolvedThemePresentation.readerPreferences.controls,
					focusReading: true,
				},
			},
			sectionSurfaces: getSectionSurfaces('uniform', sourceLabel),
		};
	}

	return resolvedThemePresentation;
};

const textWidthCssValues = Object.freeze({
	narrow: 'min(60ch, var(--text-width))',
	normal: 'min(72ch, var(--text-width))',
	wide: 'min(72ch, var(--image-layout-width))',
});

export const getTextWidthCssValue = (textWidth) => textWidthCssValues[textWidth];

export const resolveSectionSurface = (pagePresentation, sectionIndex) => {
	const surfaceName = pagePresentation.sectionSurfaces[sectionIndex % pagePresentation.sectionSurfaces.length];

	return {
		name: surfaceName,
		backgroundColor: `var(--color-surface-${surfaceName}-background)`,
		textColor: `var(--color-surface-${surfaceName}-text)`,
		secondaryTextColor: `var(--color-surface-${surfaceName}-secondary-text)`,
	};
};

export const resolveFrameColors = () => ({
	backgroundColor: 'var(--color-frame-background)',
	textColor: 'var(--color-frame-text)',
});
