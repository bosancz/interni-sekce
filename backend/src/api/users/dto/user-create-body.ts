import { ApiPropertyOptional } from "@nestjs/swagger";
import { UserSavedRoles } from "src/models/users/schema/user-roles";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { Trim } from "src/helpers/validation";

export class UserCreateBody {
	@ApiPropertyOptional() @IsString() @IsOptional() memberId?: number;
	@ApiPropertyOptional() @Trim() @IsString() @IsOptional() login?: string;
	@ApiPropertyOptional() @Trim() @IsString() @IsOptional() email?: string;
	@ApiPropertyOptional({ enum: UserSavedRoles, enumName: "UserSavedRolesEnum", isArray: true })
	@IsEnum(UserSavedRoles)
	@IsOptional()
	roles?: UserSavedRoles[];
}
