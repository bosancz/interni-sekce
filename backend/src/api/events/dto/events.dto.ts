import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { PaginationQuery } from "src/api/helpers/dto";
import { EnsureArray, EnsureBoolean } from "src/helpers/validation";

export class ListEventsQuery extends PaginationQuery {
	@ApiPropertyOptional({ type: Number, isArray: true })
	@EnsureArray({ split: "," })
	@Type(() => Number)
	@IsNumber({}, { each: true })
	@IsOptional()
	year?: number[];

	@ApiPropertyOptional({ type: String, isArray: true })
	@EnsureArray({ split: "," })
	@IsString({ each: true })
	@IsOptional()
	status?: string[];

	@ApiPropertyOptional() @IsString() @IsOptional() search?: string;
	@ApiPropertyOptional() @EnsureBoolean() @IsBoolean() @IsOptional() my?: boolean;
	@ApiPropertyOptional() @EnsureBoolean() @IsBoolean() @IsOptional() noleader?: boolean;
	@ApiPropertyOptional() @EnsureBoolean() @IsBoolean() @IsOptional() deleted?: boolean;
}
