import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * Bank account the membership fee is collected on, plus the fee itself.
 *
 * A single-row table (seeded by the PaymentSettings migration) so the account can be
 * changed in the database without a deploy — nothing about it is hardcoded in the app.
 * `iban` is deliberately a plain stored column, not something derived from
 * `accountNumber`/`bankCode`: the app never computes an IBAN, it only reads the one
 * the club entered.
 */
@Entity("payment_settings")
export class PaymentSettings {
	@PrimaryGeneratedColumn() id!: number;

	/** Account number without the bank code, e.g. "2301695140". */
	@Column({ type: "varchar", nullable: false }) accountNumber!: string;

	/** Four-digit Czech bank code, e.g. "2010". */
	@Column({ type: "varchar", nullable: false }) bankCode!: string;

	/** IBAN of the same account, stored as entered — never derived. */
	@Column({ type: "varchar", nullable: false }) iban!: string;

	/** Membership fee amount in whole units of `currency`. */
	@Column({ type: "integer", nullable: false }) amount!: number;

	/** ISO 4217 currency code, e.g. "CZK". */
	@Column({ type: "varchar", nullable: false }) currency!: string;
}
