import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

/** Which season the totals are about. Defaults to the current one. */
export class MembershipSummaryQuery {
	@ApiPropertyOptional({ type: "number" })
	@Type(() => Number)
	@IsInt()
	@Min(1900)
	@Max(2200)
	@IsOptional()
	year?: number;
}

/**
 * The membership fees of one season added up over the whole club — the figures above the treasurer
 * view. They are the club's takings, so they take no filter: narrowing the table below them to one
 * group must not change what the season has brought in. Counted server-side because the list is
 * paginated, and a page of fifty members says nothing about the whole.
 */
export class MembershipSummaryResponse {
	/** The season the figures are about. */
	@ApiProperty() year!: number;

	/** How many members have the fee of `year` recorded as paid. */
	@ApiProperty() paidCount!: number;

	/** What the recorded fees add up to, in whole units of `currency`. */
	@ApiProperty() totalAmount!: number;

	/** Currency of `totalAmount`, taken from the club's payment settings. */
	@ApiProperty() currency!: string;
}
