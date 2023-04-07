import { Injectable } from "@angular/core";
import axios from "axios";
import { environment } from "src/environments/environment";
import { EventsApi, MembersApi, PhotoGalleryApi } from "../api";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  root = environment.apiRoot;

  http = axios.create({ baseURL: environment.apiRoot, withCredentials: true });

  readonly albums = new PhotoGalleryApi(undefined, environment.apiRoot, this.http);
  readonly events = new EventsApi(undefined, environment.apiRoot, this.http);
  readonly members = new MembersApi(undefined, environment.apiRoot, this.http);

  constructor() {}
}
