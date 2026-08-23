import packageJson from '../../package.json' with { type: 'json' };

export const documentationRef = `v${packageJson.version}`;
export const documentationRoot = `https://github.com/janga/norna/blob/${documentationRef}/docs`;

export const documentationLink = (label, file, anchor) => (
	`[${label}](${documentationRoot}/${file}${anchor ? `#${anchor}` : ''})`
);
