import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from "class-validator";
import { PaginationQuery } from "src/api/helpers/dto";
import { EnsureArray, EnsureBoolean } from "src/helpers/validation";

export class ListEventsQuery extends PaginationQuery {
	@EnsureArray({ split: "," })
	@Type(() => Number)
	@IsNumber({}, { each: true })
	@IsOptional()
	year?: number[];

	@IsDateString() @IsOptional() dateFrom?: string;
	@IsDateString() @IsOptional() dateTill?: string;

	@EnsureArray({ split: "," })
	@IsString({ each: true })
	@IsOptional()
	status?: string[];

	@IsString() @IsOptional() search?: string;
	@EnsureBoolean() @IsBoolean() @IsOptional() my?: boolean;
	@EnsureBoolean() @IsBoolean() @IsOptional() noleader?: boolean;
	@EnsureBoolean() @IsBoolean() @IsOptional() deleted?: boolean;
}
