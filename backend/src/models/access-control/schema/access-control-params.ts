import { UserToken } from "./user-token";

export interface AccessControlRouteParams<D = any> {
  token: UserToken;
}

export interface AccessControlDocsParams<D = any> {
  doc: D;
  token: UserToken;
}
