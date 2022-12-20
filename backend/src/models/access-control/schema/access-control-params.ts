import { UserToken } from "src/models/auth/schema/user-token";

export interface AccessControlPermissionParams<D = any> {
  doc: D;
  user?: UserToken;
}

export interface AccessControlFilterParams<D = any> {
  user?: UserToken;
}
