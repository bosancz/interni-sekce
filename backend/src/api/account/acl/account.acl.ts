import { RouteACL } from "src/access-control/schema/route-acl";
import { UserResponse } from "src/api/users/dto/user.dto";
import { User } from "src/models/users/entities/user.entity";
import { AccountResponse } from "../dto/account.dto";

export const AccountReadRoute = new RouteACL<User>({
  linkTo: AccountResponse,
  contains: UserResponse,

  permissions: {
    uzivatel: true,
    admin: true,
    verejnost: true,
  },
});
