import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { User } from "src/models/users/entities/user.entity";
import { UserResponse } from "../dto/user.dto";

export const UsersListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: UserResponse,

	allowed: {
		revizor: true,
	},
});

export const UserCreatePermission = new Permission<void>({
	linkTo: RootResponse,
	contains: UserResponse,
});

export const UserReadPermission = new Permission<User>({
	linkTo: UserResponse,
	contains: UserResponse,
	params: { userId: "id" },

	allowed: {
		revizor: true,
		vedouci: ({ doc, req }) => doc.id === req.user?.userId,
	},
});

export const UserEditPermission = new Permission<User>({
	linkTo: UserResponse,
	params: { userId: "id" },
});

export const UserDeletePermission = new Permission<User>({
	linkTo: UserResponse,
	params: { userId: "id" },
});

export const UserSetPassword = new Permission<User>({
	linkTo: UserResponse,
	params: { userId: "id" },

	allowed: {
		uzivatel: ({ doc, req }) => doc.id === req.user?.userId,
	},
});

export const UserImpersonatePermission = new Permission<User>({
	linkTo: UserResponse,
	params: { userId: "id" },
});
