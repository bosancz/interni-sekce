import { RouteACL } from "src/access-control/schema/route-acl";
import { User } from "src/models/users/entities/user.entity";
import { AccountResponse } from "../dto/account.dto";

export const AccountReadRoute = new RouteACL<User>({
  entity: AccountResponse,

  permissions: {
    uzivatel: true,
  },
});