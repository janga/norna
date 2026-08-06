export const typographyPresetNames = [
	'quiet-gallery',
	'compact-gallery',
	'text-forward',
	'statement',
];

export const typographyPresets = {
	'quiet-gallery': {
		heading: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			lineHeight: 1.08,
			spacing: '0.65em',
		},
		body: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			lineHeight: 1.5,
			paragraphSpacing: '0.85em',
		},
		caption: {
			align: { desktop: 'center', mobile: 'center' },
			size: 'small',
			lineHeight: 1.35,
			spacing: '0.5em',
		},
	},
	'compact-gallery': {
		heading: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			lineHeight: 1.08,
			spacing: '0.45em',
		},
		body: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			lineHeight: 1.42,
			paragraphSpacing: '0.6em',
		},
		caption: {
			align: { desktop: 'center', mobile: 'center' },
			size: 'small',
			lineHeight: 1.25,
			spacing: '0.35em',
		},
	},
	'text-forward': {
		heading: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			lineHeight: 1.12,
			spacing: '0.8em',
		},
		body: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			lineHeight: 1.62,
			paragraphSpacing: '1em',
		},
		caption: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'small',
			lineHeight: 1.4,
			spacing: '0.6em',
		},
	},
	statement: {
		heading: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			lineHeight: 1.04,
			spacing: '0.5em',
		},
		body: {
			align: { desktop: 'left', mobile: 'left' },
			size: 'medium',
			lineHeight: 1.42,
			paragraphSpacing: '0.75em',
		},
		caption: {
			align: { desktop: 'center', mobile: 'center' },
			size: 'small',
			lineHeight: 1.3,
			spacing: '0.45em',
		},
	},
};

export const defaultTypography = {
	preset: 'quiet-gallery',
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
	const preset = typographyPresets[presetName];

	if (!preset) {
		throw new Error(`Unknown typography preset: ${presetName}`);
	}

	return {
		preset: presetName,
		values: mergeDeep(preset, typography?.overrides),
	};
};

export const resolveTypographyOverride = (baseResolved, typographyConfig) => {
	if (typographyConfig?.preset) {
		return resolveTypographyConfig(typographyConfig);
	}

	if (typographyConfig?.overrides) {
		return {
			preset: baseResolved.preset,
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
