import { ApiProperty, ApiPropertyOptional, OmitType, PickType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { AcLink, AcLinksObject } from "src/access-control/access-control-lib/schema/ac-link";
import { AlbumResponse } from "src/api/albums/dto/album.dto";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { Album } from "src/models/albums/entities/album.entity";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { EventExpense } from "src/models/events/entities/event-expense.entity";
import { EventGroup } from "src/models/events/entities/event-group.entity";
import { Event, EventStatus } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import { EventsAttendeesController } from "../controllers/events-attendees.controller";
import { EventsController } from "../controllers/events.controller";
import { EventAttendeeResponse } from "./event-attendee.dto";

type LinkNames =
  | ExtractExisting<
      keyof EventsController,
      | "deleteEvent"
      | "rejectEvent"
      | "submitEvent"
      | "getEvent"
      | "updateEvent"
      | "publishEvent"
      | "unpublishEvent"
      | "cancelEvent"
      | "uncancelEvent"
    >
  | ExtractExisting<keyof EventsAttendeesController, "listEventAttendees">;

class EventResponseLinks implements AcLinksObject<LinkNames> {
  @ApiProperty() publishEvent!: AcLink;
  @ApiProperty() unpublishEvent!: AcLink;
  @ApiProperty() cancelEvent!: AcLink;
  @ApiProperty() uncancelEvent!: AcLink;
  @ApiProperty() listEventAttendees!: AcLink;
  @ApiProperty() updateEvent!: AcLink;
  @ApiProperty() getEvent!: AcLink;
  @ApiProperty() deleteEvent!: AcLink;
  @ApiProperty() rejectEvent!: AcLink;
  @ApiProperty() submitEvent!: AcLink;
}

export class EventResponse implements Event {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: EventStatus }) status!: EventStatus;
  @ApiProperty() dateFrom!: string;
  @ApiProperty() dateTill!: string;
  @ApiProperty() leadersEvent!: boolean;

  @ApiPropertyOptional({ type: "string" }) type!: string | null;
  @ApiPropertyOptional({ type: "string" }) statusNote!: string | null;
  @ApiPropertyOptional({ type: "string" }) place!: string | null;
  @ApiPropertyOptional({ type: "string" }) description!: string | null;
  @ApiPropertyOptional({ type: "string" }) timeFrom!: string | null;
  @ApiPropertyOptional({ type: "string" }) timeTill!: string | null;
  @ApiPropertyOptional({ type: "string" }) meetingPlaceStart!: string | null;
  @ApiPropertyOptional({ type: "string" }) meetingPlaceEnd!: string | null;
  @ApiPropertyOptional({ type: "number" }) waterKm!: number | null;
  @ApiPropertyOptional({ type: "string" }) river!: string | null;
  @ApiPropertyOptional({ type: "string" }) deletedAt?: Date | undefined;

  @ApiPropertyOptional({ type: AlbumResponse }) album?: Album | undefined;
  @ApiPropertyOptional() groups?: EventGroup[] | undefined;
  @ApiPropertyOptional({ type: EventAttendeeResponse, isArray: true }) attendees?: EventAttendee[] | undefined;
  @ApiPropertyOptional() expenses?: EventExpense[] | undefined;
  @ApiPropertyOptional({ type: MemberResponse, isArray: true }) leaders?: Member[] | undefined;

  @ApiProperty() _links!: EventResponseLinks;
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

export class EventStatusChangeBody {
  @ApiPropertyOptional() @IsString() @IsOptional() statusNote?: string;
}
