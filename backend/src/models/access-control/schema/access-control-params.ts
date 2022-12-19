import { UserToken } from "./user-token";

export interface AccessControlPermissionParams<D = any> {
  doc: D;
  token: UserToken;
}

export interface AccessControlFilterParams<D = any> {
  token: UserToken;
}
