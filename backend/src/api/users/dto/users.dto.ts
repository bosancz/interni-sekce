import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationQuery } from "src/api/helpers/dto";
import { EnsureArray } from "src/helpers/validation";

export class ListUsersQuery extends PaginationQuery {
	@ApiPropertyOptional() @IsString() @IsOptional() search!: string;
	@ApiPropertyOptional() @EnsureArray() @IsString({ each: true }) @IsOptional() roles!: string[];
}
