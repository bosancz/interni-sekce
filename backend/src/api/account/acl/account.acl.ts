import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { UserResponse } from "src/api/users/dto/user.dto";
import { User } from "src/models/users/entities/user.entity";

export const AccountReadPermission = new Permission<User>({
	contains: UserResponse,

	allowed: {
		uzivatel: true,
		verejnost: true,
	},
});

export const AccountSettingsReadPermission = new Permission<void>({
	allowed: {
		uzivatel: true,
	},
});

export const AccountSettingsUpdatePermission = new Permission<void>({
	allowed: {
		uzivatel: true,
	},
});

export const AccountBadgesReadPermission = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		uzivatel: true,
	},
});

export const AccountBadgesSeenPermission = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		uzivatel: true,
	},
});
