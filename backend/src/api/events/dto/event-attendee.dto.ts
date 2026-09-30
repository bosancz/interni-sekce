import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsEnum, IsInt } from "class-validator";
import { AcEntity } from "src/access-control/access-control-lib";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Member } from "src/models/members/entities/member.entity";
import { EventResponse } from "./event.dto";

export class EventAttendeeResponse {
	@ApiProperty() eventId!: number;
	@ApiProperty() memberId!: number;
	@ApiProperty({ enum: EventAttendeeType }) type!: EventAttendeeType;
	@ApiPropertyOptional({ type: "integer", nullable: true }) position?: number | null;

	@AcEntity(EventResponse) event?: EventResponse | undefined;
	@ApiPropertyOptional({ type: MemberResponse }) member?: Member | undefined;
}

export class EventAttendeeCreateBody {
	@IsEnum(EventAttendeeType) type!: EventAttendeeType;
}

export class EventAttendeeUpdateBody extends EventAttendeeCreateBody {}

export class EventLeadersOrderBody {
	@ApiProperty({ type: "integer", isArray: true })
	@IsArray()
	@ArrayUnique()
	@IsInt({ each: true })
	memberIds!: number[];
}
