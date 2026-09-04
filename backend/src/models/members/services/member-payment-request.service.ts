import { Injectable } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { Config } from "src/config";
import { getVariableSymbol } from "src/helpers/variable-symbol";
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
	/**
	 * Public URL of the QR platba image — our own signed link, which redirects to the generator.
	 * No session needed, so it can be mailed; see {@link MemberPaymentRequestService.getQrCodeLinkUrl}.
	 */
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

/** Path of the public QR platba link, as routed by `MemberPaymentQrController`. */
const QR_LINK_PATH = "api/qr-platba";

/**
 * Hex characters of the HMAC kept in a QR link signature. 64 bits is nowhere near guessable for
 * a link that answers 404 to everything else, and keeps the mailed URL short enough to read.
 */
const QR_SIGNATURE_LENGTH = 16;

@Injectable()
export class MemberPaymentRequestService {
	constructor(
		private readonly paymentSettings: PaymentSettingsRepository,
		private readonly config: Config,
	) {}

	async getPaymentRequest(member: Member): Promise<MemberPaymentRequest> {
		const settings = await this.paymentSettings.getPaymentSettings();

		const variableSymbol = getVariableSymbol(member);
		const message = this.getMessage(member);

		return {
			variableSymbol,
			accountNumber: settings.accountNumber,
			bankCode: settings.bankCode,
			amount: settings.amount,
			currency: settings.currency,
			message,
			qrCodeUrl: this.getQrCodeLinkUrl(variableSymbol),
		};
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
	 * The URL of the QR platba image that the app shows and the payment e-mail links to: our own
	 * `/api/qr-platba/<vs>/<signature>`, which redirects to the generator.
	 *
	 * The generator's own URL cannot be mailed. Everything it needs rides in a query string, and
	 * Android's mailto parser (`androidx.core.net.MailTo`) percent-decodes the whole `mailto:` URI
	 * *before* splitting it on `&` and `=` — so the mail apps built on it cut the body off at the
	 * first `&` of such a URL and keep only what stands between its first two `=`. A member was
	 * handed a message ending mid-link at `…/image?currency`, with no QR, no thanks and no
	 * signature. This URL carries everything in path segments, leaving that parser nothing to
	 * split the body on.
	 */
	getQrCodeLinkUrl(variableSymbol: string): string {
		const signature = this.signVariableSymbol(variableSymbol);

		return `${this.config.app.baseUrl}/${QR_LINK_PATH}/${variableSymbol}/${signature}`;
	}

	/** The generator URL a public QR platba link redirects to. */
	async getQrCodeImageUrl(member: Member, variableSymbol: string): Promise<string> {
		const settings = await this.paymentSettings.getPaymentSettings();

		return this.getQrCodeUrl(settings, variableSymbol, this.getMessage(member));
	}

	/** Whether `signature` is the one {@link getQrCodeLinkUrl} put on this variable symbol. */
	isQrCodeSignatureValid(variableSymbol: string, signature: string): boolean {
		const expected = Buffer.from(this.signVariableSymbol(variableSymbol));
		const given = Buffer.from(signature);

		return expected.length === given.length && timingSafeEqual(expected, given);
	}

	/**
	 * Proof that the app itself minted this link. Without it the redirect would be an open door
	 * to the whole membership: a variable symbol is `<year><member id>`, so anyone could count up
	 * from 2600001 and read the members' names out of the QR codes it answers with.
	 *
	 * Derived from the session secret — which production already requires to be strong — under a
	 * purpose-specific prefix, so a signature can never be replayed as anything else.
	 */
	private signVariableSymbol(variableSymbol: string): string {
		return createHmac("sha256", this.config.jwt.secret)
			.update(`qr-platba:${variableSymbol}`)
			.digest("hex")
			.slice(0, QR_SIGNATURE_LENGTH);
	}

	/**
	 * URL of the QR platba image for this payment. Every value comes from the stored settings,
	 * and the generator turns them into the SPAYD code the banking apps read.
	 *
	 * `currency` stays first, right behind the `?`, from when this URL was mailed as plain text:
	 * mail clients that render the body as HTML decode `&curren` — a legacy character reference
	 * that needs no semicolon — into "¤", and `&currency=CZK` then reached the generator as
	 * `¤cy=CZK`. The e-mail links to {@link getQrCodeLinkUrl} instead these days, so this only
	 * still guards the URL against being pasted somewhere that decodes entities; of every
	 * parameter the API takes, `currency` is the only one that collides with an entity name.
	 */
	private getQrCodeUrl(settings: PaymentSettings, variableSymbol: string, message: string): string {
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
