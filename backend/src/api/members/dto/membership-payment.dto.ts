import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MembershipPayment } from "src/models/members/entities/membership-payment.entity";

/**
 * One membership fee a member has paid. Read-only over the API — every value is derived when the
 * fee is recorded (see MembershipPaymentService), so there is no create/update body to go with it.
 */
export class MembershipPaymentResponse implements MembershipPayment {
	@ApiProperty() id!: number;
	@ApiProperty() memberId!: number;

	/** The season the fee is paid for. */
	@ApiProperty() forYear!: number;

	/** Variable symbol the fee was paid under, e.g. `2600001`. */
	@ApiProperty({ type: "string" }) variableSymbol!: string;

	/** Amount in whole units of the payment settings' currency. */
	@ApiProperty() amount!: number;

	/** The day the fee was recorded; null for fees carried over from before they were dated. */
	@ApiPropertyOptional({ type: "string" }) date?: string | null;
}
