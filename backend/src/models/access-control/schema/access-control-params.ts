import { UserToken } from "src/models/auth/schema/user-token";

export interface AccessControlPermissionParams<D = any> {
  doc: D;
  token: UserToken;
}

export interface AccessControlFilterParams<D = any> {
  token: UserToken;
}
