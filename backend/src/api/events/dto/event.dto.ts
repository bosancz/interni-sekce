import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { AlbumResponse } from "src/api/albums/dto/album.dto";
import { GroupResponse } from "src/api/members/dto/group.dto";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { Album } from "src/models/albums/entities/album.entity";
import { EventAttendee } from "src/models/events/entities/event-attendee.entity";
import { EventExpense } from "src/models/events/entities/event-expense.entity";
import { Event, EventPlaceGeometry, EventStates } from "src/models/events/entities/event.entity";
import { Group } from "src/models/members/entities/group.entity";
import { Member } from "src/models/members/entities/member.entity";
import { EventAttendeeResponse } from "./event-attendee.dto";
import { EventExpenseResponse } from "./event-expense.dto";

export class EventResponse implements Omit<Event, "setLeaders" | "srcId"> {
	id!: number;
	name!: string;
	@ApiProperty({ enum: EventStates, enumName: "EventStatesEnum" }) status!: EventStates;
	dateFrom!: string;
	dateTill!: string;
	leadersEvent!: boolean;
	groupsIds!: number[];
	hasRegistration!: boolean;

	type!: string | null;
	statusNote!: string | null;
	place!: string | null;
	placeGeometry!: EventPlaceGeometry | null;
	description!: string | null;
	price!: number | null;
	itemList!: string | null;
	timeFrom!: string | null;
	timeTill!: string | null;
	meetingPlaceStart!: string | null;
	meetingPlaceEnd!: string | null;
	waterKm!: number | null;
	river!: string | null;
	deletedAt?: Date | null;
	report!: string | null;
	@ApiPropertyOptional({ type: "string" }) announcementSentAt!: Date | string | null;
	@ApiPropertyOptional({ type: "string" }) accountingSentAt!: Date | string | null;

	@ApiPropertyOptional({ type: AlbumResponse }) album?: Album | undefined;
	@ApiPropertyOptional({ type: GroupResponse, isArray: true }) groups?: Group[] | undefined;
	@ApiPropertyOptional({ type: EventAttendeeResponse, isArray: true }) attendees?: EventAttendee[] | undefined;
	@ApiPropertyOptional({ type: EventExpenseResponse, isArray: true }) expenses?: EventExpense[] | undefined;
	@ApiPropertyOptional({ type: MemberResponse, isArray: true }) leaders?: Member[] | undefined;
}

export class EventCreateBody implements Pick<Event, "name" | "description" | "dateFrom" | "dateTill"> {
	@IsString() name!: string;
	@IsString() dateFrom!: string;
	@IsString() dateTill!: string;
	@IsOptional() @IsString() description!: string | null;
	@IsOptional() @IsString() type!: string | null;
}

export class EventUpdateBody {
	@IsOptional() @IsString() name?: string;
	@IsOptional() @IsEnum(EventStates) status?: EventStates;
	@IsOptional() @IsString() dateFrom?: string;
	@IsOptional() @IsString() dateTill?: string;
	@IsOptional() @IsBoolean() leadersEvent?: boolean;
	@IsOptional() @IsBoolean() hasRegistration?: boolean;

	@ApiPropertyOptional({ type: "number", isArray: true })
	@IsOptional()
	@IsNumber({}, { each: true })
	groupsIds?: number[];

	@IsOptional() @IsString() type?: string | null;
	@IsOptional() @IsString() description?: string | null;
	@ApiPropertyOptional({ type: "number" }) @IsOptional() @IsNumber() price?: number | null;
	@IsOptional() @IsString() itemList?: string | null;
	@IsOptional() @IsString() statusNote?: string | null;
	@IsOptional() @IsString() place?: string | null;
	@IsOptional() placeCoordinates?: { lat: number; lng: number } | null;
	@IsOptional() @IsString() timeFrom?: string | null;
	@IsOptional() @IsString() timeTill?: string | null;
	@IsOptional() @IsString() meetingPlaceStart?: string | null;
	@IsOptional() @IsString() meetingPlaceEnd?: string | null;
	@ApiPropertyOptional({ type: "number" }) @IsOptional() @IsString() waterKm?: number | null;
	@IsOptional() @IsString() river?: string | null;
}

export class EventReportUpdateBody {
	@IsOptional() @IsString() report!: string | null;
}

export class EventStatusChangeBody {
	@IsString() @IsOptional() statusNote?: string;
}
