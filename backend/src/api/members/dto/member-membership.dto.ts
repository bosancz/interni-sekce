import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, Max, Min } from "class-validator";

/**
 * One year of a member's membership fee. The year is set (or cleared) server-side through
 * `setMembershipPaid()`, so a client never has to send — or risk overwriting — the whole list.
 */
export class MemberMembershipUpdateBody {
	/** The year the fee is being recorded for. The bounds only keep nonsense out of a smallint column. */
	@ApiProperty() @IsInt() @Min(1900) @Max(2200) year!: number;

	/** `true` = zaplaceno, `false` = nezaplaceno. */
	@ApiProperty() @IsBoolean() paid!: boolean;
}
