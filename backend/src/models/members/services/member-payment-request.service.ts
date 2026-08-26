import { Injectable } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { toBuffer } from "qrcode";
import { Config } from "src/config";
import { PaymentSettings } from "src/models/settings/entities/payment-settings.entity";
import { PaymentSettingsRepository } from "src/models/settings/repositories/payment-settings.repository";
import { Member } from "../entities/member.entity";
import { MembersRepository } from "../repositories/members.repository";

/** Everything the UI (and the payment e-mail) needs to ask one member for the membership fee. */
export interface MemberPaymentRequest {
	variableSymbol: string;
	accountNumber: string;
	bankCode: string;
	iban: string;
	amount: number;
	currency: string;
	/** SPAYD payload encoded in the QR code. */
	spayd: string;
	/** `MSG:` of the SPAYD payload — the member's name as the bank will show it. */
	message: string;
	/** Absolute, session-less URL rendering {@link spayd} as a PNG (safe to put in an e-mail). */
	qrCodeUrl: string;
}

/** Length of the hex HMAC appended to the variable symbol in the public QR code URL. */
const QR_TOKEN_LENGTH = 16;

/** `<variable symbol>-<token>` as it appears in the public QR code URL. */
const QR_CODE_PATTERN = new RegExp(`^(\\d{3,10})-([0-9a-f]{${QR_TOKEN_LENGTH}})$`);

/** SPAYD `MSG:` is capped at 60 characters by the QR platba specification. */
const MESSAGE_MAX_LENGTH = 60;

@Injectable()
export class MemberPaymentRequestService {
	constructor(
		private readonly members: MembersRepository,
		private readonly paymentSettings: PaymentSettingsRepository,
		private readonly config: Config,
	) {}

	async getPaymentRequest(member: Member): Promise<MemberPaymentRequest> {
		const settings = await this.paymentSettings.getPaymentSettings();

		const variableSymbol = this.getVariableSymbol(member.id);
		const message = this.getMessage(member);

		return {
			variableSymbol,
			accountNumber: settings.accountNumber,
			bankCode: settings.bankCode,
			iban: settings.iban,
			amount: settings.amount,
			currency: settings.currency,
			spayd: this.getSpayd(settings, variableSymbol, message),
			message,
			qrCodeUrl: this.getQrCodeUrl(variableSymbol),
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
	 * Payment message: the member's name, diacritics stripped and uppercased, so it survives
	 * the QR alphanumeric encoding and the banks' own transliteration unchanged.
	 */
	getMessage(member: Member): string {
		return [member.firstName, member.lastName]
			.filter(Boolean)
			.join(" ")
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toUpperCase()
			// SPAYD uses `*` as its field separator and the QR alphanumeric mode has no
			// lowercase/punctuation, so keep the message to what both can carry.
			.replace(/[^A-Z0-9 -]/g, "")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, MESSAGE_MAX_LENGTH);
	}

	/**
	 * Czech QR platba payload (SPAYD 1.0), concatenated from the stored settings:
	 * `SPD*1.0*ACC:<iban>*AM:<amount>.00*CC:<currency>*X-VS:<vs>*MSG:<name>`.
	 */
	getSpayd(settings: PaymentSettings, variableSymbol: string, message: string): string {
		return (
			"SPD*1.0" +
			`*ACC:${settings.iban}` +
			`*AM:${settings.amount}.00` +
			`*CC:${settings.currency}` +
			`*X-VS:${variableSymbol}` +
			`*MSG:${message}`
		);
	}

	/**
	 * Absolute URL of the PNG QR code for a variable symbol. The path carries an HMAC of the
	 * variable symbol so the image can be served without a session — a payment e-mail is read
	 * by parents who have no account here, and a login wall would make the link useless — while
	 * still not being enumerable by walking member ids.
	 */
	getQrCodeUrl(variableSymbol: string): string {
		const baseUrl = this.config.app.baseUrl.replace(/\/+$/, "");
		const prefix = this.config.server.globalPrefix ? `/${this.config.server.globalPrefix}` : "";

		return `${baseUrl}${prefix}/payments/qr/${variableSymbol}-${this.getQrCodeToken(variableSymbol)}`;
	}

	/**
	 * Splits a `<variable symbol>-<token>` code from the public QR URL and verifies the token.
	 * Returns the member id encoded in the variable symbol, or `null` for anything that does
	 * not verify.
	 */
	parseQrCode(code: string): { variableSymbol: string; memberId: number } | null {
		const match = QR_CODE_PATTERN.exec(code);
		if (!match) return null;

		const [, variableSymbol, token] = match;

		const expected = Buffer.from(this.getQrCodeToken(variableSymbol));
		const provided = Buffer.from(token);
		if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

		// the variable symbol is `<two-digit year><member id>` – see getVariableSymbol()
		const memberId = parseInt(variableSymbol.slice(2), 10);
		if (!memberId) return null;

		return { variableSymbol, memberId };
	}

	/**
	 * Renders the QR code behind a public `<variable symbol>-<token>` code, or `null` when the
	 * code does not verify or its member is gone. The variable symbol comes from the (verified)
	 * code rather than from the current year, so a link mailed out last season keeps rendering
	 * the QR the payment was requested with.
	 */
	async renderPaymentQrCode(code: string): Promise<Buffer | null> {
		const parsed = this.parseQrCode(code);
		if (!parsed) return null;

		const member = await this.members.getMember(parsed.memberId);
		if (!member) return null;

		const settings = await this.paymentSettings.getPaymentSettings();
		const spayd = this.getSpayd(settings, parsed.variableSymbol, this.getMessage(member));

		return this.renderQrCode(spayd);
	}

	/** Renders a SPAYD payload as a PNG QR code. */
	renderQrCode(spayd: string): Promise<Buffer> {
		return toBuffer(spayd, { type: "png", errorCorrectionLevel: "M", margin: 2, width: 512 });
	}

	private getQrCodeToken(variableSymbol: string): string {
		return createHmac("sha256", this.config.jwt.secret)
			.update(`payment-qr:${variableSymbol}`)
			.digest("hex")
			.slice(0, QR_TOKEN_LENGTH);
	}
}
