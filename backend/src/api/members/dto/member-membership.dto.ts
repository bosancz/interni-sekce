import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

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
}
