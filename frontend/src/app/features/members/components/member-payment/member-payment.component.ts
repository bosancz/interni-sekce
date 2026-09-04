import { DatePipe } from "@angular/common";
import { Component, computed, effect, input, signal } from "@angular/core";
import { IonButton, IonButtons, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { cardOutline, checkmarkCircle, chevronDown, shareSocialOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardFooterComponent } from "src/app/shared/components/card-footer/card-footer.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { CopyButtonComponent } from "src/app/shared/components/copy-button/copy-button.component";
import { SDK } from "src/sdk";
import { currentMembershipYear } from "src/app/core/helpers/membership";
import { getVariableSymbolYear } from "src/app/core/helpers/variable-symbol";
import { ToastService } from "src/app/core/services/toast.service";

/**
 * How long the QR image may take to arrive before the share falls back to plain text. It is
 * normally fetched ahead of the tap, so this is a ceiling on a background request rather than on
 * anything the user is waiting for.
 */
const QR_FETCH_TIMEOUT = 5000;

/**
 * Membership fee card: what the member owes, where to send it, the QR platba code and a
 * ready-made e-mail asking for the payment.
 *
 * Every value shown here (account, amount, currency, variable symbol, QR) comes from
 * `GET /members/:id/payment-request`, which reads the club's `payment_settings` row — nothing
 * about the bank account is known to the frontend.
 */
@Component({
	selector: "bo-member-payment",
	templateUrl: "./member-payment.component.html",
	styleUrl: "./member-payment.component.scss",

	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		CardFooterComponent,
		CopyButtonComponent,
		IonIcon,
		IonSkeletonText,
		IonButton,
		IonButtons,
		DatePipe,
	],
})
export class MemberPaymentComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();

	/** `undefined` while loading, `null` when the payment details could not be loaded. */
	payment = signal<SDK.MemberPaymentRequestResponseWithLinks | null | undefined>(undefined);

	/** Member whose details are loaded, so unrelated edits of the member do not refetch. */
	private loadedMemberId: number | null = null;

	/** E-mails of the member's contacts (parents), loaded alongside the payment details. */
	private contactEmails = signal<string[]>([]);

	/**
	 * Whether this browser can hand the QR code to another app. Web Share is a mobile API, so on
	 * a desktop browser the button simply is not there — "Otevřít QR kód" covers that case.
	 */
	readonly shareSupported = typeof navigator !== "undefined" && typeof navigator.share === "function";

	/** True while the share sheet is being prepared, so the button cannot be pressed twice. */
	readonly sharing = signal(false);

	/**
	 * The QR image, fetched as soon as the payment is known so the share sheet opens on the tap.
	 * `navigator.share()` needs the tap's user activation, which does not survive waiting for a
	 * slow third-party image, and the same URL is already being loaded by the `<img>` anyway.
	 */
	private qrCodeFiles: Promise<File[] | null> | null = null;

	readonly currentMembershipYear = currentMembershipYear;

	/**
	 * Whether the details of an already paid fee are unfolded. Only ever read while the fee is
	 * paid — an unpaid one is always shown in full.
	 */
	readonly detailsOpen = signal(false);

	/**
	 * The recorded fee this card is showing the QR for: the member's payment made under exactly
	 * the variable symbol printed here. Matching on the symbol rather than on the year is how the
	 * treasurer reconciles the bank statement — the symbol is what identifies the payment — and it
	 * keeps the card honest if the two ever disagree.
	 */
	readonly paidPayment = computed(() => {
		const variableSymbol = this.payment()?.variableSymbol;
		if (!variableSymbol) return undefined;

		return this.member()?.membership?.find((payment) => payment.variableSymbol === variableSymbol);
	});

	/** True once the fee this card asks for has been recorded as paid. */
	readonly paid = computed(() => !!this.paidPayment());

	/**
	 * A paid fee is folded away to its header — there is nothing left to pay — and the account,
	 * the symbol and the QR are one chevron away for when someone wants to look them up anyway.
	 */
	readonly detailsVisible = computed(() => !this.paid() || this.detailsOpen());

	/**
	 * Green while the fee stands ticked off, grey once its details are unfolded: what is on show
	 * then is a record of a payment that has already been made, not an invitation to make one.
	 */
	readonly cardColor = computed(() => {
		if (!this.paid()) return undefined;

		return this.detailsOpen() ? "var(--bo-muted)" : "var(--bo-green)";
	});

	/**
	 * Hidden outright for anyone who may not read the member's payment details; while the member
	 * itself is still loading the card stays visible and shows its skeleton.
	 */
	visible = computed(() => {
		const member = this.member();
		return !member || !!member._links?.getMemberPaymentRequest?.allowed;
	});

	accountNumber = computed(() => {
		const payment = this.payment();
		return payment ? `${payment.accountNumber}/${payment.bankCode}` : "";
	});

	amount = computed(() => {
		const payment = this.payment();
		return payment ? this.formatAmount(payment) : "";
	});

	/** The member's contacts' (parents), without duplicates. */
	private recipients = computed(() => {
		const emails = [...this.contactEmails()];

		return [...new Set(emails.filter((email): email is string => !!email))];
	});

	/** `mailto:` URI opening the user's mail client with the whole payment request filled in. */
	mailto = computed(() => {
		const payment = this.payment();
		if (!payment) return undefined;

		return this.getMailto(payment, this.recipients());
	});

	constructor(
		private readonly api: ApiService,
		private readonly toasts: ToastService,
	) {
		addIcons({ cardOutline, checkmarkCircle, chevronDown, shareSocialOutline });

		effect(() => {
			this.load(this.member());
		});
	}

	/** Folds the details of a paid fee in and out. */
	toggleDetails() {
		this.detailsOpen.update((open) => !open);
	}

	/** Opens the QR code on its own – handy for showing it to a parent or printing it. */
	openQrCode() {
		const payment = this.payment();
		if (!payment) return;

		window.open(payment.qrCodeUrl, "_blank", "noopener,noreferrer");
	}

	/**
	 * Hands the QR code over to another app through the Web Share API. On a phone the share sheet
	 * lists the banking apps, and they read the payment straight out of the shared image — so the
	 * fee can be paid without ever scanning anything.
	 *
	 * The image itself is shared wherever the browser takes files; where it does not — and where
	 * the generator did not answer in time — the payment details and the link to the QR go out as
	 * text instead, which every share sheet accepts.
	 */
	async shareQrCode() {
		const payment = this.payment();
		if (!payment || this.sharing()) return;

		this.sharing.set(true);

		try {
			const files = await (this.qrCodeFiles ?? this.fetchQrCodeFiles(payment));
			const title = `Členský příspěvek ${this.paymentYear(payment)}`;
			const text = this.getShareText(payment);

			if (files && navigator.canShare?.({ files })) await navigator.share({ files, title, text });
			else await navigator.share({ title, text, url: payment.qrCodeUrl });
		} catch (e) {
			// closing the share sheet without picking an app rejects with AbortError – not a failure
			if ((e as Error)?.name !== "AbortError") this.toasts.toast("QR kód se nepodařilo sdílet.");
		} finally {
			this.sharing.set(false);
		}
	}

	/** The QR image as a file to share, or `null` when it cannot be fetched. */
	private async fetchQrCodeFiles(payment: SDK.MemberPaymentRequestResponseWithLinks): Promise<File[] | null> {
		try {
			const response = await fetch(payment.qrCodeUrl, { signal: AbortSignal.timeout(QR_FETCH_TIMEOUT) });
			if (!response.ok) return null;

			const blob = await response.blob();

			return [
				new File([blob], `qr-platba-${payment.variableSymbol}.png`, {
					type: blob.type || "image/png",
				}),
			];
		} catch {
			// the generator is a third-party service – a hiccup there just falls back to sharing text
			return null;
		}
	}

	/** Payment details accompanying the shared QR, for apps that show the text next to it. */
	private getShareText(payment: SDK.MemberPaymentRequestResponseWithLinks): string {
		return [
			`Členský příspěvek ${this.paymentYear(payment)}`,
			`Účet: ${payment.accountNumber}/${payment.bankCode}`,
			`Variabilní symbol: ${payment.variableSymbol}`,
			`Částka: ${this.formatAmount(payment)}`,
		].join("\n");
	}

	private async load(member?: SDK.MemberResponseWithLinks | null) {
		// nothing to load until the member is there, and nothing to show without the permission
		const memberId = member?._links?.getMemberPaymentRequest?.allowed ? member.id : null;
		if (memberId === this.loadedMemberId) return;

		this.loadedMemberId = memberId;
		this.detailsOpen.set(false);
		this.payment.set(undefined);
		this.contactEmails.set([]);
		this.qrCodeFiles = null;

		if (!memberId) return;

		try {
			const [payment, contacts] = await Promise.all([
				this.api.MembersApi.getMemberPaymentRequest(memberId).then((res) => res.data),
				this.api.MembersApi.listContacts(memberId).then((res) => res.data),
			]);

			this.payment.set(payment);
			if (this.shareSupported) this.qrCodeFiles = this.fetchQrCodeFiles(payment);
			this.contactEmails.set(
				contacts.map((contact) => contact.email).filter((email): email is string => !!email),
			);
		} catch (e) {
			// let a later member change retry rather than leaving the card stuck on the error
			this.loadedMemberId = null;
			this.payment.set(null);
		}
	}

	/**
	 * `CZK` is spelled out as the local "Kč" – a currency label; the amount itself and the
	 * currency code both come from the API.
	 */
	private formatAmount(payment: SDK.MemberPaymentRequestResponseWithLinks) {
		return `${payment.amount} ${payment.currency === "CZK" ? "Kč" : payment.currency}`;
	}

	/**
	 * The year the payment is for. It is read back out of the variable symbol rather than taken
	 * from today's date: the symbol is what the recipient will type into their bank, so the year
	 * named in the e-mail is by definition the year that symbol was issued for.
	 */
	private paymentYear(payment: SDK.MemberPaymentRequestResponseWithLinks): number {
		return getVariableSymbolYear(payment.variableSymbol) ?? currentMembershipYear();
	}

	private getMailto(payment: SDK.MemberPaymentRequestResponseWithLinks, recipients: string[]) {
		const member = this.member();
		const name = member?.nickname ? ` – ${member.nickname}` : "";
		const amount = this.formatAmount(payment);
		const year = this.paymentYear(payment);

		const subject = `Členský příspěvek ${year}${name}`;

		const body = [
			"Dobrý den,",
			"",
			`prosím vás o zaplacení členského příspěvku na kalendářní rok ${year} ve výši ${amount}.`,
			"",
			`Číslo účtu: ${payment.accountNumber}/${payment.bankCode}`,
			`Variabilní symbol: ${payment.variableSymbol}`,
			`Částka: ${amount}`,
			"",
			"Platbu můžete provést i naskenováním QR kódu, který se otevře na tomto odkazu:",
			payment.qrCodeUrl,
			"",
			"Děkujeme.",
			"",
			// the club's official footer, as it appears on the rest of its correspondence
			"KONDOR Skupina ŠÁN z.s.",
			"Podolské nábřeží 1180/5, Praha 4, 147 00",
			"(E-mail: info@bosan.cz)",
			"IČ: 47610727",
		].join("\r\n");

		// `mailto:` cannot carry an attachment, hence the QR as a link in the body above.
		// Addresses keep their `@` (allowed unencoded in a mailto address per RFC 6068) so the
		// comma-separated recipient list stays readable to every mail client.
		const to = recipients.map((email) => encodeURIComponent(email).replace(/%40/g, "@")).join(",");

		return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	}
}
