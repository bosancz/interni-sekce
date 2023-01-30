import { ApiProperty, ApiPropertyOptional, PickType } from "@nestjs/swagger";
import { AcLink } from "src/access-control/access-control-lib/schema/ac-link";
import { EventResponse } from "src/api/events/dto/event.dto";
import { AlbumStatus } from "src/models/albums/entities/album.entity";
import { Photo } from "src/models/albums/entities/photo.entity";
import { Event } from "src/models/events/entities/event.entity";

export class AlbumLinks {
  @ApiPropertyOptional() "album:read": AcLink;
}

export class AlbumResponse {
  @ApiProperty() id!: number;
  @ApiProperty() status!: AlbumStatus;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: "string" }) description!: string | null;
  @ApiPropertyOptional({ type: "string" }) datePublished!: string | null;
  @ApiPropertyOptional({ type: "string" }) dateFrom!: string | null;
  @ApiPropertyOptional({ type: "string" }) dateTill!: string | null;
  @ApiPropertyOptional({ type: "number" }) eventId!: number | null;
  @ApiPropertyOptional({ type: EventResponse }) event?: Event | undefined;
  @ApiPropertyOptional() photos?: Photo[] | undefined;
  @ApiPropertyOptional() _links?: AlbumLinks;
}

export class AlbumsListResponse extends PickType(AlbumResponse, ["id", "name", "status"]) {}

export class AlbumEditBody {
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiPropertyOptional() datePublished?: string | null;
  @ApiPropertyOptional() dateFrom?: string | null;
  @ApiPropertyOptional() dateTill?: string | null;
  @ApiPropertyOptional() eventId?: number | null;
}
