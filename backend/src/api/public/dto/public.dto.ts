import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class PublicProgramQuery {
	@IsOptional() @Type(() => Number) @IsInt() limit?: number;
	@IsOptional() @IsDateString() dateFrom?: string;
	@IsOptional() @IsDateString() dateTill?: string;
}

export class PublicGalleryQuery {
	@IsOptional() @Type(() => Number) @IsInt() limit?: number;
	@IsOptional() @IsString() sort?: string;
}
