import { Component, computed, OnInit, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline } from "ionicons/icons";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-event-accounting-modal",
	templateUrl: "./event-accounting-modal.component.html",
	styleUrl: "./event-accounting-modal.component.scss",
	imports: [DatePipe, IonIcon, ModalLayoutComponent],
})
export class EventAccountingModalComponent extends InputModalComponent<{ sent: boolean }> implements OnInit {
	event!: SDK.EventResponseWithLinks;

	sent = signal(false);

	sentAt = computed(() => this.event.accountingSentAt);

	editable = computed(() =>
		this.event.accountingSentAt
			? this.event._links.unmarkAccountingSent.allowed
			: this.event._links.markAccountingSent.applicable && this.event._links.markAccountingSent.allowed,
	);

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ checkmarkOutline });
	}

	ngOnInit(): void {
		this.sent.set(!!this.event.accountingSentAt);
	}

	save() {
		this.submit.emit({ sent: this.sent() });
	}
}
