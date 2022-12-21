import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { AcLink } from "src/access-control/schema/ac-link";
import { Event } from "src/models/events/entities/event.entity";
import { Member } from "src/models/members/entities/member.entity";

class EventResponseLinks {
  @ApiPropertyOptional() getEventAttendees?: AcLink;
}

export class EventResponse {
  @ApiProperty() id!: number;
  @ApiProperty() leaders!: Pick<Member, "id">[];
  @ApiPropertyOptional() _links?: EventResponseLinks;
}

export class EventCreateResponse extends OmitType(EventResponse, ["leaders"]) {}

export class EventCreateBody implements Pick<Event, "name" | "description" | "dateFrom" | "dateTill"> {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() dateFrom!: string;
  @ApiProperty() @IsString() dateTill!: string;
  @ApiProperty() @IsOptional() @IsString() description!: string;
}

export class EventUpdateBody extends EventCreateBody {}
