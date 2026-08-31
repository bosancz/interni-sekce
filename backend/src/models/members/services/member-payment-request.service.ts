import { Injectable } from "@nestjs/common";
import { PaymentSettings } from "src/models/settings/entities/payment-settings.entity";
import { PaymentSettingsRepository } from "src/models/settings/repositories/payment-settings.repository";
import { Member } from "../entities/member.entity";

/** Everything the UI (and the payment e-mail) needs to ask one member for the membership fee. */
export interface MemberPaymentRequest {
	variableSymbol: string;
	accountNumber: string;
	bankCode: string;
	amount: number;
	currency: string;
	/** `MSG:` of the payment — the member's name as the bank will show it. */
	message: string;
	/** Public URL of the QR platba image; no session needed, so it can be mailed. */
	qrCodeUrl: string;
}

/**
 * QR platba image generator (https://qr-platba.cz/pro-vyvojare/restful-api/). It builds the
 * SPAYD payload itself from the account number and bank code — including deriving the IBAN —
 * so nothing here has to compute or store one. HTTPS, because the app is served over HTTPS and
 * an http:// image would be blocked as mixed content.
 */
const QR_GENERATOR_URL = "https://api.paylibo.com/paylibo/generator/czech/image";

/** Edge length of the generated QR in pixels; the branding frame is added around it. */
const QR_CODE_SIZE = 500;

/** SPAYD `MSG:` is capped at 60 characters by the QR platba specification. */
const MESSAGE_MAX_LENGTH = 60;

@Injectable()
export class MemberPaymentRequestService {
	constructor(private readonly paymentSettings: PaymentSettingsRepository) {}

	async getPaymentRequest(member: Member): Promise<MemberPaymentRequest> {
		const settings = await this.paymentSettings.getPaymentSettings();

		const variableSymbol = this.getVariableSymbol(member.id);
		const message = this.getMessage(member);

		return {
			variableSymbol,
			accountNumber: settings.accountNumber,
			bankCode: settings.bankCode,
			amount: settings.amount,
			currency: settings.currency,
			message,
			qrCodeUrl: this.getQrCodeUrl(settings, variableSymbol, message),
		};
	}

	/**
	 * Variable symbol of a member's fee: the last two digits of the current year followed by
	 * the member id padded to five digits (member 1 in 2026 → `2600001`). Always derived,
	 * never entered by hand, so the treasurer can map any incoming payment back to a member.
	 */
	getVariableSymbol(memberId: number, date = new Date()): string {
		const year = String(date.getFullYear()).slice(-2);

		return year + String(memberId).padStart(5, "0");
	}

	/**
	 * Payment message, in the same shape the treasurer's spreadsheet has been using:
	 * `prispevky <jméno> <příjmení>`.
	 *
	 * Diacritics are stripped here rather than left to the generator's `compress` option — that
	 * option does not decode percent-encoded UTF-8, so an "á" reaches the QR as a literal
	 * `%C3%A1`. Plain ASCII is also what the bank shows back on the statement unmangled.
	 */
	getMessage(member: Member): string {
		const name = [member.firstName, member.lastName]
			.filter(Boolean)
			.join(" ")
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/\s+/g, " ")
			.trim();

		return `prispevky ${name}`.trim().slice(0, MESSAGE_MAX_LENGTH);
	}

	/**
	 * URL of the QR platba image for this payment. Every value comes from the stored settings,
	 * and the generator turns them into the SPAYD code the banking apps read.
	 *
	 * `currency` MUST stay first, right behind the `?`. This URL is also pasted into the payment
	 * e-mail as plain text, and mail clients that render the body as HTML decode `&curren` — a
	 * legacy HTML character reference that needs no semicolon — into "¤". `&currency=CZK` then
	 * arrives as `¤cy=CZK` (percent-encoded `%C2%A4cy=CZK`) and the generator answers with an
	 * error instead of a QR code. First position is the one place an `&` cannot precede it.
	 * Of every parameter this API takes, `currency` is the only one that collides with an
	 * entity name, so the remaining order is free.
	 */
	getQrCodeUrl(settings: PaymentSettings, variableSymbol: string, message: string): string {
		const params = new URLSearchParams({
			currency: settings.currency,
			accountNumber: settings.accountNumber,
			bankCode: settings.bankCode,
			// the generator expects a decimal amount, and the fee is stored in whole units
			amount: settings.amount.toFixed(2),
			vs: variableSymbol,
			message,
			size: String(QR_CODE_SIZE),
		});

		return `${QR_GENERATOR_URL}?${params.toString()}`;
	}
}
