import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
	IonButton,
	IonButtons,
	IonInput,
	IonItem,
	IonSelect,
	IonSelectOption,
	ModalController,
} from "@ionic/angular/standalone";
import { EventExpenseTypes } from "src/app/core/config/event-expense-types";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";
import { EventExpenseTypesInfoComponent } from "../event-expense-types-info/event-expense-types-info.component";

@Component({
	selector: "bo-event-expense-modal",
	templateUrl: "./event-expense-modal.component.html",
	styleUrls: ["./event-expense-modal.component.scss"],

	imports: [
		CommonModule,
		FormsModule,
		IonItem,
		IonInput,
		IonSelect,
		IonSelectOption,
		IonButtons,
		IonButton,
		ModalLayoutComponent,
		EventExpenseTypesInfoComponent,
	],
})
export class EventExpenseModalComponent extends InputModalComponent<SDK.EventExpenseResponse> implements OnInit {
	expense?: Partial<SDK.EventExpenseResponse>;

	types = EventExpenseTypes;

	constructor(modalController: ModalController) {
		super(modalController);
	}

	/**
	 * KeyValuePipe sorts by key by default, which would scramble the accounting order of the
	 * categories; keep them in the order EventExpenseTypes declares them.
	 */
	keepOrder = () => 0;

	amountPattern = /^\s*-?\s*\d[\d\s]*([,.]\d+)?\s*$/;

	ngOnInit(): void {}

	formatAmount(amount: number | string | undefined) {
		if (amount === undefined || amount === null || amount === "") return "";
		return String(Number(amount)).replace(".", ",");
	}

	save(value: Omit<SDK.EventExpenseResponse, "amount"> & { amount: string }) {
		this.submit.emit({ ...value, amount: this.parseAmount(value.amount) });
	}

	private parseAmount(amount: string) {
		return Number(amount.replace(/\s/g, "").replace(",", "."));
	}
}
