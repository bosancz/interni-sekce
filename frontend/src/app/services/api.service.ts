import { Injectable } from "@angular/core";
import axios, { AxiosError, AxiosResponse } from "axios";
import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";
import { appConfig } from "src/config";
import { environment } from "src/environments/environment";
import { Logger } from "src/logger";
import {
  APIApi,
  AccountApi,
  EventsApi,
  GroupResponseWithLinks,
  MembersApi,
  PhotoGalleryApi,
  RootResponseLinks,
  RootResponseWithLinks,
  StatisticsApi,
  UsersApi,
} from "../api";

export type ApiEndpoints = RootResponseLinks;

export type ApiError = AxiosError;

axios.defaults.withCredentials = true;

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

  readonly cache = {
    groups: new CachedSubject<GroupResponseWithLinks[]>(this, (api) => api.members.listGroups()),
    apiInfo: new CachedSubject<RootResponseWithLinks>(this, (api) => api.api.getApiInfo()),
  };

  endpoints = new BehaviorSubject<ApiEndpoints | null>(null);

  constructor() {
    this.cache.apiInfo.pipe(map((info) => info?._links ?? null)).subscribe(this.endpoints);
  }

  async init() {
    await this.reloadApi();
    this.logger.log("API initialized", this.cache.apiInfo.value);
  }

  async reloadApi() {
    return Promise.all(Object.values(this.cache).map((subject) => subject.load()));
  }

  isApiError(err: unknown): err is ApiError {
    return axios.isAxiosError(err);
  }
}

class CachedSubject<T> extends BehaviorSubject<T | undefined> {
  constructor(
    private api: ApiService,
    private request: (api: ApiService) => Promise<AxiosResponse<T>>,
  ) {
    super(undefined);
  }

  async load() {
    try {
      const res = await this.request(this.api);
      this.next(res.data);
    } catch (err) {
      if (this.api.isApiError(err)) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          this.next(undefined);
          return;
        }
        throw err;
      }
    }
  }
}
