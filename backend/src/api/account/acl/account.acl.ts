import { Permission } from "src/access-control/schema/route-acl";
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
