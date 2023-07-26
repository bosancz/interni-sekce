import { Injectable } from "@angular/core";
import axios, { AxiosError } from "axios";
import { BehaviorSubject } from "rxjs";
import { environment } from "src/environments/environment";
import {
  APIApi,
  AccountApi,
  EventsApi,
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
  http = axios.create({ baseURL: environment.apiRoot, withCredentials: true });

  readonly albums = new PhotoGalleryApi(undefined, environment.apiRoot, this.http);
  readonly events = new EventsApi(undefined, environment.apiRoot, this.http);
  readonly members = new MembersApi(undefined, environment.apiRoot, this.http);
  readonly account = new AccountApi(undefined, environment.apiRoot, this.http);
  readonly users = new UsersApi(undefined, environment.apiRoot, this.http);
  readonly statistics = new StatisticsApi(undefined, environment.apiRoot, this.http);
  readonly api = new APIApi(undefined, environment.apiRoot, this.http);

  endpoints = new BehaviorSubject<ApiEndpoints | null>(null);

  info?: RootResponseWithLinks;

  constructor() {}

  async reloadApi() {
    this.info = await this.api.getApiInfo().then((res) => res.data);
    this.endpoints.next(this.info._links);
  }

  isApiError(err: unknown): err is ApiError {
    return axios.isAxiosError(err);
  }
}
