import { Injectable } from "@angular/core";
import { Client } from "openapi-fetch";
import * as BackendApiTypes from "./backend.types";
import { createApiClient } from "./create-client";

export type { BackendApiTypes };

@Injectable()
export class BackendApi implements Client<BackendApiTypes.paths, "application/json"> {
	private readonly client: Client<BackendApiTypes.paths, "application/json"> =
		createApiClient<BackendApiTypes.paths>("/api");

	request = this.client.request;
	GET = this.client.GET;
	PUT = this.client.PUT;
	POST = this.client.POST;
	DELETE = this.client.DELETE;
	OPTIONS = this.client.OPTIONS;
	HEAD = this.client.HEAD;
	PATCH = this.client.PATCH;
	TRACE = this.client.TRACE;
	use = this.client.use;
	eject = this.client.eject;

	constructor() {}

	watchRequest<T, D>(
		request: (signal: AbortSignal) => Promise<AxiosResponse<T, D>>,
		options: WatchRequestOptions = {},
	) {
		const trigger = new Subject<void>();

		this.tabFocusEvent.subscribe(() => trigger.next());
		this.reloadApiEvent.subscribe(() => trigger.next());

		return trigger
			.pipe(
				switchMap(() => {
					const controller = new AbortController();
					trigger.subscribe(() => controller.abort());
					return request(controller.signal);
				}),
			)
			.pipe(retry(options.maxRetries));
	}
}
