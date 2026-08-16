import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class TopLeaderResponse {
	@ApiProperty() memberId!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty() groupId!: number;

	/** "děťodny" — children × days, summed over the events the member led. The ranking score. */
	@ApiProperty() childDays!: number;

	/** How many events that score comes from. */
	@ApiProperty() eventsCount!: number;

	/** Place in the ranking; equal scores share a place and the next one skips ahead (1., 1., 3., …). */
	@ApiProperty() rank!: number;

	@ApiPropertyOptional({ type: "string" }) firstName?: string | null;
	@ApiPropertyOptional({ type: "string" }) lastName?: string | null;
}

/** The caller's own place, which may be well below the shown top. */
export class MyRankingResponse {
	@ApiProperty() memberId!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty() groupId!: number;
	@ApiProperty() childDays!: number;
	@ApiProperty() eventsCount!: number;

	/** Missing when the member led no event with children that year, so they are not ranked at all. */
	@ApiPropertyOptional({ type: "number" }) rank?: number | null;

	@ApiPropertyOptional({ type: "string" }) firstName?: string | null;
	@ApiPropertyOptional({ type: "string" }) lastName?: string | null;
}

export class TopLeadersResponse {
	@ApiProperty() year!: number;

	/** děťodny of every event of the year, each event counted once — not once per leader. */
	@ApiProperty() childDays!: number;

	/** Oldest and newest year with a finished event, so the year switcher knows where to stop. */
	@ApiProperty() firstYear!: number;
	@ApiProperty() lastYear!: number;

	@ApiProperty({ type: TopLeaderResponse, isArray: true }) leaders!: TopLeaderResponse[];

	/** Where the caller stands — missing when their user has no member of its own. */
	@ApiPropertyOptional({ type: MyRankingResponse }) me?: MyRankingResponse;
}

/** One of the events behind a leader's score, as shown when their row is opened. */
export class LeaderEventResponse {
	@ApiProperty() eventId!: number;
	@ApiProperty() name!: string;
	@ApiProperty() dateFrom!: string;
	@ApiProperty() dateTill!: string;

	/** Dětodny this single event was worth — children on it × how many days it lasted. */
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
