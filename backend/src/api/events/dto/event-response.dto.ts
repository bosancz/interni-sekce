import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AcLink } from "src/access-control/schema/ac-link";

class EventResponseLinks {
  @ApiPropertyOptional()
  getEventAttendees?: AcLink;
}

export class EventResponse {
  @ApiProperty()
  id!: number;

  // @ApiPropertyOptional()
  // attendees?: [{}];

  @ApiPropertyOptional()
  _links?: EventResponseLinks;
}
