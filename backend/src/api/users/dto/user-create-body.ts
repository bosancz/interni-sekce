import { ApiPropertyOptional } from "@nestjs/swagger";
import { UserSavedRoles } from "src/models/users/schema/user-roles";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UserCreateBody {
	@ApiPropertyOptional() @IsString() @IsOptional() memberId?: number;
	@ApiPropertyOptional() @IsString() @IsOptional() login?: string;
	@ApiPropertyOptional() @IsString() @IsOptional() email?: string;
	@ApiPropertyOptional({ enum: UserSavedRoles, enumName: "UserSavedRolesEnum", isArray: true })
	@IsEnum(UserSavedRoles)
	@IsOptional()
	roles?: UserSavedRoles[];
}
