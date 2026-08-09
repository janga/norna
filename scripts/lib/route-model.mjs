export const routeDirectoryPattern = /^(?!000)(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;

export const parseRouteDirectory = (routeDirectory, label = 'route directory') => {
	const match = routeDirectory.match(routeDirectoryPattern);

	if (!match) {
		throw new Error(
			`Invalid ${label} "${routeDirectory}". Route directories must use the form NNN-route-id, for example 010-getting-started. The prefix must be 001-999 and route-id may contain only lowercase letters, numbers, and single hyphens.`,
		);
	}

	return {
		routeDirectory,
		routeOrder: Number.parseInt(match[1], 10),
		routeId: match[2],
	};
};
