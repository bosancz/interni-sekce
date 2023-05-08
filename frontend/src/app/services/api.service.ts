import { Injectable } from "@angular/core";
import axios from "axios";
import { BehaviorSubject } from "rxjs";
import { environment } from "src/environments/environment";
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

  constructor() {
  }

  async reloadEndpoints() {
    const endpoints = await this.api.getApiInfo().then((res) => res.data._links);
    this.endpoints.next(endpoints);
  }
}
