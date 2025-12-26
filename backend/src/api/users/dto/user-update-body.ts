import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { User, UserRoles } from "src/models/users/entities/user.entity";

export class UserUpdateBody implements Partial<User> {
	@ApiPropertyOptional() @IsString() @IsOptional() memberId?: number;
	@ApiPropertyOptional() @IsString() @IsOptional() login?: string;
	@ApiPropertyOptional() @IsString() @IsOptional() email?: string;

	@ApiPropertyOptional({ enum: UserRoles, isArray: true })
	@IsEnum(UserRoles, { each: true })
	@IsOptional()
	roles?: UserRoles[];
}
