import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TopLeadersQuery } from "./top-leaders.dto";

export class TopChildResponse {
	@ApiProperty() memberId!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty() groupId!: number;

	@ApiProperty() days!: number;
	@ApiProperty() eventsCount!: number;

	@ApiProperty() rank!: number;

	@ApiPropertyOptional({ type: "string" }) firstName?: string | null;
	@ApiPropertyOptional({ type: "string" }) lastName?: string | null;
}

export class TopChildrenResponse {
	@ApiProperty() year!: number;

	@ApiProperty() childDays!: number;

	@ApiProperty() firstYear!: number;
	@ApiProperty() lastYear!: number;

	@ApiProperty({ type: TopChildResponse, isArray: true }) children!: TopChildResponse[];
}

export class ChildEventResponse {
	@ApiProperty() eventId!: number;
	@ApiProperty() name!: string;
	@ApiProperty() dateFrom!: string;
	@ApiProperty() dateTill!: string;

	@ApiProperty() days!: number;
}

export class TopChildrenQuery extends TopLeadersQuery {}
