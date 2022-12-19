import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Document, DocumentLink } from "src/models/access-control/schema/document";

class EventResponseLinks {
  @ApiProperty()
  self: DocumentLink;
  @ApiProperty()
  attendees!: DocumentLink;
}

export class EventResponseDto implements Document<"attendees", string> {
  @ApiProperty()
  id!: number;

  @ApiPropertyOptional()
  attendees?: [{}];

  @ApiPropertyOptional()
  _links?: EventResponseLinks;
}
