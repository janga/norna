export const pageDirectoryPattern = /^(?!000)(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

export const parsePageDirectory = (pageDirectory, label = 'page directory') => {
	const match = pageDirectory.match(pageDirectoryPattern);

	if (!match) {
		throw new Error(
			`Invalid ${label} "${pageDirectory}". Page directories must use the form NNN-page-id, for example 010-getting-started. The prefix must be 001-999 and page-id may contain only lowercase letters, numbers, and single hyphens.`,
		);
	}

	return {
		pageDirectory,
		pageOrder: Number.parseInt(match[1], 10),
		pageId: match[2],
	};
};
