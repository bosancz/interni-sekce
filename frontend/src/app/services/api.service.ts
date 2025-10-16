import { Injectable } from "@angular/core";
import axios, { AxiosError } from "axios";
import { Subject } from "rxjs";
import { Logger } from "src/logger";
import { BackendApi, BackendApiTypes } from "src/sdk/backend.client";
import { RootResponseWithLinks } from "src/sdk/backend.types";

export type RootLinks = BackendApiTypes.RootResponseLinks;

export type ApiError = AxiosError;

axios.defaults.withCredentials = true;

@Injectable({
	providedIn: "root",
})
export class ApiService extends BackendApi {
	private readonly logger = new Logger(ApiService.name);

	public info = new Subject<BackendApiTypes.RootResponseWithLinks>();
	public rootLinks = new Subject<BackendApiTypes.RootResponseLinks>();

	constructor() {
		super();

		this.watch("/api", { watchOptions: { maxRetries: Infinity, onFocus: true } }).subscribe((res) =>
			this.loadInfo(res.data),
		);
	}

	private async loadInfo(info: RootResponseWithLinks) {
		this.info.next(info);
		this.rootLinks.next(info._links);
	}

	isApiError(err: unknown): err is ApiError {
		return axios.isAxiosError(err);
	}
}
