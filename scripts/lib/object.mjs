export const isPlainObject = (value) => (
	value !== null
	&& typeof value === 'object'
	&& !Array.isArray(value)
);

export const freezeDeep = (value) => {
	if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;

	for (const child of Object.values(value)) freezeDeep(child);
	return Object.freeze(value);
};

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
