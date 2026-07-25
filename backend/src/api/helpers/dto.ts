import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Matches } from "class-validator";

export class PaginationQuery {
	@ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() limit?: number;
	@ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() offset?: number;

	/**
	 * Column key(s) to order by, comma-separated in priority order (e.g. `"group,role"`).
	 * Each endpoint whitelists which keys are honoured.
	 */
	@ApiPropertyOptional({ example: "group,role" }) @IsString() @IsOptional() sort?: string;

	/**
	 * Order direction(s), comma-separated to match each `sort` key (e.g. `"ASC,DESC"`);
	 * missing entries default to ASC. Defaults per endpoint when omitted.
	 */
	@ApiPropertyOptional({ example: "ASC,DESC" })
	@Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
	@Matches(/^(ASC|DESC)(,(ASC|DESC)){0,3}$/)
	@IsOptional()
	order?: string;
}
