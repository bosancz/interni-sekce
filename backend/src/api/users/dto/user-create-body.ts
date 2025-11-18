import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { UserRoles } from "src/models/users/entities/user.entity";

export class UserCreateBody {
	@ApiPropertyOptional() @IsString() @IsOptional() memberId?: number;
	@ApiPropertyOptional() @IsString() @IsOptional() login?: string;
	@ApiPropertyOptional() @IsString() @IsOptional() email?: string;
	@ApiPropertyOptional({ enum: UserRoles, isArray: true }) @IsEnum(UserRoles) @IsOptional() roles?: UserRoles[];
}
