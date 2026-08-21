import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString } from "class-validator";
import { WithLinks } from "src/access-control/access-control-lib";
import { UserResponse } from "src/api/users/dto/user.dto";
import { Album } from "src/models/albums/entities/album.entity";
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
