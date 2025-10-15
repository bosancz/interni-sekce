import { Component, Input, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { EventExpenseTypes } from "src/app/config/event-expense-types";
import { AbstractModalComponent } from "src/app/services/modal.service";

@Component({
	selector: "bo-event-expense-modal",
	templateUrl: "./event-expense-modal.component.html",
	styleUrls: ["./event-expense-modal.component.scss"],
	standalone: false,
})
export class EventExpenseModalComponent
	extends AbstractModalComponent<BackendApiTypes.EventExpenseResponse>
	implements OnInit
{
	@Input() expense!: BackendApiTypes.EventExpenseResponse;

	types = EventExpenseTypes;

	constructor(modalController: ModalController) {
		super(modalController);
	}

	ngOnInit(): void {}
}
