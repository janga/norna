export const typographyPresetNames = [
	'quiet-gallery',
	'compact-gallery',
	'text-forward',
	'statement',
];

export const typographyRhythmNames = [
	'compact',
	'normal',
	'airy',
];

export const typographyPresets = {
	'quiet-gallery': {
		headings: {
			h1: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 400,
				lineHeight: 1.04,
			},
			h2: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 400,
				lineHeight: 1.08,
			},
			h3: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 500,
				lineHeight: 1.35,
			},
			h4: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 400,
				lineHeight: 1.5,
			},
		},
		body: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			width: 'normal',
			lineHeight: 1.5,
		},
		caption: {
			align: { desktop: 'center', mobile: 'center' },
			size: 'medium',
			lineHeight: 1.35,
		},
	},
	'compact-gallery': {
		headings: {
			h1: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 500,
				lineHeight: 1.04,
			},
			h2: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 500,
				lineHeight: 1.08,
			},
			h3: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 600,
				lineHeight: 1.3,
			},
			h4: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 500,
				lineHeight: 1.42,
			},
		},
		body: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			width: 'wide',
			lineHeight: 1.42,
		},
		caption: {
			align: { desktop: 'center', mobile: 'center' },
			size: 'medium',
			lineHeight: 1.25,
		},
	},
	'text-forward': {
		headings: {
			h1: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 500,
				lineHeight: 1.06,
			},
			h2: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 500,
				lineHeight: 1.12,
			},
			h3: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 500,
				lineHeight: 1.35,
			},
			h4: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 400,
				lineHeight: 1.55,
			},
		},
		body: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			width: 'narrow',
			lineHeight: 1.62,
		},
		caption: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			lineHeight: 1.4,
		},
	},
	statement: {
		headings: {
			h1: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 600,
				lineHeight: 1.02,
			},
			h2: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 600,
				lineHeight: 1.04,
			},
			h3: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 600,
				lineHeight: 1.18,
			},
			h4: {
				align: { desktop: 'left', mobile: 'left' },
				size: 'medium',
				weight: 500,
				lineHeight: 1.42,
			},
		},
		body: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			width: 'narrow',
			lineHeight: 1.42,
		},
		caption: {
			align: { desktop: 'center', mobile: 'center' },
			size: 'medium',
			lineHeight: 1.3,
		},
	},
};

export const typographyRhythms = {
	compact: {
		headings: {
			h1: { spacingBefore: '0', spacingAfter: '0.4em' },
			h2: { spacingBefore: '0', spacingAfter: '0.45em' },
			h3: { spacingBefore: '1.2em', spacingAfter: '0.4em' },
			h4: { spacingBefore: '0.9em', spacingAfter: '0.35em' },
		},
		body: {
			paragraphSpacing: '0.65em',
		},
		caption: {
			spacingBefore: '0.35em',
		},
	},
	normal: {
		headings: {
			h1: { spacingBefore: '0', spacingAfter: '0.5em' },
			h2: { spacingBefore: '0', spacingAfter: '0.55em' },
			h3: { spacingBefore: '1.5em', spacingAfter: '0.5em' },
			h4: { spacingBefore: '1.1em', spacingAfter: '0.4em' },
		},
		body: {
			paragraphSpacing: '0.85em',
		},
		caption: {
			spacingBefore: '0.5em',
		},
	},
	airy: {
		headings: {
			h1: { spacingBefore: '0', spacingAfter: '0.65em' },
			h2: { spacingBefore: '0', spacingAfter: '0.7em' },
			h3: { spacingBefore: '1.9em', spacingAfter: '0.6em' },
			h4: { spacingBefore: '1.35em', spacingAfter: '0.5em' },
		},
		body: {
			paragraphSpacing: '1em',
		},
		caption: {
			spacingBefore: '0.65em',
		},
	},
};

export const defaultTypography = {
	preset: 'quiet-gallery',
	rhythm: 'normal',
};

const isPlainObject = (value) => (
	value !== null &&
	typeof value === 'object' &&
	!Array.isArray(value)
);

export const mergeDeep = (base, override) => {
	if (!isPlainObject(override)) return structuredClone(base);

	const merged = structuredClone(base);

	for (const [key, value] of Object.entries(override)) {
		if (isPlainObject(value) && isPlainObject(merged[key])) {
			merged[key] = mergeDeep(merged[key], value);
		} else if (value !== undefined) {
			merged[key] = value;
		}
	}

	return merged;
};

export const resolveTypographyConfig = (typography = defaultTypography) => {
	const presetName = typography?.preset ?? defaultTypography.preset;
	const rhythmName = typography?.rhythm ?? defaultTypography.rhythm;
	const preset = typographyPresets[presetName];
	const rhythm = typographyRhythms[rhythmName];

	if (!preset) {
		throw new Error(`Unknown typography preset: ${presetName}`);
	}

	if (!rhythm) {
		throw new Error(`Unknown typography rhythm: ${rhythmName}`);
	}

	return {
		preset: presetName,
		rhythm: rhythmName,
		values: mergeDeep(mergeDeep(preset, rhythm), typography?.overrides),
	};
};

export const resolveTypographyOverride = (baseResolved, typographyConfig) => {
	if (typographyConfig?.preset || typographyConfig?.rhythm) {
		return resolveTypographyConfig({
			preset: typographyConfig.preset ?? baseResolved.preset,
			rhythm: typographyConfig.rhythm ?? baseResolved.rhythm,
			overrides: typographyConfig.overrides,
		});
	}

	if (typographyConfig?.overrides) {
		return {
			preset: baseResolved.preset,
			rhythm: baseResolved.rhythm,
			values: mergeDeep(baseResolved.values, typographyConfig.overrides),
		};
	}

	return baseResolved;
};

export const resolveSectionTypography = (defaultTypographyConfig, sectionTypographyConfig) => {
	const defaultResolved = resolveTypographyConfig(defaultTypographyConfig);

	return resolveTypographyOverride(defaultResolved, sectionTypographyConfig);
};

const quoteString = (value) => typeof value === 'string' && !/^[a-z0-9.-]+$/i.test(value)
	? JSON.stringify(value)
	: value;

export const toYamlLines = (value, indent = 0) => {
	const prefix = ' '.repeat(indent);

	return Object.entries(value).flatMap(([key, entry]) => {
		if (isPlainObject(entry)) {
			return [`${prefix}${key}:`, ...toYamlLines(entry, indent + 2)];
		}

		return `${prefix}${key}: ${quoteString(entry)}`;
	});
};
