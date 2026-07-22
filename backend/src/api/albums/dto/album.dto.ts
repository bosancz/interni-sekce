import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { AcEntity, WithLinks } from "src/access-control/access-control-lib";
import { EventResponse } from "src/api/events/dto/event.dto";
import { PaginationQuery } from "src/api/helpers/dto";
import { EnsureArray } from "src/helpers/validation";
import { AlbumStatus } from "src/models/albums/entities/album.entity";
import { Event } from "src/models/events/entities/event.entity";
import { PhotoResponse } from "./photo.dto";

export class AlbumResponse {
	@ApiProperty() id!: number;
	@ApiProperty({ enum: AlbumStatus }) status!: AlbumStatus;
	@ApiProperty() name!: string;
	@ApiPropertyOptional({ type: "string" }) description!: string | null;
	@ApiPropertyOptional({ type: "string" }) datePublished!: Date | string | null;
	@ApiPropertyOptional({ type: "string" }) dateFrom!: string | null;
	@ApiPropertyOptional({ type: "string" }) dateTill!: string | null;
	@ApiPropertyOptional({ type: "number" }) eventId!: number | null;

	@AcEntity(EventResponse)
	@ApiPropertyOptional({ type: WithLinks(EventResponse) })
	event?: Event | undefined;

	@AcEntity(PhotoResponse)
	@ApiPropertyOptional({ type: WithLinks(() => PhotoResponse), isArray: true })
	photos?: PhotoResponse[];
}

export class AlbumListQuery extends PaginationQuery {
	@ApiPropertyOptional() @IsString() @IsOptional() search?: string;

	@ApiPropertyOptional({ enum: AlbumStatus, isArray: true })
	@EnsureArray({ split: "," })
	@IsEnum(AlbumStatus, { each: true })
	@IsOptional()
	status?: AlbumStatus[];

	@ApiPropertyOptional({ type: Number, isArray: true })
	@EnsureArray({ split: "," })
	@Type(() => Number)
	@IsNumber({}, { each: true })
	@IsOptional()
	year?: number[];
}

export class AlbumCreateBody {
	@ApiPropertyOptional() @IsOptional() @IsString() name?: string;
	@ApiPropertyOptional() @IsOptional() @IsString() description?: string | null;
	@ApiPropertyOptional() @IsOptional() @IsString() datePublished?: string | null;
	@ApiPropertyOptional() @IsOptional() @IsString() dateFrom?: string | null;
	@ApiPropertyOptional() @IsOptional() @IsString() dateTill?: string | null;
}

export class AlbumUpdateBody extends AlbumCreateBody {
	@ApiPropertyOptional() @IsOptional() @IsNumber() eventId?: number | null;
}
