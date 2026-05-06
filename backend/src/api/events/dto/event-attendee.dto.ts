import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { AcEntity } from "src/access-control/access-control-lib";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Member } from "src/models/members/entities/member.entity";
import { EventResponse } from "./event.dto";

export class EventAttendeeResponse {
	@ApiProperty() eventId!: number;
	@ApiProperty() memberId!: number;
	@ApiProperty({ enum: EventAttendeeType }) type!: EventAttendeeType;

	@AcEntity(EventResponse) event?: EventResponse | undefined;
	@ApiPropertyOptional({ type: MemberResponse }) member?: Member | undefined;
}

export class EventAttendeeCreateBody {
	@IsEnum(EventAttendeeType) type!: EventAttendeeType;
}

export class EventAttendeeUpdateBody extends EventAttendeeCreateBody {}
