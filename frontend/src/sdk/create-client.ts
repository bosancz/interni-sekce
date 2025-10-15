import createClient, { Middleware } from "openapi-fetch";

export class FetchError extends Error {
	response!: {
		status: number;
		data: unknown;
	};
}

export function createApiClient<T extends object>(baseUrl: string) {
	const throwOnError: Middleware = {
		async onResponse({ response }) {
			if (response.status >= 400) {
				const error = new FetchError();
				error.response = {
					status: response.status,
					data: response.headers.get("content-type")?.includes("json")
						? await response.clone().json()
						: await response.clone().text(),
				};
				throw error;
			}
			return undefined;
		},
	};

	const headers: Record<string, string> = {};

	const client = createClient<T>({ baseUrl, headers });

	client.use(throwOnError);

	return client;
}
