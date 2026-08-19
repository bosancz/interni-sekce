import { Component, computed, OnInit, signal } from "@angular/core";
import {
	IonButton,
	IonButtons,
	IonCheckbox,
	IonItem,
	IonList,
	IonNote,
	ModalController,
} from "@ionic/angular/standalone";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-event-closure-modal",
	templateUrl: "./event-closure-modal.component.html",
	styleUrl: "./event-closure-modal.component.scss",
	imports: [IonButton, IonButtons, IonCheckbox, IonItem, IonList, IonNote, ModalLayoutComponent],
})
export class EventClosureModalComponent extends InputModalComponent<{ accountingSent: boolean }> implements OnInit {
	event!: SDK.EventResponseWithLinks;

	accountingSent = signal(false);

	accountingEditable = computed(() =>
		this.event.accountingSentAt
			? this.event._links.unmarkAccountingSent.allowed
			: this.event._links.markAccountingSent.applicable && this.event._links.markAccountingSent.allowed,
	);

	reportFilled = computed(() => !!this.event.report);

	albumPublished = computed(() => this.event.album?.status === "public");

	albumHint = computed(() =>
		!this.event.album
			? "K akci není připojená žádná galerie."
			: this.albumPublished()
				? "Připojená galerie je zveřejněná."
				: "Připojená galerie zatím není zveřejněná.",
	);

	constructor(modalController: ModalController) {
		super(modalController);
	}

	ngOnInit(): void {
		this.accountingSent.set(!!this.event.accountingSentAt);
	}

	save() {
		this.submit.emit({ accountingSent: this.accountingSent() });
	}
}
