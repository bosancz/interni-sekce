import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { AlbumResponse } from "src/api/albums/dto/album.dto";
import { GroupResponse } from "src/api/members/dto/group.dto";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { Album } from "src/models/albums/entities/album.entity";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { EventExpense } from "src/models/events/entities/event-expense.entity";
import { EventGroup } from "src/models/events/entities/event-group.entity";
import { Event, EventStates } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import { EventAttendeeResponse } from "./event-attendee.dto";
import { EventExpenseResponse } from "./event-expense.dto";

export class EventResponse implements Event {
  @ApiProperty() id!: number;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: EventStates, enumName: "EventStatesEnum" }) status!: EventStates;
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
}

export class EventCreateBody implements Pick<Event, "name" | "description" | "dateFrom" | "dateTill"> {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description!: string | null;
  @ApiProperty() @IsString() dateFrom!: string;
  @ApiProperty() @IsString() dateTill!: string;
}

export class EventUpdateBody {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEnum(EventStates) status?: EventStates;
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
