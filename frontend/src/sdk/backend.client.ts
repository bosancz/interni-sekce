import { Injectable } from "@angular/core";
import * as BackendApiTypes from "./backend.types";
import { paths } from "./backend.types";
import { ApiClient } from "./client";

export type { BackendApiTypes };

@Injectable()
export class BackendApi extends ApiClient<paths> {}
