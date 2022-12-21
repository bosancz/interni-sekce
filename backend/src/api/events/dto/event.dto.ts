import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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

export class EventCreateBody implements Partial<Event> {
  @IsOptional() @IsString() name?: string | undefined;
}

export class EventUpdateBody implements Partial<Event> {
  @IsOptional() @IsString() name?: string | undefined;
}
