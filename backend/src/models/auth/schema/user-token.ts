import { IsEnum, IsNumber } from "class-validator";
import { Roles } from "src/models/access-control/schema/roles";

export class UserToken {
  @IsNumber()
  userId!: number;

  @IsEnum(Roles)
  role!: Roles;
}
