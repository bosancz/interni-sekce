import { ApiProperty, ApiPropertyOptional, OmitType, PickType } from "@nestjs/swagger";
import { AcLink } from "src/access-control/access-control-lib/schema/ac-link";
import { Album } from "src/models/albums/entities/album.entity";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { EventExpense } from "src/models/events/entities/event-expense.entity";
import { EventGroup } from "src/models/events/entities/event-group.entity";
import { EventStatus } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";

class EventResponseLinks {
  @ApiPropertyOptional() "event:attendees:list"?: AcLink;
}

export class EventResponse {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty() status!: EventStatus;
  @ApiProperty() dateFrom!: string;
  @ApiProperty() dateTill!: string;

  @ApiPropertyOptional({ type: "string" }) statusNote!: string | null;
  @ApiPropertyOptional({ type: "string" }) place!: string | null;
  @ApiPropertyOptional({ type: "string" }) description!: string | null;
  @ApiPropertyOptional({ type: "string" }) timeFrom!: string | null;
  @ApiPropertyOptional({ type: "string" }) timeTill!: string | null;
  @ApiPropertyOptional({ type: "string" }) meetingPlaceStart!: string | null;
  @ApiPropertyOptional({ type: "string" }) meetingPlaceEnd!: string | null;
  @ApiPropertyOptional({ type: "string" }) type!: string | null;
  @ApiPropertyOptional({ type: "number" }) water_km!: number | null;
  @ApiPropertyOptional({ type: "string" }) river!: string | null;
  @ApiPropertyOptional({ type: "string" }) deletedAt?: Date | undefined;

  @ApiPropertyOptional() album?: Album | undefined;
  @ApiPropertyOptional() groups?: EventGroup[] | undefined;
  @ApiPropertyOptional() attendees?: EventAttendee[] | undefined;
  @ApiPropertyOptional() expenses?: EventExpense[] | undefined;
  @ApiPropertyOptional() leaders?: Member[] | undefined;

  @ApiPropertyOptional() _links?: EventResponseLinks;
}

export class EventCreateBody extends PickType(EventResponse, ["name", "description", "dateFrom", "dateTill"]) {}

export class EventUpdateBody extends OmitType(EventResponse, [
  "id",
  "_links",
  "album",
  "groups",
  "attendees",
  "expenses",
  "leaders",
]) {}
