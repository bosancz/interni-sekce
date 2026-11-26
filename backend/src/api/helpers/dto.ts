import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Matches } from "class-validator";
import { StaticConfig } from "src/config";

const sortListPattern = (item: string) => new RegExp(`^${item}(,${item}){0,${StaticConfig.sorting.maxKeys - 1}}$`);

export class PaginationQuery {
	@ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() limit?: number;
	@ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() offset?: number;

	@ApiPropertyOptional({ example: "group,role" })
	@IsString()
	@Matches(sortListPattern("[A-Za-z]+"))
	@IsOptional()
	sort?: string;

	@ApiPropertyOptional({ example: "ASC,DESC" })
	@Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
	@IsString()
	@Matches(sortListPattern("(ASC|DESC)"))
	@IsOptional()
	order?: string;
}
