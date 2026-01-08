import { CommonModule } from "@angular/common";
import { Component, ElementRef, input, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { IonButton } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { SDK } from "src/sdk";
import { EventsService } from "../../services/events.service";

@UntilDestroy()
@Component({
	selector: "bo-event-registration",
	templateUrl: "./event-registration.component.html",
	styleUrls: ["./event-registration.component.scss"],
	imports: [CommonModule, FormsModule, IonButton],
})
export class EventRegistrationComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();

	uploadingRegistration: boolean = false;

	@ViewChild("registrationInput") registrationInput!: ElementRef<HTMLInputElement>;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private eventService: EventsService,
		private sanitizer: DomSanitizer,
	) {}

	uploadRegistrationSelect() {
		this.registrationInput.nativeElement.click();
	}

	async uploadRegistration(input: HTMLInputElement) {
		const event = this.event();
		if (!event) return;

		if (!input.files?.length) return;

		let file = input.files![0];

		if (file.name.split(".").pop()?.toLowerCase() !== "pdf") {
			this.toastService.toast("Soubor musí být ve formátu PDF");
			this.uploadingRegistration = false;

			return;
		}

		this.uploadingRegistration = true;

		try {
			await this.api.EventsApi.saveEventRegistration(event.id, { registration: file });
		} catch (err: any) {
			this.toastService.toast("Nastala chyba při nahrávání: " + err.message);
			return;
		} finally {
			this.uploadingRegistration = false;
		}

		this.toastService.toast("Přihláška nahrána.");

		// Note: This component doesn't have a way to update the signal input
		// The parent component should handle updating the event
	}

	async deleteRegistration() {
		const event = this.event();
		if (!event) return;

		await this.api.EventsApi.deleteEventRegistration(event.id);
		this.toastService.toast("Přihláška smazána.");
		// Note: This component doesn't have a way to update the signal input
		// The parent component should handle updating the event
	}

	async getRegistration() {
		const event = this.event();
		if (!event) return;

		const response = (await this.api.EventsApi.getEventRegistration(event.id, {
			responseType: "blob",
		})) as any;

		const fileBlob = new Blob([response.data], { type: "application/pdf" });
		const fileUrl = window.URL.createObjectURL(fileBlob);

		const link = document.createElement("a");
		link.href = fileUrl;
		link.target = "_blank";

		document.body.appendChild(link);
		link.click();

		// 4. Cleanup
		document.body.removeChild(link);
		window.URL.revokeObjectURL(fileUrl);
	}
}
