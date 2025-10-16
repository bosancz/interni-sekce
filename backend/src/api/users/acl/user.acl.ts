import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { User } from "src/models/users/entities/user.entity";
import { UserResponse } from "../dto/user.dto";

export const UsersListRoute = new Permission<void>({
	linkTo: RootResponse,
	contains: UserResponse,

	allowed: {
		vedouci: true,
		admin: true,
	},
});

export const UserCreateRoute = new Permission<void>({
	linkTo: RootResponse,
	contains: UserResponse,

	allowed: {
		admin: true,
	},
});

export const UserReadRoute = new Permission<User>({
	linkTo: UserResponse,
	contains: UserResponse,

	allowed: {
		vedouci: true,
	},
});

export const UserEditRoute = new Permission<User>({
	linkTo: UserResponse,

	allowed: {
		admin: true,
	},
});

export const UserDeleteRoute = new Permission<User>({
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

export const UserImpersonateRoute = new Permission<User>({
	linkTo: UserResponse,

	allowed: {
		admin: true,
	},
});
