import { IsEnum, IsNumber } from "class-validator";
import { UserRoles } from "src/models/users/entities/user.entity";

export class UserData {
  @IsNumber()
  userId!: number;

  @IsEnum(UserRoles, { each: true })
  roles!: UserRoles[];
}
