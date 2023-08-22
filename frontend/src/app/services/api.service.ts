import { Injectable } from "@angular/core";
import axios, { AxiosError, AxiosResponse } from "axios";
import { BehaviorSubject } from "rxjs";
import { environment } from "src/environments/environment";
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

@Injectable({
  providedIn: "root",
})
export class ApiService {
  http = axios.create({ withCredentials: true });

  readonly albums = new PhotoGalleryApi(undefined, environment.apiRoot, this.http);
  readonly events = new EventsApi(undefined, environment.apiRoot, this.http);
  readonly members = new MembersApi(undefined, environment.apiRoot, this.http);
  readonly account = new AccountApi(undefined, environment.apiRoot, this.http);
  readonly users = new UsersApi(undefined, environment.apiRoot, this.http);
  readonly statistics = new StatisticsApi(undefined, environment.apiRoot, this.http);
  readonly api = new APIApi(undefined, environment.apiRoot, this.http);

  endpoints = new BehaviorSubject<ApiEndpoints | null>(null);

  info?: RootResponseWithLinks;

  readonly cache = {
    groups: new CachedSubject<GroupResponseWithLinks[]>(this, (api) => api.members.listGroups()),
  };

  constructor() {}

  async reloadApi() {
    this.info = await this.api.getApiInfo().then((res) => res.data);
    this.endpoints.next(this.info._links);
  }

  isApiError(err: unknown): err is ApiError {
    return axios.isAxiosError(err);
  }
}

class CachedSubject<T> extends BehaviorSubject<T | undefined> {
  constructor(private api: ApiService, private request: (api: ApiService) => Promise<AxiosResponse<T>>) {
    super(undefined);
    this.load();
  }

  async load() {
    const res = await this.request(this.api);
    this.next(res.data);
  }
}
