import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional, Min } from "class-validator";

export class PublicV2ProgramQuery {
	@IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
	@IsOptional() @IsDateString() dateFrom?: string;
	@IsOptional() @IsDateString() dateTill?: string;
}

export class PublicV2JournalQuery {
	@IsOptional() @IsIn(["dateFrom", "publishedAt"]) sort?: "dateFrom" | "publishedAt";
	@IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
	@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
}

export class PublicV2RecentAlbumsQuery {
	@IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}
