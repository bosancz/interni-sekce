import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class TopLeaderResponse {
	@ApiProperty() memberId!: number;
	@ApiProperty() nickname!: string;
	@ApiProperty() groupId!: number;

	/** "Dětodny" — children × days, summed over the events the member led. The ranking score. */
	@ApiProperty() childDays!: number;

	/** How many children that score comes from (each event's children counted once). */
	@ApiProperty() childrenCount!: number;

	/** How many events that score comes from. */
	@ApiProperty() eventsCount!: number;

	@ApiPropertyOptional({ type: "string" }) firstName?: string | null;
	@ApiPropertyOptional({ type: "string" }) lastName?: string | null;
}

export class TopLeadersQuery {
	@ApiPropertyOptional({ minimum: 1, maximum: 100, default: 5 })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	@IsOptional()
	limit?: number;
}
