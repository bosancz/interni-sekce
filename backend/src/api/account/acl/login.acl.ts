import { AcAllowed } from "src/access-control/access-control-lib/schema/ac-route-acl";
import { Roles } from "src/access-control/schema/roles";
import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";

export const allowed: AcAllowed<void, Roles> = {
	verejnost: true,
};

export const LoginCredentialsRoute = new Permission<void>({
	linkTo: RootResponse,
	allowed,
});

export const LoginGoogleRoute = new Permission<void>({
	linkTo: RootResponse,
	allowed,
});

export const LoginLinkRoute = new Permission<void>({
	linkTo: RootResponse,
	allowed,
});

export const LoginSendLinkRoute = new Permission<void>({
	linkTo: RootResponse,
	inherit: LoginLinkRoute,
});
