import { Injectable } from "@angular/core";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Subject, fromEvent } from "rxjs";
import { filter, retry, switchMap } from "rxjs/operators";
import { appConfig } from "src/config";
import { environment } from "src/environments/environment";
import { Logger } from "src/logger";
import {
  APIApi,
  AccountApi,
  EventsApi,
  MembersApi,
  PhotoGalleryApi,
  RootResponseLinks,
  StatisticsApi,
  UsersApi,
} from "../api";

export type ApiEndpoints = RootResponseLinks;

export type ApiError = AxiosError;

axios.defaults.withCredentials = true;

interface WatchRequestOptions {
  maxRetries?: number;
  onFocus?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private readonly logger = new Logger(ApiService.name);

  readonly http = axios.create({ withCredentials: true });

  private readonly apiRoot = appConfig.apiRoot ?? environment.apiRoot;

  readonly albums = new PhotoGalleryApi(undefined, this.apiRoot, this.http);
  readonly events = new EventsApi(undefined, this.apiRoot, this.http);
  readonly members = new MembersApi(undefined, this.apiRoot, this.http);
  readonly account = new AccountApi(undefined, this.apiRoot, this.http);
  readonly users = new UsersApi(undefined, this.apiRoot, this.http);
  readonly statistics = new StatisticsApi(undefined, this.apiRoot, this.http);
  readonly api = new APIApi(undefined, this.apiRoot, this.http);

  private tabFocusEvent = fromEvent(document, "visibilitychange").pipe(
    filter(() => document.visibilityState === "visible"),
  );

  private reloadApiEvent = new Subject<void>();

  constructor() {}

  async init() {
    await this.reloadApi();
  }

  async reloadApi() {
    this.reloadApiEvent.next();
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
