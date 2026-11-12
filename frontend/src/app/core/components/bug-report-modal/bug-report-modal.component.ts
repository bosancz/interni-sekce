import { Component, computed, OnInit, signal } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { closeOutline, locateOutline, timeOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { DomElementDescription } from "src/helpers/dom-element";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";

export type BugReportModalResult =
	| { action: "submit" | "pick"; description: string; element: DomElementDescription | null }
	| { action: "list" };

@Component({
	selector: "bo-bug-report-modal",
	templateUrl: "./bug-report-modal.component.html",
	styleUrl: "./bug-report-modal.component.scss",
	imports: [ModalLayoutComponent, IonIcon],
})
export class BugReportModalComponent extends InputModalComponent<BugReportModalResult> implements OnInit {
	initialDescription = "";
	initialElement: DomElementDescription | null = null;

	description = signal("");
	element = signal<DomElementDescription | null>(null);

	canListBugReports = computed(() => !!this.api.links()?.listBugReports?.allowed);

	constructor(
		modalController: ModalController,
		private api: ApiService,
	) {
		super(modalController);
		addIcons({ timeOutline, locateOutline, closeOutline });
	}

	ngOnInit() {
		this.description.set(this.initialDescription);
		this.element.set(this.initialElement);
	}

	send() {
		const description = this.description().trim();
		if (!description) return;

		this.submit.emit({ action: "submit", description, element: this.element() });
	}

	pickElement() {
		this.submit.emit({ action: "pick", description: this.description(), element: this.element() });
	}

	removeElement() {
		this.element.set(null);
	}

	openList() {
		this.submit.emit({ action: "list" });
	}
}
