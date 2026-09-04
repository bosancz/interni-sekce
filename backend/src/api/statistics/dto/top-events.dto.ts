import { ApiProperty } from "@nestjs/swagger";
import { TopLeadersQuery } from "./top-leaders.dto";

export class TopEventResponse {
	@ApiProperty() eventId!: number;
	@ApiProperty() name!: string;
	@ApiProperty() dateFrom!: string;
	@ApiProperty() dateTill!: string;

	@ApiProperty() days!: number;
	@ApiProperty() childrenCount!: number;
	@ApiProperty() childDays!: number;

	@ApiProperty({ type: "string", isArray: true }) leaders!: string[];

	@ApiProperty() rank!: number;
}

export class TopEventsResponse {
	@ApiProperty() year!: number;

	@ApiProperty() childDays!: number;

	@ApiProperty() firstYear!: number;
	@ApiProperty() lastYear!: number;

	@ApiProperty({ type: TopEventResponse, isArray: true }) events!: TopEventResponse[];
}

export class TopEventsQuery extends TopLeadersQuery {}
