import { RouteACL } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { User } from "src/models/users/entities/user.entity";
import { UserResponse } from "../dto/user.dto";

export const UsersListRoute = new RouteACL({
  linkTo: RootResponse,
  contains: UserResponse,

  permissions: {
    vedouci: true,
    admin: true,
  },
});

export const UserCreateRoute = new RouteACL({
  linkTo: RootResponse,
  contains: UserResponse,

  permissions: {
    admin: true,
  },
});

export const UserReadRoute = new RouteACL<User>({
  linkTo: UserResponse,
  contains: UserResponse,

  permissions: {
    vedouci: true,
  },
});

export const UserEditRoute = new RouteACL<User>({
  linkTo: UserResponse,

  permissions: {
    admin: true,
  },
});

export const UserDeleteRoute = new RouteACL<User>({
  linkTo: UserResponse,

  permissions: {
    admin: true,
  },
});

export const UserSetPassword = new RouteACL<User>({
  linkTo: UserResponse,

  permissions: {
    admin: true,
    uzivatel: ({ doc, req }) => doc.id === req.user?.userId,
  },
});

export const UserImpersonateRoute = new RouteACL<User>({
  linkTo: UserResponse,

  permissions: {
    admin: true,
  },
});
