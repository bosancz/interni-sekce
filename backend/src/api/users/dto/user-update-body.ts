import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { User } from "src/models/users/entities/user.entity";
import { UserSavedRoles } from "src/models/users/schema/user-roles";

export class UserUpdateBody implements Partial<User> {
	@ApiPropertyOptional({ type: Number, nullable: true })
	@IsNumber()
	@IsOptional()
	memberId?: number | null;
	@ApiPropertyOptional() @IsString() @IsOptional() login?: string;
	@ApiPropertyOptional() @IsString() @IsOptional() email?: string;

	@ApiPropertyOptional({ enum: UserSavedRoles, enumName: "UserSavedRolesEnum", isArray: true })
	@IsEnum(UserSavedRoles, { each: true })
	@IsOptional()
	roles?: UserSavedRoles[];
}
