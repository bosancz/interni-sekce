import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, Matches, Min } from "class-validator";
import { PaymentSettings } from "src/models/settings/entities/payment-settings.entity";

/**
 * Bank account and fee the membership payment is built from. Every value is read from the
 * `payment_settings` table, so it can be changed without touching the code — the frontend
 * must never carry a copy of any of it.
 */
export class PaymentSettingsResponse implements Omit<PaymentSettings, "id"> {
	@ApiProperty() accountNumber!: string;
	@ApiProperty() bankCode!: string;
	@ApiProperty() amount!: number;
	@ApiProperty() currency!: string;
}

/**
 * The values the treasurer may change. The currency is not among them: it is seeded with the
 * account and the QR generator is built around it, so changing it is a migration, not a setting.
 */
export class PaymentSettingsUpdateBody {
	/** Account number, with an optional prefix — e.g. "2301695140" or "19-2000145399". */
	@ApiPropertyOptional()
	@IsOptional()
	@Matches(/^(\d{1,6}-)?\d{1,10}$/, { message: "accountNumber must be a bank account number" })
	accountNumber?: string;

	/** Four-digit Czech bank code, e.g. "2010". */
	@ApiPropertyOptional()
	@IsOptional()
	@Matches(/^\d{4}$/, { message: "bankCode must be four digits" })
	bankCode?: string;

	/** Membership fee in whole units of the stored currency. */
	@ApiPropertyOptional()
	@IsOptional()
	@IsInt()
	@Min(0)
	amount?: number;
}
