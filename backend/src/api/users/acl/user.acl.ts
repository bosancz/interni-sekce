import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { User } from "src/models/users/entities/user.entity";
import { UserResponse } from "../dto/user.dto";

export const UsersListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: UserResponse,

	allowed: {
		vedouci: true,
		admin: true,
	},
});

export const UserCreatePermission = new Permission<void>({
	linkTo: RootResponse,
	contains: UserResponse,

	allowed: {
		admin: true,
	},
});

export const UserReadPermission = new Permission<User>({
	linkTo: UserResponse,
	contains: UserResponse,

	allowed: {
		vedouci: true,
	},
});

export const UserEditPermission = new Permission<User>({
	linkTo: UserResponse,

	allowed: {
		admin: true,
	},
});

export const UserDeletePermission = new Permission<User>({
	linkTo: UserResponse,

	allowed: {
		admin: true,
	},
});

export const UserSetPassword = new Permission<User>({
	linkTo: UserResponse,

	allowed: {
		admin: true,
		uzivatel: ({ doc, req }) => doc.id === req.user?.userId,
	},
});

export const UserImpersonatePermission = new Permission<User>({
	linkTo: UserResponse,

	allowed: {
		admin: true,
	},
});
