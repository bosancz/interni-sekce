import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min } from "class-validator";

/**
 * One year of a member's membership fee. The year is set (or cleared) server-side through
 * `setMembershipPaid()`, so a client never has to send — or risk overwriting — the whole list.
 */
export class MemberMembershipUpdateBody {
	/** The year the fee is being recorded for. The bounds only keep nonsense out of a smallint column. */
	@ApiProperty() @IsInt() @Min(1900) @Max(2200) year!: number;

	/** `true` = zaplaceno, `false` = nezaplaceno. */
	@ApiProperty() @IsBoolean() paid!: boolean;

	/**
	 * The treasurer's note on the fee, which only a recorded one can carry — sent with `paid: true`
	 * to write it. Left out entirely, the note already recorded stays as it is (that is how the
	 * paid/unpaid toggle sends it); `null` or an empty string clear it.
	 */
	@ApiPropertyOptional({ type: "string", nullable: true })
	@IsOptional()
	@IsString()
	note?: string | null;

	@ApiPropertyOptional({
		type: "string",
		nullable: true,
		description: "Den, kdy byl příspěvek zaplacen (YYYY-MM-DD). Vynechané pole nechá datum beze změny.",
	})
	@IsOptional()
	@IsString()
	@Matches(/^(\d{4}-\d{2}-\d{2})?$/, { message: "paidOn must be a date in the YYYY-MM-DD format" })
	paidOn?: string | null;

	/**
	 * What the fee was worth, sent with `paid: true` to write it. Left out entirely, a fee already
	 * recorded keeps its amount and a fee recorded now takes the one from the payment settings;
	 * `null` clears it.
	 */
	@ApiPropertyOptional({ type: "number", nullable: true })
	@IsOptional()
	@IsInt()
	@Min(0)
	amount?: number | null;
}
