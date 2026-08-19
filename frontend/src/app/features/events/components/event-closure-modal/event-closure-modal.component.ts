import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { checkmarkOutline } from "ionicons/icons";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-event-closure-modal",
	templateUrl: "./event-closure-modal.component.html",
	styleUrl: "./event-closure-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent],
})
export class EventClosureModalComponent extends InputModalComponent<{ accountingSent: boolean }> implements OnInit {
	event!: SDK.EventResponseWithLinks;

	accountingSent = signal(false);

	accountingEditable = computed(() =>
		this.event.accountingSentAt
			? this.event._links.unmarkAccountingSent.allowed
			: this.event._links.markAccountingSent.applicable && this.event._links.markAccountingSent.allowed,
	);

	autoItems = computed(() => {
		const album = this.event.album;

		return [
			{
				key: "report",
				label: "Report vyplněn",
				helper: "Zaškrtne se samo, jakmile je vyplněný report akce.",
				done: !!this.event.report,
			},
			{
				key: "album",
				label: "Galerie zveřejněna",
				helper: !album
					? "K akci není připojená žádná galerie."
					: album.status === "public"
						? "Připojená galerie je zveřejněná."
						: "Připojená galerie zatím není zveřejněná.",
				done: album?.status === "public",
			},
		];
	});

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ checkmarkOutline });
	}

	ngOnInit(): void {
		this.accountingSent.set(!!this.event.accountingSentAt);
	}

	save() {
		this.submit.emit({ accountingSent: this.accountingSent() });
	}
}
