import { ApiProperty } from "@nestjs/swagger";
import { MemberResponse } from "src/api/members/dto/member.dto";

class EventsReportResponseEvents {
  @ApiProperty() name!: string;
  @ApiProperty() dateFrom!: string;
  @ApiProperty() dateTill!: string;
  @ApiProperty() count!: number;
  @ApiProperty({ type: MemberResponse, isArray: true }) leaders!: MemberResponse[];
}

export class EventsReportResponse {
  @ApiProperty() count!: number;
  @ApiProperty({ type: "object", additionalProperties: { type: "number" } }) groups!: { [group: string]: number };
  @ApiProperty({ type: "object", additionalProperties: { type: "number" } }) age!: { [age: string]: number };

  @ApiProperty({ type: EventsReportResponseEvents, isArray: true }) top!: [];
  @ApiProperty() days!: number;
  @ApiProperty() mandays!: number;
}
