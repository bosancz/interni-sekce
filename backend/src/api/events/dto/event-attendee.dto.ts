import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Event } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";
import { EventResponse } from "./event.dto";

export class EventAttendeeResponse {
  @ApiProperty() eventId!: number;
  @ApiProperty() memberId!: number;
  @ApiProperty({ enum: EventAttendeeType }) type!: EventAttendeeType;
  @ApiPropertyOptional({ type: EventResponse }) event?: Event | undefined;
  @ApiPropertyOptional({ type: MemberResponse }) member?: Member | undefined;
}

export class EventAttendeeCreateBody {
  @IsEnum(EventAttendeeType) type!: EventAttendeeType;
}

export class EventAttendeeUpdateBody extends EventAttendeeCreateBody {}
