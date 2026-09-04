import { Injectable } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { Config } from "src/config";
import { getVariableSymbol } from "src/helpers/variable-symbol";
import { PaymentSettingsRepository } from "src/models/settings/repositories/payment-settings.repository";
import { Member } from "../entities/member.entity";

/**
 * The payment a QR platba link asks for, spelled out in the link's own path.
 *
 * Everything here is fixed the moment the link is made, not looked up again when it is opened: a
 * payment request that has gone out by e-mail names an account and an amount in its text, and the
 * QR next to it has to keep asking for exactly that. A later change of the club's fee or account
 * is a new request to be sent, not a silent rewrite of one the recipient already has.
 */
export interface QrCodeLinkPayment {
	variableSymbol: string;
	accountNumber: string;
	bankCode: string;
	amount: number;
	currency: string;
}

/** Everything the UI (and the payment e-mail) needs to ask one member for the membership fee. */
export interface MemberPaymentRequest extends QrCodeLinkPayment {
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

		const payment: QrCodeLinkPayment = {
			variableSymbol: getVariableSymbol(member),
			accountNumber: settings.accountNumber,
			bankCode: settings.bankCode,
			amount: settings.amount,
			currency: settings.currency,
		};

		return {
			...payment,
			message: this.getMessage(member),
			qrCodeUrl: this.getQrCodeLinkUrl(payment),
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
	 * `/api/qr-platba/<vs>/<account>/<bank>/<amount>/<currency>/<signature>`, which redirects to
	 * the generator. The payment it asks for is the one written into the link, so the QR keeps
	 * matching the e-mail it went out in; only the `MSG:` follows the member, whose name may since
	 * have been corrected.
	 *
	 * The generator's own URL cannot be mailed. Everything it needs rides in a query string, and
	 * Android's mailto parser (`androidx.core.net.MailTo`) percent-decodes the whole `mailto:` URI
	 * *before* splitting it on `&` and `=` — so the mail apps built on it cut the body off at the
	 * first `&` of such a URL and keep only what stands between its first two `=`. A member was
	 * handed a message ending mid-link at `…/image?currency`, with no QR, no thanks and no
	 * signature. This URL carries everything in path segments, leaving that parser nothing to
	 * split the body on.
	 */
	getQrCodeLinkUrl(payment: QrCodeLinkPayment): string {
		const path = this.getQrCodeLinkSegments(payment).join("/");

		return `${this.config.app.baseUrl}/${QR_LINK_PATH}/${path}/${this.signQrCodeLink(payment)}`;
	}

	/** The generator URL a public QR platba link redirects to. */
	getQrCodeImageUrl(member: Member, payment: QrCodeLinkPayment): string {
		return this.getQrCodeUrl(payment, this.getMessage(member));
	}

	/** Whether `signature` is the one {@link getQrCodeLinkUrl} put on this payment. */
	isQrCodeSignatureValid(payment: QrCodeLinkPayment, signature: string): boolean {
		const expected = Buffer.from(this.signQrCodeLink(payment));
		const given = Buffer.from(signature);

		return expected.length === given.length && timingSafeEqual(expected, given);
	}

	/**
	 * The payment as the path segments of its link, in the order the route reads them back. Every
	 * value is digits or an ISO currency code, so none of them can bring a `/` of its own into the
	 * path — or, just as importantly, an `&` or `=` into the mail body.
	 */
	private getQrCodeLinkSegments(payment: QrCodeLinkPayment): string[] {
		return [
			payment.variableSymbol,
			payment.accountNumber,
			payment.bankCode,
			String(payment.amount),
			payment.currency,
		];
	}

	/**
	 * Proof that the app itself minted this link, over every value in it — the account included.
	 * Both halves matter. Unsigned, the account and the amount in the path would let anyone have
	 * our domain hand out a QR code that pays them instead of the club, which is a phishing link
	 * with the club's own address on it; and the variable symbol is `<year><member id>`, so
	 * anyone could count up from 2600001 and read the members' names out of the QR codes.
	 *
	 * Derived from the session secret — which production already requires to be strong — under a
	 * purpose-specific prefix, so a signature can never be replayed as anything else. The values
	 * are joined with a separator none of them can contain, so no two payments can sign alike.
	 */
	private signQrCodeLink(payment: QrCodeLinkPayment): string {
		const signed = ["qr-platba", ...this.getQrCodeLinkSegments(payment)].join(":");

		return createHmac("sha256", this.config.jwt.secret).update(signed).digest("hex").slice(0, QR_SIGNATURE_LENGTH);
	}

	/**
	 * URL of the QR platba image for this payment. Every value comes from the payment the link
	 * carries, and the generator turns them into the SPAYD code the banking apps read.
	 *
	 * `currency` stays first, right behind the `?`, from when this URL was mailed as plain text:
	 * mail clients that render the body as HTML decode `&curren` — a legacy character reference
	 * that needs no semicolon — into "¤", and `&currency=CZK` then reached the generator as
	 * `¤cy=CZK`. The e-mail links to {@link getQrCodeLinkUrl} instead these days, so this only
	 * still guards the URL against being pasted somewhere that decodes entities; of every
	 * parameter the API takes, `currency` is the only one that collides with an entity name.
	 */
	private getQrCodeUrl(payment: QrCodeLinkPayment, message: string): string {
		const params = new URLSearchParams({
			currency: payment.currency,
			accountNumber: payment.accountNumber,
			bankCode: payment.bankCode,
			// the generator expects a decimal amount, and the fee is stored in whole units
			amount: payment.amount.toFixed(2),
			vs: payment.variableSymbol,
			message,
			size: String(QR_CODE_SIZE),
		});

		return `${QR_GENERATOR_URL}?${params.toString()}`;
	}
}
