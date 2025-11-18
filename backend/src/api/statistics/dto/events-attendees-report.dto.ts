import { ApiProperty } from "@nestjs/swagger";

export class EventsAttendeesReportResponse {
	@ApiProperty() count!: number;
	@ApiProperty({ type: "object", additionalProperties: { type: "number" } }) groups!: { [group: string]: number };
	@ApiProperty({ type: "object", additionalProperties: { type: "number" } }) age!: { [age: string]: number };
}
