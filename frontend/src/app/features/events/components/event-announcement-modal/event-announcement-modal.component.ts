import { Component, computed, OnInit, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline } from "ionicons/icons";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-event-announcement-modal",
	templateUrl: "./event-announcement-modal.component.html",
	styleUrl: "./event-announcement-modal.component.scss",
	imports: [DatePipe, IonIcon, ModalLayoutComponent],
})
export class EventAnnouncementModalComponent extends InputModalComponent<{ sent: boolean }> implements OnInit {
	event!: SDK.EventResponseWithLinks;

	sent = signal(false);

	sentAt = computed(() => this.event.announcementSentAt);

	editable = computed(() =>
		this.event.announcementSentAt
			? this.event._links.unmarkAnnouncementSent.allowed
			: this.event._links.markAnnouncementSent.applicable && this.event._links.markAnnouncementSent.allowed,
	);

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ checkmarkOutline });
	}

	ngOnInit(): void {
		this.sent.set(!!this.event.announcementSentAt);
	}

	save() {
		this.submit.emit({ sent: this.sent() });
	}
}
