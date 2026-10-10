import { Injectable, Signal, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { resolveOfflineResponse } from "src/app/core/offline/offline-responses";
import { readOfflineMeta } from "src/app/core/offline/offline-store";
import { Observable, ReplaySubject, Subject, fromEvent } from "rxjs";
import { filter, map, shareReplay, switchMap } from "rxjs/operators";
import { Config } from "src/config";
import { Logger } from "src/logger";
import { SDK } from "src/sdk";

export type RootLinks = SDK.RootResponseLinks;

export type ApiError = AxiosError;

axios.defaults.withCredentials = true;

declare module "axios" {
	interface AxiosRequestConfig {
		offlineFallback?: boolean;
	}
}

const apiAxios = axios.create();

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

	public readonly offline = signal(!navigator.onLine);

	public readonly servedOffline = signal(false);

	constructor(config: Config) {
		super(
			{
				basePath: config.apiRoot,
			},
			apiAxios,
		);

		window.addEventListener("offline", () => this.offline.set(true));
		window.addEventListener("online", () => this.offline.set(false));

		apiAxios.interceptors.response.use(
			(res) => {
				this.offline.set(false);
				this.servedOffline.set(false);
				return res;
			},
			(err) => {
				if (axios.isAxiosError(err) && err.config && this.isNetworkFailure(err)) {
					return this.fallbackOffline(err.config, err);
				}
				throw err;
			},
		);

		this.info.subscribe((info) => this.rootLinks.next(info._links));
	}

	private isNetworkFailure(err: AxiosError) {
		if (err.code === AxiosError.ERR_CANCELED) return false;
		const res = err.response;
		if (!res) return true;
		const empty = res.data instanceof Blob ? res.data.size === 0 : !res.data;
		return res.status === 504 && empty;
	}

	private async fallbackOffline(config: InternalAxiosRequestConfig, failure: AxiosError) {
		this.offline.set(true);

		const method = (config.method ?? "get").toLowerCase();
		const meta = readOfflineMeta();

		if (method === "get" && config.offlineFallback !== false && meta?.downloadedAt && config.url) {
			const found = await resolveOfflineResponse(config.url).catch((err) => {
				this.logger.error("Offline lookup failed", err);
				return undefined;
			});
			if (found) {
				this.servedOffline.set(true);
				return { data: found.data, status: 200, statusText: "OK", headers: {}, config } as AxiosResponse;
			}
		}

		if (failure.response) {
			throw new AxiosError("Network Error", AxiosError.ERR_NETWORK, config, failure.request);
		}
		throw failure;
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
