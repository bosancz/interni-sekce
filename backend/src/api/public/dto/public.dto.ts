import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, IsString, Min } from "class-validator";

export class PublicProgramQuery {
	@IsOptional() @Type(() => Number) @IsInt() limit?: number;
	@IsOptional() @IsDateString() dateFrom?: string;
	@IsOptional() @IsDateString() dateTill?: string;
}

export class PublicReportsQuery {
	@IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
	@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
}

export class PublicGalleryQuery {
	@IsOptional() @Type(() => Number) @IsInt() limit?: number;
	@IsOptional() @IsString() sort?: string;
}
