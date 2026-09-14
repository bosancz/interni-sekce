import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BugReportModalComponent } from "../components/bug-report-modal/bug-report-modal.component";
import { ApiService } from "./api.service";
import { ModalService } from "./modal.service";
import { ToastService } from "./toast.service";

@Injectable({
	providedIn: "root",
})
export class BugReportService {
	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
		private router: Router,
	) {}

	async reportBug() {
		const url = window.location.href;

		const result = await this.modalService.componentModal(
			BugReportModalComponent,
			{},
			{ cssClass: "dialog-brand" },
		);

		if (!result) return;

		if (result.action === "list") {
			await this.router.navigate(["/ucet/chyby"]);
			return;
		}

		try {
			await this.api.FeedbackApi.sendBugReport({ description: result.description, url });
			await this.toastService.toast("Díky! Chyba byla odeslána.");
		} catch {
			await this.toastService.toast("Chybu se nepodařilo odeslat.");
		}
	}
}
