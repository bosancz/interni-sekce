import { Component, Input, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { EventExpenseTypes } from "src/app/config/event-expense-types";
import { AbstractModalComponent } from "src/app/services/modal.service";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-event-expense-modal",
	templateUrl: "./event-expense-modal.component.html",
	styleUrls: ["./event-expense-modal.component.scss"],
	standalone: false,
})
export class EventExpenseModalComponent extends AbstractModalComponent<SDK.EventExpenseResponse> implements OnInit {
	@Input() expense!: SDK.EventExpenseResponse;

	types = EventExpenseTypes;

	constructor(modalController: ModalController) {
		super(modalController);
	}

	ngOnInit(): void {}
}
