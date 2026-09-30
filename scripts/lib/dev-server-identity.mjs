import { realpath } from 'node:fs/promises';

export const identityPath = '/.well-known/norna-dev';
export const readDevServerIdentity = async (state, siteRoot) => {
	if (!state?.token || !Number.isInteger(state.port) || state.port < 1 || state.port > 65535) return null;
	try {
		const response = await fetch(`http://127.0.0.1:${state.port}${identityPath}`, { signal: AbortSignal.timeout(1500), redirect: 'error' });
		if (!response.ok) return null;
		const identity = await response.json();
		return identity.token === state.token && Number.isInteger(identity.pid) && identity.pid > 0 && identity.siteRoot === await realpath(siteRoot) ? identity : null;
	} catch { return null; }
};
export const verifyDevServer = async (state, siteRoot) => Number.isInteger(state?.pid) && state.pid > 0
	&& (await readDevServerIdentity(state, siteRoot))?.pid === state.pid;

export const devServerIdentityPlugin = siteRoot => ({
	name: 'norna-dev-server-identity',
	async configureServer(server) {
		const canonicalRoot = await realpath(siteRoot);
		return () => {
			server.middlewares.stack.unshift({ route: '', handle(request, response, next) {
				if (request.url !== identityPath || request.method !== 'GET' || !process.env.NORNA_DEV_TOKEN) return next();
				if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress)) return next();
				response.setHeader('Content-Type', 'application/json');
				response.setHeader('Cache-Control', 'no-store');
				response.end(JSON.stringify({ siteRoot: canonicalRoot, token: process.env.NORNA_DEV_TOKEN, pid: process.pid }));
			} });
		};
	},
});
