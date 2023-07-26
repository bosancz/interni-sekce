import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AcEntity, WithLinks } from "src/access-control/access-control-lib";
import { EventResponse } from "src/api/events/dto/event.dto";
import { AlbumStatus } from "src/models/albums/entities/album.entity";
import { Event } from "src/models/events/entities/event.entity";
import { PhotoResponse } from "./photo.dto";

export class AlbumResponse {
  @ApiProperty() id!: number;
  @ApiProperty() status!: AlbumStatus;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ type: "string" }) description!: string | null;
  @ApiPropertyOptional({ type: "string" }) datePublished!: Date | string | null;
  @ApiPropertyOptional({ type: "string" }) dateFrom!: string | null;
  @ApiPropertyOptional({ type: "string" }) dateTill!: string | null;
  @ApiPropertyOptional({ type: "number" }) eventId!: number | null;
  @ApiPropertyOptional({ type: WithLinks(EventResponse) }) event?: Event | undefined;

  @AcEntity(PhotoResponse)
  @ApiPropertyOptional({ type: WithLinks(() => PhotoResponse), isArray: true })
  photos?: PhotoResponse[];
}

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
