import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { AcEntity, WithLinks } from "src/access-control/access-control-lib";
import { UserResponse } from "src/api/users/dto/user.dto";
import { Album } from "src/models/albums/entities/album.entity";
import { FaceEmotion } from "src/models/albums/schema/detected-faces";
import { EnsureArray } from "src/helpers/validation";
import { User } from "src/models/users/entities/user.entity";
import { AlbumResponse } from "./album.dto";

export enum PhotoSizes {
	"big" = "big",
	"small" = "small",
	"original" = "original",
}

export class PhotoResponse {
	@ApiProperty() id!: number;

	@ApiProperty() albumId!: number;
	@ApiProperty({ type: "string" }) timestamp!: string | Date;
	@ApiProperty() name!: string;

	@ApiPropertyOptional({ type: "number" }) order!: number | null;
	@ApiProperty({ type: "boolean" }) titlePhoto!: boolean;
	@ApiPropertyOptional({ type: "number" }) width!: number | null;
	@ApiPropertyOptional({ type: "number" }) height!: number | null;
	@ApiPropertyOptional({ type: "number" }) uploadedById!: number | null;
	@ApiPropertyOptional({ type: "string" }) title!: string | null;
	@ApiPropertyOptional({ type: "string" }) caption!: string | null;
	@ApiPropertyOptional({ type: "string", isArray: true }) tags!: string[] | null;
	@ApiPropertyOptional({ type: "string" }) bg!: string | null;

	@ApiPropertyOptional({ type: () => WithLinks(() => AlbumResponse) }) album?: Album | undefined;
	@ApiPropertyOptional({ type: () => WithLinks(UserResponse) }) uploadedBy?: User | null;
}

export class PhotoCreateBody {
	@ApiProperty()
	@Type(() => Number)
	@IsInt()
	albumId!: number;

	@ApiProperty({ type: "string", format: "binary" }) file!: any;
}

export class PhotoUpdateBody {
	@ApiPropertyOptional({ type: "string" }) @IsOptional() @IsString() title?: string | null;
	@ApiPropertyOptional({ type: "string" }) @IsOptional() @IsString() caption?: string | null;
	@ApiPropertyOptional({ type: "string", isArray: true }) @IsOptional() @IsString({ each: true }) tags?:
		| string[]
		| null;
}

export class AlbumPhotosOrderBody {
	@ApiProperty({ type: "number", isArray: true })
	@IsInt({ each: true })
	photoIds!: number[];
}

export class AlbumTitlePhotoBody {
	@ApiPropertyOptional({ type: "number", nullable: true })
	@IsOptional()
	@IsInt()
	photoId!: number | null;
}

export class PhotoDailyLeader {
	@ApiProperty() id!: number;
	@ApiProperty() nickname!: string;
}

export class PhotoDailyResponse {
	@AcEntity(PhotoResponse)
	@ApiPropertyOptional({ type: WithLinks(PhotoResponse), nullable: true })
	photo!: PhotoResponse | null;

	@ApiProperty({ type: PhotoDailyLeader, isArray: true })
	leaders!: PhotoDailyLeader[];
}

export class PhotoCategoryOfPhotoResponse {
	@ApiProperty() categoryId!: number;
	@ApiProperty() name!: string;
	@ApiProperty() score!: number;
}

export class PhotoExifResponse {
	@ApiPropertyOptional({ type: "string", nullable: true }) make!: string | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) model!: string | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) lensModel!: string | null;
	@ApiPropertyOptional({ type: "string", nullable: true }) software!: string | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) fNumber!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) exposureTime!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) iso!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) focalLength!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) focalLength35mm!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) exposureBias!: number | null;
	@ApiPropertyOptional({ type: "boolean", nullable: true }) flash!: boolean | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) latitude!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) longitude!: number | null;
	@ApiPropertyOptional({ type: "number", nullable: true }) altitude!: number | null;
}

export class PhotoBrowseQuery {
	@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) q?: string;

	@ApiPropertyOptional() @IsOptional() @IsDateString() dateFrom?: string;
	@ApiPropertyOptional() @IsOptional() @IsDateString() dateTill?: string;

	@ApiPropertyOptional({ type: Number, isArray: true })
	@EnsureArray({ split: "," })
	@Type(() => Number)
	@IsInt({ each: true })
	@IsOptional()
	categoryIds?: number[];

	@ApiPropertyOptional({ type: Number, isArray: true })
	@EnsureArray({ split: "," })
	@Type(() => Number)
	@IsInt({ each: true })
	@IsOptional()
	memberIds?: number[];

	@ApiPropertyOptional({ enum: FaceEmotion, enumName: "FaceEmotionEnum", isArray: true })
	@EnsureArray({ split: "," })
	@IsEnum(FaceEmotion, { each: true })
	@IsOptional()
	emotions?: FaceEmotion[];

	@ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) @IsOptional() limit?: number;
	@ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(0) @IsOptional() offset?: number;
}
