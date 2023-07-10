import { AcPermissions } from "src/access-control/access-control-lib/schema/ac-route-acl";
import { Roles } from "src/access-control/schema/roles";
import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { User } from "src/models/users/entities/user.entity";

export const loginPermissions: AcPermissions<User, Roles> = {
  uzivatel: true,
};

export const LoginCredentialsRoute = new RouteACL<User>({
  linkEntity: RootResponse,
  permissions: {
    uzivatel: true,
  },
});

export const LoginGoogleRoute = new RouteACL<User>({
  linkEntity: RootResponse,
  permissions: loginPermissions,
});

export const LoginLinkRoute = new RouteACL<User>({
  linkEntity: RootResponse,
  permissions: {
    uzivatel: true,
  },
});

export const LoginSendLinkRoute = new RouteACL({
  linkEntity: RootResponse,
  inheritPermissions: LoginLinkRoute,
});
