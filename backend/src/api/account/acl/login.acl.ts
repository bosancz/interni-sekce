import { AcAllowed } from "src/access-control/access-control-lib/schema/ac-route-acl";
import { Roles } from "src/access-control/schema/roles";
import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";

export const allowed: AcAllowed<void, Roles> = {
	verejnost: true,
};

export const LoginCredentialsPermission = new Permission<void>({
	linkTo: RootResponse,
	allowed,
});

export const LoginGooglePermission = new Permission<void>({
	linkTo: RootResponse,
	allowed,
});

export const LoginLinkPermission = new Permission<void>({
	linkTo: RootResponse,
	allowed,
});

export const LoginSendLinkPermission = new Permission<void>({
	linkTo: RootResponse,
	inherit: LoginLinkPermission,
});
