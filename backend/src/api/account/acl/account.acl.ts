import { Permission } from "src/access-control/schema/route-acl";
import { UserResponse } from "src/api/users/dto/user.dto";
import { User } from "src/models/users/entities/user.entity";
import { AccountResponse } from "../dto/account.dto";

export const AccountReadPermission = new Permission<User>({
	linkTo: AccountResponse,
	contains: UserResponse,

	allowed: {
		uzivatel: true,
		admin: true,
		verejnost: true,
	},
});
