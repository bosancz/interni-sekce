import { RouteACL } from "src/access-control/schema/route-acl";
import { User } from "src/models/users/entities/user.entity";
import { UserResponse } from "../dto/user.dto";

export const UsersListRoute = new RouteACL<undefined, UserResponse[]>({
  permissions: {
    vedouci: true,
    admin: true,
  },
  contains: { array: { entity: UserResponse } },
});

export const UserCreateRoute = new RouteACL<undefined, UserResponse>({
  permissions: {
    admin: true,
  },
  contains: { entity: UserResponse },
});

export const UserReadRoute = new RouteACL<User>({
  entity: UserResponse,

  permissions: {
    vedouci: true,
  },
});

export const UserEditRoute = new RouteACL<User>({
  entity: UserResponse,

  permissions: {
    admin: true,
  },
});

export const UserDeleteRoute = new RouteACL<User>({
  entity: UserResponse,

  permissions: {
    admin: true,
  },
});

export const UserSetPassword = new RouteACL<User>({
  entity: UserResponse,

  permissions: {
    admin: true,
    uzivatel: ({ doc, req }) => doc.id === req.user?.userId,
  },
});

export const UserImpersonateRoute = new RouteACL<User>({
  entity: UserResponse,

  permissions: {
    admin: true,
  },
});
