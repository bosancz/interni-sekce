import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ModalController } from "@ionic/angular";
import { IonButton, IonButtons, IonInput, IonItem, IonSelect, IonSelectOption } from "@ionic/angular/standalone";
import { EventExpenseTypes } from "src/app/core/config/event-expense-types";
import { AbstractModalComponent } from "src/app/services/modal.service";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-event-expense-modal",
	templateUrl: "./event-expense-modal.component.html",
	styleUrls: ["./event-expense-modal.component.scss"],
	
	imports: [CommonModule, FormsModule, IonItem, IonInput, IonSelect, IonSelectOption, IonButtons, IonButton],
})
export class EventExpenseModalComponent extends AbstractModalComponent<SDK.EventExpenseResponse> implements OnInit {
	@Input() expense!: SDK.EventExpenseResponse;

	types = EventExpenseTypes;

	constructor(modalController: ModalController) {
		super(modalController);
	}

	ngOnInit(): void {}
}
