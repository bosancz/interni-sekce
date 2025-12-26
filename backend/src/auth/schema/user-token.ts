import { IsEnum, IsNumber, IsOptional } from "class-validator";
import { JwtPayload } from "jsonwebtoken";
import { UserRoles } from "src/models/users/entities/user.entity";

export class UserData {
	@IsNumber()
	userId!: number;

	@IsNumber()
	@IsOptional()
	memberId?: number;

	@IsEnum(UserRoles, { each: true })
	roles!: UserRoles[];
}

export type TokenData = UserData & JwtPayload;
