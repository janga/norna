export const documentationPresetCandidates = Object.freeze([
	Object.freeze({
		id: 'editorial',
		label: 'Editorial',
		description: 'Serif reading typography, compact rhythm, and a uniform paper reading surface.',
		theme: `preset: documentation\n`,
	}),
	Object.freeze({
		id: 'technical',
		label: 'Technical',
		description: 'System sans-serif typography, compact rhythm, and a uniform reading surface.',
		theme: `preset: documentation
typography:
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  profile: dense
  rhythm: compact
layout:
  contentSpacing: compact
  textWidth: normal
sections:
  backgroundPattern: uniform
`,
	}),
	Object.freeze({
		id: 'restrained',
		label: 'Restrained',
		description: 'Restrained sans-serif typography, normal rhythm, and a uniform paper reading surface.',
		theme: `preset: documentation
typography:
  fontFamily: "'Helvetica Neue', Arial, sans-serif"
  profile: restrained
  rhythm: normal
layout:
  contentSpacing: normal
  textWidth: narrow
`,
	}),
]);
