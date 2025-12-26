import { ApiProperty } from "@nestjs/swagger";
import { EventResponse } from "src/api/events/dto/event.dto";

class EventsLeadersReportResponseLeaders {
	@ApiProperty({ type: "object", properties: { nickname: { type: "string" } } }) member!: { nickname: string };
	@ApiProperty({ type: EventResponse, isArray: true }) events!: EventResponse[];
}

export class EventsLeadersReportResponse {
	@ApiProperty() count!: number;
	@ApiProperty({ type: "object", additionalProperties: { type: "number" } }) groups!: { [group: string]: number };
	@ApiProperty({ type: "object", additionalProperties: { type: "number" } }) age!: { [age: string]: number };
	@ApiProperty({ type: EventsLeadersReportResponseLeaders, isArray: true }) top!: [];
}
