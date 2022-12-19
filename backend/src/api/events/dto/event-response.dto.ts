import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DocumentLink } from "src/models/access-control/schema/document";

class EventResponseLinks {
  @ApiPropertyOptional()
  getEventAttendees: DocumentLink;
}

export class EventResponseDto {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional()
  attendees?: [{}];

  @ApiPropertyOptional()
  _links?: EventResponseLinks;
}
