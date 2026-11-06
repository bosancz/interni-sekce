import { Component, computed, inject, signal } from "@angular/core";
import { ModalController } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";
import { formatPaymentAmount, getPaymentMailto } from "../../helpers/payment-request";

@Component({
	selector: "bo-member-payment-custom-modal",
	templateUrl: "./member-payment-custom-modal.component.html",
	styleUrl: "./member-payment-custom-modal.component.scss",
	imports: [ModalLayoutComponent],
})
export class MemberPaymentCustomModalComponent extends InputModalComponent<void> {
	member!: SDK.MemberResponse;
	recipients: string[] = [];
	currency = "CZK";

	private readonly api = inject(ApiService);
	private readonly toasts = inject(ToastService);

	readonly amountText = signal("");
	readonly loading = signal(false);
	readonly payment = signal<SDK.MemberPaymentRequestResponseWithLinks | null>(null);

	readonly amount = computed(() => {
		const text = this.amountText().replace(/\s/g, "");
		if (!/^\d+$/.test(text)) return null;
		const amount = Number(text);
		return amount > 0 ? amount : null;
	});

	readonly currencyLabel = computed(() => (this.currency === "CZK" ? "Kč" : this.currency));

	readonly formattedAmount = computed(() => {
		const payment = this.payment();
		return payment ? formatPaymentAmount(payment) : "";
	});

	readonly mailto = computed(() => {
		const payment = this.payment();
		return payment ? getPaymentMailto(payment, this.recipients, this.member) : undefined;
	});

	constructor(modalController: ModalController) {
		super(modalController);
	}

	setAmount(value: string) {
		this.amountText.set(value);
		this.payment.set(null);
	}

	async generate(event?: Event) {
		event?.preventDefault();

		const amount = this.amount();
		if (amount === null || this.loading()) return;

		this.loading.set(true);
		try {
			const payment = await this.api.MembersApi.getMemberPaymentRequest(this.member.id, { amount }).then(
				(res) => res.data,
			);
			this.payment.set(payment);
		} catch {
			this.toasts.toast("QR kód se nepodařilo vytvořit.", { color: "danger" });
		} finally {
			this.loading.set(false);
		}
	}

	openQrCode() {
		const payment = this.payment();
		if (payment) window.open(payment.qrCodeUrl, "_blank", "noopener,noreferrer");
	}
}
