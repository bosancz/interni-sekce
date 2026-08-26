import { ApiProperty } from "@nestjs/swagger";
import { MemberPaymentRequest } from "src/models/members/services/member-payment-request.service";

/**
 * Everything needed to ask one member for the membership fee: the account it is paid to
 * (from the `payment_settings` table), the generated variable symbol, the SPAYD payload and
 * the public URL of its QR code. The frontend renders and mails this as-is — it derives no
 * bank details of its own.
 */
export class MemberPaymentRequestResponse implements MemberPaymentRequest {
	/** `<last two digits of the year><member id padded to 5>`, e.g. `2600409`. */
	@ApiProperty() variableSymbol!: string;

	@ApiProperty() accountNumber!: string;
	@ApiProperty() bankCode!: string;
	@ApiProperty() iban!: string;
	@ApiProperty() amount!: number;
	@ApiProperty() currency!: string;

	/** Czech QR platba payload (SPAYD 1.0) encoded in the QR code. */
	@ApiProperty() spayd!: string;

	/** Payment message — the member's name without diacritics, uppercased. */
	@ApiProperty() message!: string;

	/** Absolute URL of the QR code image; openable without a session, so it can be mailed. */
	@ApiProperty() qrCodeUrl!: string;
}
