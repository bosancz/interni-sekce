import { ApiProperty } from "@nestjs/swagger";
import { PaymentSettings } from "src/models/settings/entities/payment-settings.entity";

/**
 * Bank account and fee the membership payment is built from. Every value is read from the
 * `payment_settings` table, so it can be changed without touching the code — the frontend
 * must never carry a copy of any of it.
 */
export class PaymentSettingsResponse implements Omit<PaymentSettings, "id"> {
	@ApiProperty() accountNumber!: string;
	@ApiProperty() bankCode!: string;
	@ApiProperty() iban!: string;
	@ApiProperty() amount!: number;
	@ApiProperty() currency!: string;
}
