import { IsEnum, IsNumber } from "class-validator";
import { JwtPayload } from "jsonwebtoken";
import { UserRoles } from "src/models/users/entities/user.entity";

export class UserTokenData {
  @IsNumber()
  userId!: number;

  @IsEnum(UserRoles, { each: true })
  roles!: UserRoles[];
}

export type UserToken = UserTokenData & JwtPayload;
