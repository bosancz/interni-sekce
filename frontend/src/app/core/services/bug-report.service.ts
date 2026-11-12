import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Config } from "src/config";
import { SDK } from "src/sdk";
import { describeElement, DomElementDescription } from "src/helpers/dom-element";
import {
	BugReportModalComponent,
	BugReportModalResult,
} from "../components/bug-report-modal/bug-report-modal.component";
import { ApiService } from "./api.service";
import { ElementPickerService } from "./element-picker.service";
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
		private config: Config,
		private elementPickerService: ElementPickerService,
	) {}

	async reportBug() {
		const url = window.location.href;

		let description = "";
		let element: DomElementDescription | null = null;

		while (true) {
			const result: BugReportModalResult | null = await this.modalService.componentModal(
				BugReportModalComponent,
				{ initialDescription: description, initialElement: element },
				{ cssClass: "dialog-brand" },
			);

			if (!result) return;

			if (result.action === "list") {
				await this.router.navigate(["/ucet/chyby"]);
				return;
			}

			description = result.description;
			element = result.element;

			if (result.action === "pick") {
				const picked = await this.elementPickerService.pick();
				if (picked) element = describeElement(picked, this.config.bugReport.elementTextMaxLength);
				continue;
			}

			await this.send(url, description, element);
			return;
		}
	}

	private async send(url: string, description: string, element: DomElementDescription | null) {
		try {
			await this.api.FeedbackApi.sendBugReport({
				description,
				url,
				frontendVersion: this.config.version,
				screenWidth: window.screen?.width,
				screenHeight: window.screen?.height,
				pixelRatio: window.devicePixelRatio,
				viewportWidth: window.innerWidth,
				viewportHeight: window.innerHeight,
				displayMode: this.getDisplayMode(),
				pointer: this.getPointerType(),
				element: element
					? {
							selector: element.selector,
							components: element.components || undefined,
							text: element.text || undefined,
							rect: element.rect,
						}
					: undefined,
			});
			await this.toastService.toast("Díky! Chyba byla odeslána.");
		} catch {
			await this.toastService.toast("Chybu se nepodařilo odeslat.");
		}
	}

	private getDisplayMode(): SDK.BugReportDisplayModesEnum | undefined {
		if ((window.navigator as unknown as { standalone?: boolean }).standalone)
			return SDK.BugReportDisplayModesEnum.Standalone;

		if (!window.matchMedia) return undefined;

		if (window.matchMedia("(display-mode: fullscreen)").matches) return SDK.BugReportDisplayModesEnum.Fullscreen;
		if (window.matchMedia("(display-mode: standalone)").matches) return SDK.BugReportDisplayModesEnum.Standalone;
		if (window.matchMedia("(display-mode: minimal-ui)").matches) return SDK.BugReportDisplayModesEnum.MinimalUi;

		return SDK.BugReportDisplayModesEnum.Browser;
	}

	private getPointerType(): SDK.BugReportPointerTypesEnum | undefined {
		if (!window.matchMedia) return undefined;

		const fine = window.matchMedia("(any-pointer: fine)").matches;
		const coarse = window.matchMedia("(any-pointer: coarse)").matches;

		if (fine && coarse) return SDK.BugReportPointerTypesEnum.Both;
		if (fine) return SDK.BugReportPointerTypesEnum.Fine;
		if (coarse) return SDK.BugReportPointerTypesEnum.Coarse;

		return SDK.BugReportPointerTypesEnum.None;
	}
}
