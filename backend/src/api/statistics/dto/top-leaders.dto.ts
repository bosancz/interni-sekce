import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class TopLeaderResponse {
	@ApiProperty() memberId!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty() groupId!: number;

	/** "Dětodny" — children × days, summed over the events the member led. The ranking score. */
	@ApiProperty() childDays!: number;

	/** How many events that score comes from. */
	@ApiProperty() eventsCount!: number;

	@ApiPropertyOptional({ type: "string" }) firstName?: string | null;
	@ApiPropertyOptional({ type: "string" }) lastName?: string | null;
}

export class TopLeadersResponse {
	@ApiProperty() year!: number;

	/** Dětodny of every event of the year, each event counted once — not once per leader. */
	@ApiProperty() childDays!: number;

	/** Oldest and newest year with a finished event, so the year switcher knows where to stop. */
	@ApiProperty() firstYear!: number;
	@ApiProperty() lastYear!: number;

	@ApiProperty({ type: TopLeaderResponse, isArray: true }) leaders!: TopLeaderResponse[];
}

export class TopLeadersQuery {
	@ApiPropertyOptional({ minimum: 1900, maximum: 2999, description: "Defaults to the current year." })
	@Type(() => Number)
	@IsInt()
	@Min(1900)
	@Max(2999)
	@IsOptional()
	year?: number;

	@ApiPropertyOptional({ minimum: 1, maximum: 100, default: 5 })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	@IsOptional()
	limit?: number;
}
