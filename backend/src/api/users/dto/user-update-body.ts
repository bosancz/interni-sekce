import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { User, UserRoles } from "src/models/users/entities/user.entity";

export class UserUpdateBody implements Partial<User> {
	@ApiPropertyOptional({ type: Number, nullable: true })
	@IsNumber()
	@IsOptional()
	memberId?: number | null;
	@ApiPropertyOptional() @IsString() @IsOptional() login?: string;
	@ApiPropertyOptional() @IsString() @IsOptional() email?: string;

	@ApiPropertyOptional({ enum: UserRoles, isArray: true })
	@IsEnum(UserRoles, { each: true })
	@IsOptional()
	roles?: UserRoles[];
}
