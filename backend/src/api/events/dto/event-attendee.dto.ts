import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Member } from "src/models/members/entities/member.entity";
import { EventResponse } from "./event.dto";

export class EventAttendeeResponse {
  @ApiProperty() eventId!: number;
  @ApiProperty() memberId!: number;
  @ApiProperty() type!: EventAttendeeType;
  @ApiPropertyOptional({ type: EventResponse }) event?: EventResponse | undefined;
  @ApiPropertyOptional() member?: Member | undefined;
}

export class EventAttendeeUpdateBody {
  @IsEnum(EventAttendeeType) type!: EventAttendeeType;
}
