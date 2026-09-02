import { Component, computed, effect, input, signal } from "@angular/core";
import { IonButton, IonButtons, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { cardOutline } from "ionicons/icons";
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

	readonly currentMembershipYear = currentMembershipYear;

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

	constructor(private readonly api: ApiService) {
		addIcons({ cardOutline });

		effect(() => {
			this.load(this.member());
		});
	}

	/** Opens the QR code on its own – handy for showing it to a parent or printing it. */
	openQrCode() {
		const payment = this.payment();
		if (!payment) return;

		window.open(payment.qrCodeUrl, "_blank", "noopener,noreferrer");
	}

	private async load(member?: SDK.MemberResponseWithLinks | null) {
		// nothing to load until the member is there, and nothing to show without the permission
		const memberId = member?._links?.getMemberPaymentRequest?.allowed ? member.id : null;
		if (memberId === this.loadedMemberId) return;

		this.loadedMemberId = memberId;
		this.payment.set(undefined);
		this.contactEmails.set([]);

		if (!memberId) return;

		try {
			const [payment, contacts] = await Promise.all([
				this.api.MembersApi.getMemberPaymentRequest(memberId).then((res) => res.data),
				this.api.MembersApi.listContacts(memberId).then((res) => res.data),
			]);

			this.payment.set(payment);
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
