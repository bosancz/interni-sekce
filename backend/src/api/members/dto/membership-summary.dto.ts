import { ApiProperty } from "@nestjs/swagger";

/**
 * The membership fees of one season added up over the members a list shows — the figures at the
 * top of the treasurer view. It is counted server-side because the list is paginated: a page of
 * fifty members says nothing about what the club has collected.
 */
export class MembershipSummaryResponse {
	/** The season the figures are about. */
	@ApiProperty() year!: number;

	/** Members the filter matches, whether their fee is paid or not. */
	@ApiProperty() memberCount!: number;

	/** How many of them have the fee of `year` recorded as paid. */
	@ApiProperty() paidCount!: number;

	/** What the recorded fees add up to, in whole units of `currency`. */
	@ApiProperty() totalAmount!: number;

	/** Currency of `totalAmount`, taken from the club's payment settings. */
	@ApiProperty() currency!: string;
}
