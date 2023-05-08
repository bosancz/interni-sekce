import { ApiProperty, ApiPropertyOptional, PickType } from "@nestjs/swagger";
import { AcLink, AcLinksObject } from "src/access-control/access-control-lib/schema/ac-link";
import { EventResponse } from "src/api/events/dto/event.dto";
import { AlbumStatus } from "src/models/albums/entities/album.entity";
import { Event } from "src/models/events/entities/event.entity";
import { ResponseData } from "src/openapi";
import { AlbumsController } from "../controllers/albums.controller";
import { PhotoResponse } from "./photo.dto";

type LinkNames = ExtractExisting<
  keyof AlbumsController,
  "deleteAlbum" | "getAlbum" | "getAlbumPhotos" | "publishAlbum" | "unpublishAlbum" | "updateAlbum"
>;

class AlbumResponseLinks implements AcLinksObject<LinkNames> {
  @ApiProperty() deleteAlbum!: AcLink;
  @ApiProperty() getAlbum!: AcLink;
  @ApiProperty() getAlbumPhotos!: AcLink;
  @ApiProperty() publishAlbum!: AcLink;
  @ApiProperty() unpublishAlbum!: AcLink;
  @ApiProperty() updateAlbum!: AcLink;
}

export class AlbumResponse {
  @ApiProperty() id!: number;
  @ApiProperty() status!: AlbumStatus;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: "string" }) description!: string | null;
  @ApiPropertyOptional({ type: "string" }) datePublished!: Date | string | null;
  @ApiPropertyOptional({ type: "string" }) dateFrom!: string | null;
  @ApiPropertyOptional({ type: "string" }) dateTill!: string | null;
  @ApiPropertyOptional({ type: "number" }) eventId!: number | null;
  @ApiPropertyOptional({ type: EventResponse }) event?: Event | undefined;

  @ApiPropertyOptional({ type: PhotoResponse, isArray: true }) photos?: ResponseData<PhotoResponse>[] | undefined;

  @ApiProperty() _links!: AlbumResponseLinks;
}

export class AlbumsListResponse extends PickType(AlbumResponse, [
  "id",
  "name",
  "status",
  "dateFrom",
  "dateTill",
  "_links",
]) {}

export class AlbumCreateBody {
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiPropertyOptional() datePublished?: string | null;
  @ApiPropertyOptional() dateFrom?: string | null;
  @ApiPropertyOptional() dateTill?: string | null;
}

export class AlbumUpdateBody extends AlbumCreateBody {
  @ApiPropertyOptional() eventId?: number | null;
}
