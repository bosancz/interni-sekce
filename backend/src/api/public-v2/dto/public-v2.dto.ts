import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from "class-validator";
import { StaticConfig } from "src/config";

export class PublicV2ProgramQuery {
	@IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
	@IsOptional() @IsDateString() dateFrom?: string;
	@IsOptional() @IsDateString() dateTill?: string;
}

export class PublicV2GalleryQuery {
	@IsOptional() @IsIn(["dateFrom", "publishedAt"]) sort?: "dateFrom" | "publishedAt";
	@IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
	@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	@Max(StaticConfig.photos.publicPreviewCount)
	previewPhotos?: number;
}

export class PublicV2RecentAlbumsQuery {
	@IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
}
