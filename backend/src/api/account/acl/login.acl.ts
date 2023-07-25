import { AcPermissions } from "src/access-control/access-control-lib";
import { Roles } from "src/access-control/schema/roles";
import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { User } from "src/models/users/entities/user.entity";

export const permissions: AcPermissions<User, Roles> = {
  verejnost: true,
};

export const LoginCredentialsRoute = new RouteACL<User>({
  linkTo: RootResponse,
  permissions,
});

export const LoginGoogleRoute = new RouteACL<User>({
  linkTo: RootResponse,
  permissions,
});

export const LoginLinkRoute = new RouteACL<User>({
  linkTo: RootResponse,
  permissions,
});

export const LoginSendLinkRoute = new RouteACL({
  linkTo: RootResponse,
  inheritPermissions: LoginLinkRoute,
});
