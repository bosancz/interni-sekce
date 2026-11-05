import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayUnique, IsArray, IsEnum, IsInt, IsOptional } from "class-validator";
import { AcEntity } from "src/access-control/access-control-lib";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { EventAttendeeType } from "src/models/events/entities/event-attendee.entity";
import { Member } from "src/models/members/entities/member.entity";
import { MemberRoles } from "src/models/members/schema/member-roles";
import { EventResponse } from "./event.dto";

export class EventAttendeeResponse {
	@ApiProperty() eventId!: number;
	@ApiProperty() memberId!: number;
	@ApiProperty({ enum: EventAttendeeType }) type!: EventAttendeeType;
	@ApiPropertyOptional({ type: "integer", nullable: true }) position?: number | null;
	@ApiProperty({ type: "string", enum: MemberRoles, enumName: "MemberRolesEnum" }) role!: MemberRoles;

	@AcEntity(EventResponse) event?: EventResponse | undefined;
	@ApiPropertyOptional({ type: MemberResponse }) member?: Member | undefined;
}

export class EventAttendeeCreateBody {
	@IsEnum(EventAttendeeType) type!: EventAttendeeType;
}

export class EventAttendeeUpdateBody {
	@ApiPropertyOptional({ enum: EventAttendeeType }) @IsOptional() @IsEnum(EventAttendeeType) type?: EventAttendeeType;

	@ApiPropertyOptional({ type: "string", enum: MemberRoles, enumName: "MemberRolesEnum" })
	@IsOptional()
	@IsEnum(MemberRoles)
	role?: MemberRoles;
}

export class EventLeadersOrderBody {
	@ApiProperty({ type: "integer", isArray: true })
	@IsArray()
	@ArrayUnique()
	@IsInt({ each: true })
	memberIds!: number[];
}
