import { Injectable, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Observable, ReplaySubject, Subject, fromEvent } from "rxjs";
import { filter, map, shareReplay, switchMap } from "rxjs/operators";
import { Config } from "src/config";
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

	public changelog = this.watch((signal) => this.RootApi.getChangelog({ signal })).pipe(
		map((res) => res.data.content),
	);
	public rootLinks = new ReplaySubject<SDK.RootResponseLinks>(1);

	public links: Signal<SDK.RootResponseLinks | undefined> = toSignal(this.rootLinks);

	constructor(config: Config) {
		super({
			basePath: config.apiRoot,
		});

		this.info.subscribe((info) => this.rootLinks.next(info._links));
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

		if (options.onFocus !== false) this.tabFocusEvent.subscribe(() => trigger.next());

		if (options.onApiReload !== false) this.reloadApiEvent.subscribe(() => trigger.next());

		if (options.customTrigger) options.customTrigger.subscribe(() => trigger.next());

		trigger.next();

		let abortController: AbortController | null = null;

		return trigger.pipe(
			switchMap(() => {
				abortController?.abort();
				abortController = new AbortController();
				return request(abortController.signal);
			}),
		);
	}
}
