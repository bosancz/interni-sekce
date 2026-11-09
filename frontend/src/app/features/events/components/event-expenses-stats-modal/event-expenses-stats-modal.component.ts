import { Component } from "@angular/core";
import { ModalController } from "@ionic/angular/standalone";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";
import { EventExpensesChartComponent } from "../event-expenses-chart/event-expenses-chart.component";

@Component({
	selector: "bo-event-expenses-stats-modal",
	templateUrl: "./event-expenses-stats-modal.component.html",
	styleUrl: "./event-expenses-stats-modal.component.scss",
	imports: [ModalLayoutComponent, EventExpensesChartComponent],
})
export class EventExpensesStatsModalComponent extends InputModalComponent<void> {
	expenses: SDK.EventExpenseResponseWithLinks[] = [];
	personDays = 1;

	constructor(modalController: ModalController) {
		super(modalController);
	}
}
