import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";

export class PaginationQuery {
	@ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() limit?: number;
	@ApiPropertyOptional() @Type(() => Number) @IsNumber() @IsOptional() offset?: number;

	/** Column key to order by. Each endpoint whitelists which keys are honoured. */
	@ApiPropertyOptional() @IsString() @IsOptional() sort?: string;

	/** Order direction; defaults per endpoint when omitted. */
	@ApiPropertyOptional({ enum: ["ASC", "DESC"] })
	@Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
	@IsIn(["ASC", "DESC"])
	@IsOptional()
	order?: "ASC" | "DESC";
}
