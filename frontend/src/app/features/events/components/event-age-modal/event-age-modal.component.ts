import { Component } from "@angular/core";
import { ModalController } from "@ionic/angular/standalone";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";
import { EventAgeHistogramComponent } from "../event-age-histogram/event-age-histogram.component";

@Component({
	selector: "bo-event-age-modal",
	templateUrl: "./event-age-modal.component.html",
	styleUrl: "./event-age-modal.component.scss",
	imports: [ModalLayoutComponent, EventAgeHistogramComponent],
})
export class EventAgeModalComponent extends InputModalComponent<void> {
	event!: SDK.EventResponseWithLinks;
	attendees: SDK.EventAttendeeResponse[] = [];
	leaders: SDK.EventAttendeeResponse[] = [];

	constructor(modalController: ModalController) {
		super(modalController);
	}
}
