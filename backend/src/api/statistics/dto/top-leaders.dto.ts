import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class TopLeaderResponse {
	@ApiProperty() memberId!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty() groupId!: number;

	@ApiProperty() childDays!: number;

	@ApiProperty() eventsCount!: number;

	@ApiProperty() rank!: number;

	@ApiPropertyOptional({ type: "string" }) firstName?: string | null;
	@ApiPropertyOptional({ type: "string" }) lastName?: string | null;
}

export class MyRankingResponse {
	@ApiProperty() memberId!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty() groupId!: number;
	@ApiProperty() childDays!: number;
	@ApiProperty() eventsCount!: number;

	@ApiPropertyOptional({ type: "number" }) rank?: number | null;

	@ApiPropertyOptional({ type: "string" }) firstName?: string | null;
	@ApiPropertyOptional({ type: "string" }) lastName?: string | null;
}

export class TopLeadersResponse {
	@ApiProperty() year!: number;

	@ApiProperty() childDays!: number;

	@ApiProperty() firstYear!: number;
	@ApiProperty() lastYear!: number;

	@ApiProperty({ type: TopLeaderResponse, isArray: true }) leaders!: TopLeaderResponse[];

	@ApiPropertyOptional({ type: MyRankingResponse }) me?: MyRankingResponse;
}

export class LeaderEventResponse {
	@ApiProperty() eventId!: number;
	@ApiProperty() name!: string;
	@ApiProperty() dateFrom!: string;
	@ApiProperty() dateTill!: string;

	@ApiProperty() childDays!: number;
}

export class StatisticsYearQuery {
	@ApiPropertyOptional({ minimum: 1900, maximum: 2999, description: "Defaults to the current year." })
	@Type(() => Number)
	@IsInt()
	@Min(1900)
	@Max(2999)
	@IsOptional()
	year?: number;
}

export class TopLeadersQuery extends StatisticsYearQuery {
	@ApiPropertyOptional({ minimum: 1, maximum: 100, default: 5 })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	@IsOptional()
	limit?: number;
}
