import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { AcLink, AcLinksObject } from "src/access-control/access-control-lib/schema/ac-link";
import { AlbumResponse } from "src/api/albums/dto/album.dto";
import { GroupResponse } from "src/api/members/dto/group.dto";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { Album } from "src/models/albums/entities/album.entity";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { EventExpense } from "src/models/events/entities/event-expense.entity";
import { EventGroup } from "src/models/events/entities/event-group.entity";
import { Event, EventStatus } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import { EventsAttendeesController } from "../controllers/events-attendees.controller";
import { EventsExpensesController } from "../controllers/events-expenses.controller";
import { EventsRegistrationsController } from "../controllers/events-registrations.controller";
import { EventsReportsController } from "../controllers/events-reports.controller";
import { EventsController } from "../controllers/events.controller";
import { EventAttendeeResponse } from "./event-attendee.dto";
import { EventExpenseResponse } from "./event-expense.dto";

type LinkNames =
  | ExtractExisting<
      keyof EventsController,
      | "deleteEvent"
      | "rejectEvent"
      | "leadEvent"
      | "submitEvent"
      | "getEvent"
      | "updateEvent"
      | "publishEvent"
      | "unpublishEvent"
      | "cancelEvent"
      | "uncancelEvent"
    >
  | ExtractExisting<keyof EventsAttendeesController, "listEventAttendees" | "addEventAttendee">
  | ExtractExisting<keyof EventsExpensesController, "listEventExpenses" | "addEventExpense">
  | keyof EventsRegistrationsController
  | keyof EventsReportsController;

class EventResponseLinks implements AcLinksObject<LinkNames> {
  @ApiProperty() addEventAttendee!: AcLink;
  @ApiProperty() addEventExpense!: AcLink;
  @ApiProperty() cancelEvent!: AcLink;
  @ApiProperty() deleteEvent!: AcLink;
  @ApiProperty() deleteEventRegistration!: AcLink;
  @ApiProperty() getEvent!: AcLink;
  @ApiProperty() getEventRegistration!: AcLink;
  @ApiProperty() getEventReport!: AcLink;
  @ApiProperty() leadEvent!: AcLink;
  @ApiProperty() listEventAttendees!: AcLink;
  @ApiProperty() listEventExpenses!: AcLink;
  @ApiProperty() publishEvent!: AcLink;
  @ApiProperty() rejectEvent!: AcLink;
  @ApiProperty() saveEventRegistration!: AcLink;
  @ApiProperty() submitEvent!: AcLink;
  @ApiProperty() uncancelEvent!: AcLink;
  @ApiProperty() unpublishEvent!: AcLink;
  @ApiProperty() updateEvent!: AcLink;
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
  @ApiPropertyOptional({ type: "string" }) deletedAt?: Date | string | null;

  @ApiPropertyOptional({ type: AlbumResponse }) album?: Album | undefined;
  @ApiPropertyOptional({ type: GroupResponse, isArray: true }) groups?: EventGroup[] | undefined;
  @ApiPropertyOptional({ type: EventAttendeeResponse, isArray: true }) attendees?: EventAttendee[] | undefined;
  @ApiPropertyOptional({ type: EventExpenseResponse, isArray: true }) expenses?: EventExpense[] | undefined;
  @ApiPropertyOptional({ type: MemberResponse, isArray: true }) leaders?: Member[] | undefined;

  @ApiProperty() _links!: EventResponseLinks;
}

export class EventCreateBody implements Pick<Event, "name" | "description" | "dateFrom" | "dateTill"> {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description!: string | null;
  @ApiProperty() @IsString() dateFrom!: string;
  @ApiProperty() @IsString() dateTill!: string;
}

export class EventUpdateBody {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(EventStatus) status?: EventStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateTill?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() leadersEvent?: boolean;
  @ApiPropertyOptional({ type: "string" }) @IsOptional() @IsString() type?: string | null;
  @ApiPropertyOptional({ type: "string" }) @IsOptional() @IsString() description?: string | null;
  @ApiPropertyOptional({ type: "string" }) @IsOptional() @IsString() statusNote?: string | null;
  @ApiPropertyOptional({ type: "string" }) @IsOptional() @IsString() place?: string | null;
  @ApiPropertyOptional({ type: "string" }) @IsOptional() @IsString() timeFrom?: string | null;
  @ApiPropertyOptional({ type: "string" }) @IsOptional() @IsString() timeTill?: string | null;
  @ApiPropertyOptional({ type: "string" }) @IsOptional() @IsString() meetingPlaceStart?: string | null;
  @ApiPropertyOptional({ type: "string" }) @IsOptional() @IsString() meetingPlaceEnd?: string | null;
  @ApiPropertyOptional({ type: "number" }) @IsOptional() @IsString() waterKm?: number | null;
  @ApiPropertyOptional({ type: "string" }) @IsOptional() @IsString() river?: string | null;
}

export class EventStatusChangeBody {
  @ApiPropertyOptional() @IsString() @IsOptional() statusNote?: string;
}
