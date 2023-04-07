import { AcPermissions } from "src/access-control/access-control-lib/schema/ac-route-acl";
import { Roles } from "src/access-control/schema/roles";
import { RouteACL } from "src/access-control/schema/route-acl";

// TODO: set permissions for everybody
export const loginPermissions: AcPermissions<undefined, Roles> = {
  verejnost: true,
};

export const LoginCredentialsRoute = new RouteACL({
  permissions: loginPermissions,
});

export const LoginGoogleRoute = new RouteACL({
  permissions: loginPermissions,
});

export const LoginLinkRoute = new RouteACL({
  permissions: loginPermissions,
});

export const LoginSendLinkRoute = new RouteACL({
  inheritPermissions: LoginLinkRoute,
});
