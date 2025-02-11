import { Injectable } from "@angular/core";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Subject, fromEvent } from "rxjs";
import { filter, retry, switchMap } from "rxjs/operators";
import { appConfig } from "src/config";
import { environment } from "src/environments/environment";
import { Logger } from "src/logger";
import { SDK } from "src/sdk";

export type RootLinks = SDK.RootResponseLinks;

export type ApiError = AxiosError;

axios.defaults.withCredentials = true;

interface WatchRequestOptions {
  maxRetries?: number;
  onFocus?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class ApiService extends SDK {
  private readonly logger = new Logger(ApiService.name);

  private tabFocusEvent = fromEvent(document, "visibilitychange").pipe(
    filter(() => document.visibilityState === "visible"),
  );
  private reloadApiEvent = new Subject<void>();

  public info = new Subject<SDK.RootResponseWithLinks>();
  public rootLinks = new Subject<SDK.RootResponseLinks>();

  constructor() {
    super({
      basePath: appConfig.apiRoot ?? environment.apiRoot,
    });

    this.reloadApiEvent.subscribe(() => this.loadInfo());

    this.reloadApi();
  }

  async init() {
    await this.reloadApi();
  }

  async reloadApi() {
    this.reloadApiEvent.next();
  }

  private async loadInfo() {
    const info = await this.RootApi.getApiInfo().then((res) => res.data);
    this.info.next(info);
    this.rootLinks.next(info._links);
  }

  isApiError(err: unknown): err is ApiError {
    return axios.isAxiosError(err);
  }

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
