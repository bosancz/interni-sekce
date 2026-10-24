import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { UserRoles } from "src/models/users/schema/user-roles";
import { PaginationQuery } from "src/api/helpers/dto";
import { EnsureArray } from "src/helpers/validation";

export class ListUsersQuery extends PaginationQuery {
	@ApiPropertyOptional() @IsString() @IsOptional() search!: string;
	@ApiPropertyOptional({ enum: UserRoles, enumName: "UserRolesEnum", isArray: true })
	@EnsureArray()
	@IsEnum(UserRoles, { each: true })
	@IsOptional()
	roles?: UserRoles[];
}
