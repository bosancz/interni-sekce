import { Injectable } from "@angular/core";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Observable, ReplaySubject, Subject, fromEvent } from "rxjs";
import { filter, map, shareReplay, switchMap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { Logger } from "src/logger";
import { SDK } from "src/sdk";

export type RootLinks = SDK.RootResponseLinks;

export type ApiError = AxiosError;

axios.defaults.withCredentials = true;

interface WatchRequestOptions {
	onFocus?: boolean;
	onApiReload?: boolean;
	customTrigger?: Observable<void>;
}

type WatchedRequest<T, D, H> = Observable<AxiosResponse<T, D, H>>;

@Injectable({
	providedIn: "root",
})
export class ApiService extends SDK {
	private readonly logger = new Logger(ApiService.name);

	private tabFocusEvent = fromEvent(document, "visibilitychange").pipe(
		filter(() => document.visibilityState === "visible"),
	);
	private reloadApiEvent = new Subject<void>();

	public info = this.watch((signal) => this.RootApi.getApiInfo({ signal })).pipe(
		map((res) => res.data),
		shareReplay(1),
	);
	public rootLinks = new ReplaySubject<SDK.RootResponseLinks>();

	constructor() {
		super({
			basePath: environment.apiRoot,
		});
	}

	async reloadApi() {
		this.reloadApiEvent.next();
	}

	isApiError(err: unknown): err is ApiError {
		return axios.isAxiosError(err);
	}

	watch<T, D, H>(
		request: (signal: AbortSignal) => Promise<AxiosResponse<T, D, H>>,
		options: WatchRequestOptions = {},
	): WatchedRequest<T, D, H> {
		const trigger = new ReplaySubject<void>(1);

		// reload on window/tab blur+focus
		if (options.onFocus !== false) this.tabFocusEvent.subscribe(() => trigger.next());

		// reload on manual API reload trigger
		if (options.onApiReload !== false) this.reloadApiEvent.subscribe(() => trigger.next());

		// reload on provided custom trigger
		if (options.customTrigger) options.customTrigger.subscribe(() => trigger.next());

		// load data on initialization
		trigger.next();

		let abortController: AbortController | null = null;

		return trigger.pipe(
			switchMap(() => {
				// abort previous request if not finished yet
				abortController?.abort();
				abortController = new AbortController();
				// issue new request
				return request(abortController.signal);
			}),
		);
	}
}
