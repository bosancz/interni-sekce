import { Component, computed, OnInit, signal } from "@angular/core";
import { IonContent, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { cardOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { EditButtonNumberComponent } from "src/app/shared/components/edit-button-number/edit-button-number.component";
import { EditButtonTextComponent } from "src/app/shared/components/edit-button-text/edit-button-text.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

/**
 * The club's bank account and the membership fee — one box, its own page in the administration
 * next to the treasurer view. The values live in the database (see the PaymentSettings entity) and
 * are what the QR payment and the payment e-mail are built from, so a change here reaches every
 * member's payment card without a deploy.
 *
 * Editing is admin-only, which the API decides — the buttons follow the root `updatePaymentSettings`
 * link (the settings are a single row, so its permission hangs off the API root) rather than a role
 * check here.
 */
@Component({
	selector: "bo-payment-settings",
	templateUrl: "./payment-settings.component.html",
	styleUrl: "./payment-settings.component.scss",

	imports: [
		PageHeaderComponent,
		IonContent,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		EditButtonTextComponent,
		EditButtonNumberComponent,
		IonIcon,
		IonSkeletonText,
	],
})
export class PaymentSettingsComponent implements OnInit {
	settings = signal<SDK.PaymentSettingsResponseWithLinks | undefined>(undefined);

	canEdit = computed(() => this.api.links()?.updatePaymentSettings.allowed ?? false);

	/** Account number as it is written on a transfer: `[prefix-]number/bankCode`. */
	accountDisplay = computed(() => {
		const settings = this.settings();
		return settings ? `${settings.accountNumber}/${settings.bankCode}` : "";
	});

	constructor(
		private readonly api: ApiService,
		private readonly toasts: ToastService,
	) {
		addIcons({ cardOutline });
	}

	ngOnInit(): void {
		this.load();
	}

	private async load() {
		this.settings.set(await this.api.PaymentsApi.getPaymentSettings().then((res) => res.data));
	}

	async update(data: SDK.PaymentSettingsUpdateBody) {
		if (!this.canEdit()) return;

		try {
			const settings = await this.api.PaymentsApi.updatePaymentSettings(data).then((res) => res.data);
			this.settings.set(settings);
			this.toasts.toast("Uloženo.");
		} catch (e) {
			this.toasts.toast("Chyba při ukládání.", { color: "danger" });
			// The card keeps showing what the server last confirmed.
			await this.load();
		}
	}

	updateAccountNumber(accountNumber: string | null) {
		if (accountNumber) this.update({ accountNumber });
	}

	updateBankCode(bankCode: string | null) {
		if (bankCode) this.update({ bankCode });
	}

	updateAmount(amount: number | null) {
		if (amount !== null) this.update({ amount });
	}
}
