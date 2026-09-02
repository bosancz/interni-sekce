import { Component, computed, signal } from "@angular/core";
import { ModalController } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";

export type BugReportModalResult = { action: "submit"; description: string } | { action: "list" };

@Component({
	selector: "bo-bug-report-modal",
	templateUrl: "./bug-report-modal.component.html",
	styleUrl: "./bug-report-modal.component.scss",
	imports: [ModalLayoutComponent],
})
export class BugReportModalComponent extends InputModalComponent<BugReportModalResult> {
	description = signal("");

	canListBugReports = computed(() => !!this.api.links()?.listBugReports?.allowed);

	constructor(
		modalController: ModalController,
		private api: ApiService,
	) {
		super(modalController);
	}

	send() {
		const description = this.description().trim();
		if (!description) return;

		this.submit.emit({ action: "submit", description });
	}

	openList() {
		this.submit.emit({ action: "list" });
	}
}
