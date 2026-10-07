import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
	ArrayMaxSize,
	ArrayMinSize,
	IsArray,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
} from "class-validator";

const trimPrompts = ({ value }: { value: unknown }) =>
	Array.isArray(value)
		? value
				.filter((item): item is string => typeof item === "string")
				.map((item) => item.trim())
				.filter(Boolean)
		: value;

export class PhotoContentPhotosStatsResponse {
	@ApiProperty() total!: number;
	@ApiProperty() processed!: number;
	@ApiProperty() pending!: number;
	@ApiProperty() failed!: number;
	@ApiPropertyOptional({ type: "string", nullable: true }) lastEmbeddedAt!: Date | string | null;
}

export class PhotoContentQueueResponse {
	@ApiProperty() waiting!: number;
	@ApiProperty() active!: number;
	@ApiProperty() delayed!: number;
	@ApiProperty() failed!: number;
	@ApiPropertyOptional({ type: "string", nullable: true }) nextBatchAt!: Date | string | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) nextStopAt!: Date | string | null;
}

export class PhotoContentSummaryResponse {
	@ApiProperty() enabled!: boolean;
	@ApiProperty() batchSize!: number;
	@ApiProperty({ type: PhotoContentPhotosStatsResponse }) photos!: PhotoContentPhotosStatsResponse;
	@ApiPropertyOptional({ type: PhotoContentQueueResponse, nullable: true }) queue!: PhotoContentQueueResponse | null;
}

export class PhotoContentBatchBody {
	@ApiPropertyOptional({ type: "integer" }) @IsInt() @Min(1) @Max(50000) @IsOptional() limit?: number;
}

export class PhotoContentBatchResponse {
	@ApiProperty() queued!: number;
}

export class PhotoContentSearchQuery {
	@ApiProperty() @IsString() @MinLength(1) @MaxLength(200) q!: string;
	@ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) @IsOptional() limit?: number;
	@ApiPropertyOptional() @Type(() => Number) @IsNumber() @Min(-1) @Max(1) @IsOptional() minScore?: number;
}

export class PhotoContentSearchHitResponse {
	@ApiProperty() photoId!: number;
	@ApiProperty() photoName!: string;
	@ApiPropertyOptional({ type: "string", nullable: true }) photoTitle!: string | null;
	@ApiProperty() albumId!: number;
	@ApiPropertyOptional({ type: "string", nullable: true }) albumName!: string | null;
	@ApiProperty() score!: number;
}

export class PhotoCategoryResponse {
	@ApiProperty() id!: number;
	@ApiProperty() name!: string;
	@ApiProperty({ type: "string", isArray: true }) prompts!: string[];
	@ApiProperty() threshold!: number;
	@ApiPropertyOptional({ type: "integer", nullable: true }) order!: number | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) model!: string | null;
	@ApiPropertyOptional({ type: "integer", nullable: true }) photosCount?: number | null;
}

export class PhotoCategoryCreateBody {
	@ApiProperty() @IsString() @MinLength(1) @MaxLength(60) name!: string;

	@ApiProperty({ type: "string", isArray: true })
	@Transform(trimPrompts)
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(20)
	@IsString({ each: true })
	@MaxLength(200, { each: true })
	prompts!: string[];

	@ApiPropertyOptional() @IsNumber() @Min(-1) @Max(1) @IsOptional() threshold?: number;
	@ApiPropertyOptional({ type: "integer", nullable: true }) @IsInt() @IsOptional() order?: number | null;
}

export class PhotoCategoryUpdateBody {
	@ApiPropertyOptional() @IsString() @MinLength(1) @MaxLength(60) @IsOptional() name?: string;

	@ApiPropertyOptional({ type: "string", isArray: true })
	@Transform(trimPrompts)
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(20)
	@IsString({ each: true })
	@MaxLength(200, { each: true })
	@IsOptional()
	prompts?: string[];

	@ApiPropertyOptional() @IsNumber() @Min(-1) @Max(1) @IsOptional() threshold?: number;
	@ApiPropertyOptional({ type: "integer", nullable: true }) @IsInt() @IsOptional() order?: number | null;
}

export class PhotoCategoryPreviewBody {
	@ApiProperty({ type: "string", isArray: true })
	@Transform(trimPrompts)
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(20)
	@IsString({ each: true })
	@MaxLength(200, { each: true })
	prompts!: string[];

	@ApiPropertyOptional() @IsInt() @Min(1) @Max(500) @IsOptional() limit?: number;
}

export class PhotoCategoryPhotosQuery {
	@ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) @IsOptional() limit?: number;
	@ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(0) @IsOptional() offset?: number;
}
