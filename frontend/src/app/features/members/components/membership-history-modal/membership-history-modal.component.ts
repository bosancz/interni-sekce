import { Component } from "@angular/core";
import { ModalController } from "@ionic/angular/standalone";
import { MembershipPaymentStates } from "src/app/core/config/membership";
import { currentMembershipYear, membershipPaymentOf } from "src/app/core/helpers/membership";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

interface MembershipHistoryRow {
	year: number;
	paid: boolean;
	amount: string | null;
	note: string | null;
}

@Component({
	selector: "bo-membership-history-modal",
	templateUrl: "./membership-history-modal.component.html",
	styleUrl: "./membership-history-modal.component.scss",
	imports: [ModalLayoutComponent],
})
export class MembershipHistoryModalComponent extends InputModalComponent<void> {
	membership: SDK.MembershipPaymentResponse[] = [];
	currency = "CZK";

	readonly paidTitle = MembershipPaymentStates.zaplaceno.title;
	readonly unpaidTitle = MembershipPaymentStates.nezaplaceno.title;

	constructor(modalController: ModalController) {
		super(modalController);
	}

	get rows(): MembershipHistoryRow[] {
		const current = currentMembershipYear();
		const oldest = Math.min(current - 1, ...this.membership.map((payment) => payment.forYear));
		const currency = this.currency === "CZK" ? "Kč" : this.currency;

		const rows: MembershipHistoryRow[] = [];
		for (let year = current; year >= oldest; year--) {
			const payment = membershipPaymentOf(this.membership, year);
			rows.push({
				year,
				paid: !!payment,
				note: payment?.note || null,
				amount:
					payment && payment.amount !== null && payment.amount !== undefined
						? `${payment.amount} ${currency}`
						: null,
			});
		}
		return rows;
	}
}
