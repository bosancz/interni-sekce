import { AcPermissions } from "src/access-control/access-control-lib/schema/ac-route-acl";
import { Roles } from "src/access-control/schema/roles";
import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";

export const loginPermissions: AcPermissions<undefined, Roles> = {
  verejnost: true,
};

export const LoginCredentialsRoute = new RouteACL({
  linkEntity: RootResponse,
  permissions: loginPermissions,
});

export const LoginGoogleRoute = new RouteACL({
  linkEntity: RootResponse,
  permissions: loginPermissions,
});

export const LoginLinkRoute = new RouteACL({
  linkEntity: RootResponse,
  permissions: loginPermissions,
});

export const LoginSendLinkRoute = new RouteACL({
  linkEntity: RootResponse,
  inheritPermissions: LoginLinkRoute,
});
