import { Injectable } from "@angular/core";
import axios from "axios";
import { environment } from "src/environments/environment";
import { AccountApi, EventsApi, MembersApi, PhotoGalleryApi, UsersApi } from "../api";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  root = environment.apiRoot;

  http = axios.create({ baseURL: environment.apiRoot, withCredentials: true });

  readonly albums = new PhotoGalleryApi(undefined, environment.apiRoot, this.http);
  readonly events = new EventsApi(undefined, environment.apiRoot, this.http);
  readonly members = new MembersApi(undefined, environment.apiRoot, this.http);
  readonly account = new AccountApi(undefined, environment.apiRoot, this.http);
  readonly users = new UsersApi(undefined, environment.apiRoot, this.http);

  constructor() {}
}
