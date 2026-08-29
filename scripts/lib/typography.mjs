import { isPlainObject, mergeDeep } from './object.mjs';

export const typographySizeNames = [
	'small',
	'medium',
	'large',
	'xlarge',
];

export const headingTypographySizeValues = {
	h1: {
		small: {
			desktop: 'clamp(1.35rem, 1.2rem + 0.55vw, 1.7rem)',
			mobile: 'clamp(1.32rem, 1.16rem + 0.8vw, 1.58rem)',
		},
		medium: {
			desktop: 'clamp(1.65rem, 1.35rem + 1.1vw, 2.4rem)',
			mobile: 'clamp(1.5rem, 1.22rem + 1.4vw, 2rem)',
		},
		large: {
			desktop: 'clamp(1.95rem, 1.48rem + 1.7vw, 3.2rem)',
			mobile: 'clamp(1.75rem, 1.32rem + 2.15vw, 2.5rem)',
		},
		xlarge: {
			desktop: 'clamp(2.35rem, 1.58rem + 2.75vw, 4.4rem)',
			mobile: 'clamp(2rem, 1.4rem + 3vw, 3.1rem)',
		},
	},
	h2: {
		small: {
			desktop: 'clamp(1.1rem, 1.02rem + 0.35vw, 1.35rem)',
			mobile: 'clamp(1.12rem, 1rem + 0.85vw, 1.42rem)',
		},
		medium: {
			desktop: 'clamp(1.35rem, 1.1rem + 0.9vw, 2rem)',
			mobile: 'clamp(1.3rem, 1.05rem + 1.35vw, 1.75rem)',
		},
		large: {
			desktop: 'clamp(1.6rem, 1.22rem + 1.45vw, 2.75rem)',
			mobile: 'clamp(1.5rem, 1.12rem + 2vw, 2.25rem)',
		},
		xlarge: {
			desktop: 'clamp(2rem, 1.35rem + 2.4vw, 3.75rem)',
			mobile: 'clamp(1.8rem, 1.25rem + 3vw, 2.85rem)',
		},
	},
	h3: {
		small: {
			desktop: 'clamp(0.96rem, 0.94rem + 0.08vw, 1rem)',
			mobile: 'clamp(0.96rem, 0.94rem + 0.08vw, 1rem)',
		},
		medium: {
			desktop: 'clamp(1.05rem, 0.98rem + 0.28vw, 1.22rem)',
			mobile: 'clamp(1.04rem, 0.98rem + 0.45vw, 1.18rem)',
		},
		large: {
			desktop: 'clamp(1.16rem, 1.02rem + 0.5vw, 1.5rem)',
			mobile: 'clamp(1.12rem, 1rem + 0.75vw, 1.36rem)',
		},
		xlarge: {
			desktop: 'clamp(1.32rem, 1.08rem + 0.85vw, 1.9rem)',
			mobile: 'clamp(1.24rem, 1.04rem + 1.15vw, 1.65rem)',
		},
	},
	h4: {
		small: {
			desktop: 'clamp(0.86rem, 0.84rem + 0.08vw, 0.92rem)',
			mobile: 'clamp(0.86rem, 0.84rem + 0.08vw, 0.92rem)',
		},
		medium: {
			desktop: 'clamp(0.96rem, 0.94rem + 0.08vw, 1rem)',
			mobile: 'clamp(0.96rem, 0.94rem + 0.08vw, 1rem)',
		},
		large: {
			desktop: 'clamp(1.05rem, 1rem + 0.16vw, 1.12rem)',
			mobile: 'clamp(1.05rem, 1rem + 0.16vw, 1.12rem)',
		},
		xlarge: {
			desktop: 'clamp(1.14rem, 1.06rem + 0.26vw, 1.25rem)',
			mobile: 'clamp(1.14rem, 1.06rem + 0.26vw, 1.25rem)',
		},
	},
};

export const bodyTypographySizeValues = {
	small: {
		desktop: 'clamp(0.86rem, 0.84rem + 0.08vw, 0.92rem)',
		mobile: 'clamp(0.86rem, 0.84rem + 0.08vw, 0.92rem)',
	},
	medium: {
		desktop: 'clamp(0.96rem, 0.94rem + 0.08vw, 1rem)',
		mobile: 'clamp(0.96rem, 0.94rem + 0.08vw, 1rem)',
	},
	large: {
		desktop: 'clamp(1.05rem, 1rem + 0.16vw, 1.12rem)',
		mobile: 'clamp(1.05rem, 1rem + 0.16vw, 1.12rem)',
	},
	xlarge: {
		desktop: 'clamp(1.14rem, 1.06rem + 0.26vw, 1.25rem)',
		mobile: 'clamp(1.14rem, 1.06rem + 0.26vw, 1.25rem)',
	},
};

export const captionTypographySizeValues = {
	small: {
		desktop: 'clamp(0.78rem, 0.76rem + 0.08vw, 0.84rem)',
		mobile: 'clamp(0.78rem, 0.76rem + 0.08vw, 0.84rem)',
	},
	medium: {
		desktop: 'clamp(0.86rem, 0.84rem + 0.08vw, 0.92rem)',
		mobile: 'clamp(0.86rem, 0.84rem + 0.08vw, 0.92rem)',
	},
	large: {
		desktop: 'clamp(0.96rem, 0.92rem + 0.12vw, 1rem)',
		mobile: 'clamp(0.96rem, 0.92rem + 0.12vw, 1rem)',
	},
	xlarge: {
		desktop: 'clamp(1.04rem, 0.98rem + 0.18vw, 1.12rem)',
		mobile: 'clamp(1.04rem, 0.98rem + 0.18vw, 1.12rem)',
	},
};

export const getTypographySizeValue = (sizeValues, size) => sizeValues[size];
export const getHeadingTypographySizeValue = (level, size) => (
	headingTypographySizeValues[level][size]
);

const headingLevels = Object.freeze(['h1', 'h2', 'h3', 'h4']);
const textWidthNames = Object.freeze(['narrow', 'normal', 'wide']);
const responsiveModes = Object.freeze({
	mobile: Object.freeze({ from: 320, to: 700 }),
	desktop: Object.freeze({ from: 701, to: 2560 }),
});
const responsiveClampPattern = /^clamp\(([\d.]+)rem,\s*([\d.]+)rem\s*\+\s*([\d.]+)vw,\s*([\d.]+)rem\)$/u;
const parsedResponsiveSizes = new Map();
const validatedTypographySignatures = new Set();

const evaluateResponsiveSize = (value, viewportWidth) => {
	let parsed = parsedResponsiveSizes.get(value);
	if (!parsed) {
		const match = value.match(responsiveClampPattern);
		if (!match) {
			throw new Error(`Cannot validate unsupported responsive typography size: ${value}`);
		}

		const [, minimumRem, baseRem, viewportWidthFactor, maximumRem] = match.map(Number);
		parsed = { minimumRem, baseRem, viewportWidthFactor, maximumRem };
		parsedResponsiveSizes.set(value, parsed);
	}

	const preferredPixels = (parsed.baseRem * 16) + ((parsed.viewportWidthFactor / 100) * viewportWidth);
	return Math.min(parsed.maximumRem * 16, Math.max(parsed.minimumRem * 16, preferredPixels));
};

export const assertTypographyContract = (typography, sourceLabel = 'theme.yaml') => {
	const values = typography?.values ?? typography;
	if (!values?.headings || !values?.body || !values?.caption) {
		throw new Error(`Incomplete typography configuration in ${sourceLabel}.`);
	}

	for (const level of headingLevels) {
		const heading = values.headings[level];
		if (!heading || !typographySizeNames.includes(heading.size)) {
			throw new Error(`${level}.size must be one of ${typographySizeNames.join(', ')} in ${sourceLabel}.`);
		}
		if (!Number.isFinite(heading.lineHeight) || heading.lineHeight < 1) {
			throw new Error(`${level}.lineHeight must be at least 1 in ${sourceLabel}.`);
		}
	}

	if (!typographySizeNames.includes(values.body.size)) {
		throw new Error(`body.size must be one of ${typographySizeNames.join(', ')} in ${sourceLabel}.`);
	}
	if (!textWidthNames.includes(values.body.width)) {
		throw new Error(`body.width must be one of ${textWidthNames.join(', ')} in ${sourceLabel}.`);
	}
	if (!Number.isFinite(values.body.lineHeight) || values.body.lineHeight < 1.4) {
		throw new Error(`body.lineHeight must be at least 1.4 in ${sourceLabel}.`);
	}
	if (!typographySizeNames.includes(values.caption.size)) {
		throw new Error(`caption.size must be one of ${typographySizeNames.join(', ')} in ${sourceLabel}.`);
	}
	if (!Number.isFinite(values.caption.lineHeight) || values.caption.lineHeight < 1.25) {
		throw new Error(`caption.lineHeight must be at least 1.25 in ${sourceLabel}.`);
	}
	const signature = JSON.stringify({
		body: { lineHeight: values.body.lineHeight, size: values.body.size, width: values.body.width },
		caption: { lineHeight: values.caption.lineHeight, size: values.caption.size },
		headings: Object.fromEntries(headingLevels.map((level) => [level, {
			lineHeight: values.headings[level].lineHeight,
			size: values.headings[level].size,
		}])),
	});
	if (validatedTypographySignatures.has(signature)) return typography;

	for (const [mode, range] of Object.entries(responsiveModes)) {
		for (let viewportWidth = range.from; viewportWidth <= range.to; viewportWidth += 1) {
			const sizes = headingLevels.map((level) => evaluateResponsiveSize(
				headingTypographySizeValues[level][values.headings[level].size][mode],
				viewportWidth,
			));

			for (let index = 0; index < headingLevels.length - 1; index += 1) {
				if (sizes[index] <= sizes[index + 1]) {
					const currentLevel = headingLevels[index];
					const nextLevel = headingLevels[index + 1];
					throw new Error([
						`Typography must preserve ${currentLevel.toUpperCase()} > ${nextLevel.toUpperCase()} in ${sourceLabel}.`,
						`The selected sizes ${values.headings[currentLevel].size} and ${values.headings[nextLevel].size}`,
						`cross at ${viewportWidth}px in the ${mode} scale.`,
					].join(' '));
				}
			}
		}
	}
	validatedTypographySignatures.add(signature);

	return typography;
};

export const typographyProfiles = {
	restrained: {
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
	dense: {
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
	reading: {
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
	profile: 'restrained',
	rhythm: 'normal',
};

export const resolveTypographyConfig = (typography = defaultTypography, sourceLabel = 'theme.yaml') => {
	const profileName = typography?.profile ?? defaultTypography.profile;
	const rhythmName = typography?.rhythm ?? defaultTypography.rhythm;
	const profile = typographyProfiles[profileName];
	const rhythm = typographyRhythms[rhythmName];

	if (!profile) {
		throw new Error(`Unknown typography profile: ${profileName}`);
	}

	if (!rhythm) {
		throw new Error(`Unknown typography rhythm: ${rhythmName}`);
	}

	return assertTypographyContract({
		profile: profileName,
		rhythm: rhythmName,
		values: mergeDeep(mergeDeep(profile, rhythm), typography?.overrides),
	}, sourceLabel);
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
